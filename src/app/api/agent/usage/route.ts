import { NextRequest, NextResponse } from "next/server";
import { verifyPrivyUser, isPrivyServerConfigured } from "@/lib/privyServer";
import { getDecryptedKey } from "@/lib/aiKeyStore";

// AI Access key usage proxy (Stage 2). Resolves the user's key server-side from
// their encrypted vault (verified Privy user) and reads the LiteLLM /key/info
// budget/limits. The browser never sends the key.
const LLM_URL = process.env.AI_ACCESS_LLM_URL ?? "https://api2.ai.tokamak.network";

export async function POST(req: NextRequest) {
  try {
    if (!isPrivyServerConfigured) {
      return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
    }
    const userId = await verifyPrivyUser(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const key = await getDecryptedKey(userId);
    if (!key) {
      return NextResponse.json({ error: "No key" }, { status: 401 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(`${LLM_URL}/key/info`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.status === 401 || res.status === 403) {
      return NextResponse.json({ error: "Key rejected" }, { status: 401 });
    }
    if (!res.ok) {
      return NextResponse.json({ error: `AI server error ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const info = (data?.info ?? {}) as Record<string, unknown>;
    const num = (v: unknown) => (typeof v === "number" ? v : null);

    return NextResponse.json({
      spend: num(info.spend) ?? 0,
      maxBudget: num(info.max_budget),
      resetAt: typeof info.budget_reset_at === "string" ? info.budget_reset_at : null,
      budgetDuration: typeof info.budget_duration === "string" ? info.budget_duration : null,
      rpmLimit: num(info.rpm_limit),
      tpmLimit: num(info.tpm_limit),
      expiresAt: typeof info.expires === "string" ? info.expires : null,
      blocked: !!info.blocked,
    });
  } catch (e) {
    const isTimeout = e instanceof DOMException && e.name === "AbortError";
    return NextResponse.json(
      { error: isTimeout ? "Timeout" : "Request failed" },
      { status: isTimeout ? 504 : 500 },
    );
  }
}
