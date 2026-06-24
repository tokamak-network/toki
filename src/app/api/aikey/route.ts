import { NextRequest, NextResponse } from "next/server";
import { verifyPrivyUser, isPrivyServerConfigured } from "@/lib/privyServer";
import { isEncryptionConfigured } from "@/lib/crypto";
import { storeKey, getStatus, getDecryptedKey, deleteKey } from "@/lib/aiKeyStore";

// Stage 2 server-side key vault. The AI Access key is stored encrypted at rest,
// keyed by the authenticated Privy user — it no longer lives in the browser.
//   POST   { key, expiresAt?, address? }  → store/replace (encrypts)
//   GET                                    → { hasKey, lastFour, expiresAt }
//   GET    ?reveal=1                       → { key }  (explicit decrypt for export)
//   DELETE                                 → { ok }
function configError(): NextResponse | null {
  if (!isPrivyServerConfigured)
    return NextResponse.json({ error: "Auth not configured (PRIVY_APP_SECRET)" }, { status: 503 });
  if (!isEncryptionConfigured)
    return NextResponse.json({ error: "Vault not configured (AI_KEY_ENC_SECRET)" }, { status: 503 });
  return null;
}

export async function POST(req: NextRequest) {
  const cfg = configError();
  if (cfg) return cfg;
  const userId = await verifyPrivyUser(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { key, expiresAt, address } = await req.json();
    if (typeof key !== "string" || !key.startsWith("sk-") || key.length > 512) {
      return NextResponse.json({ error: "Invalid key" }, { status: 400 });
    }
    const status = await storeKey(userId, key, typeof expiresAt === "string" ? expiresAt : "", typeof address === "string" ? address : undefined);
    return NextResponse.json({ ok: true, ...status });
  } catch {
    return NextResponse.json({ error: "Store failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!isPrivyServerConfigured)
    return NextResponse.json({ hasKey: false, lastFour: null, expiresAt: null }, { status: 200 });
  const userId = await verifyPrivyUser(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    if (req.nextUrl.searchParams.get("reveal") === "1") {
      const key = await getDecryptedKey(userId);
      if (!key) return NextResponse.json({ key: null }, { status: 404 });
      return NextResponse.json({ key });
    }
    return NextResponse.json(await getStatus(userId));
  } catch {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const cfg = configError();
  if (cfg) return cfg;
  const userId = await verifyPrivyUser(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await deleteKey(userId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
