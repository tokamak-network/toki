import { NextRequest, NextResponse } from "next/server";

// AI Access key usage proxy. Reads the user's LiteLLM virtual-key budget/limits
// from the AI server's /key/info (the key authenticates for its own info) so the
// UI can show today's usage. Proxied server-side to avoid CORS; key is not stored.
const LLM_URL = process.env.AI_ACCESS_LLM_URL ?? "https://api2.ai.tokamak.network";

export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json();
    if (typeof key !== "string" || !key.startsWith("sk-")) {
      return NextResponse.json({ error: "Missing or invalid key" }, { status: 401 });
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
