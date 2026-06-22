import { NextRequest, NextResponse } from "next/server";
import { verifyPrivyUser, isPrivyServerConfigured } from "@/lib/privyServer";
import { getDecryptedKey } from "@/lib/aiKeyStore";

// Agent Workspace proxy (Stage 2). The user's AI Access key is resolved
// server-side from their encrypted vault (keyed by the verified Privy user) — the
// browser never sends or holds the key. Proxying also avoids CORS, normalizes the
// model, and adds guardrails (timeout, clamping). See docs/ai-agent-workspace.md.
const LLM_URL = process.env.AI_ACCESS_LLM_URL ?? "https://api2.ai.tokamak.network";
const MODEL = process.env.AI_ACCESS_MODEL ?? "qwen-3.6";
// Models the AI server exposes — gate the per-agent override so only known
// models reach upstream (unknown strings just error there anyway).
const ALLOWED_MODELS = ["qwen-3.6", "deepseek-v4-flash", "gemma-4"];

interface InMessage {
  role?: string;
  content?: unknown;
}

export async function POST(req: NextRequest) {
  try {
    if (!isPrivyServerConfigured) {
      return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
    }
    const userId = await verifyPrivyUser(req);
    if (!userId) {
      // Session token couldn't be verified — NOT a key problem; client should re-auth.
      return NextResponse.json({ error: "Unauthorized", reason: "auth" }, { status: 401 });
    }
    const key = await getDecryptedKey(userId);
    if (!key) {
      return NextResponse.json({ error: "No key", reason: "nokey" }, { status: 401 });
    }

    const { messages, system, model } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages" }, { status: 400 });
    }

    // Clamp history + content to keep requests bounded.
    const history = (messages as InMessage[]).slice(-20).map((m) => ({
      role: m.role === "assistant" || m.role === "system" ? m.role : "user",
      content: String(m.content ?? "").slice(0, 4000),
    }));

    // Optional per-agent system prompt (prepended) + model override (allowlisted).
    const safeMessages =
      typeof system === "string" && system.trim()
        ? [{ role: "system", content: system.slice(0, 4000) }, ...history]
        : history;
    const useModel =
      typeof model === "string" && ALLOWED_MODELS.includes(model) ? model : MODEL;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(`${LLM_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: useModel,
        messages: safeMessages,
        max_tokens: 1024,
        temperature: 0.7,
        // qwen-3.6 is a reasoning model — with thinking ON it spends the whole
        // token budget on `reasoning_content` and returns an empty `content`
        // (verified against api2.ai.tokamak.network). Turn thinking off so the
        // chat gets a direct answer.
        chat_template_kwargs: { enable_thinking: false },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    // Budget exhausted usually surfaces as 429 — a soft daily limit, not a dead key.
    if (res.status === 429) {
      return NextResponse.json({ error: "Daily limit reached", reason: "budget" }, { status: 429 });
    }
    if (res.status === 401 || res.status === 403) {
      // An over-budget / blocked key ALSO 401s here. Ask /key/info to disambiguate
      // budget (soft) vs expired / revoked (dead) so the client reacts correctly.
      let reason = "revoked";
      try {
        const infoRes = await fetch(`${LLM_URL}/key/info`, {
          headers: { Authorization: `Bearer ${key}` },
        });
        if (infoRes.ok) {
          const info = ((await infoRes.json())?.info ?? {}) as Record<string, unknown>;
          const spend = typeof info.spend === "number" ? info.spend : 0;
          const maxBudget = typeof info.max_budget === "number" ? info.max_budget : null;
          const expires = typeof info.expires === "string" ? info.expires : null;
          if (info.blocked || (maxBudget != null && spend >= maxBudget)) reason = "budget";
          else if (expires && new Date(expires).getTime() < Date.now()) reason = "expired";
        }
      } catch {
        // keep default "revoked"
      }
      if (reason === "budget") {
        return NextResponse.json({ error: "Daily limit reached", reason }, { status: 429 });
      }
      return NextResponse.json({ error: "Key rejected", reason }, { status: 401 });
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `AI server error ${res.status}`, detail: detail.slice(0, 200) },
        { status: 502 },
      );
    }

    const data = await res.json();
    const msg = data.choices?.[0]?.message;
    // Prefer the answer; fall back to reasoning text if a model still returns
    // empty content (so the chat never shows a blank reply).
    const reply = msg?.content || msg?.reasoning_content || "";
    return NextResponse.json({ reply });
  } catch (e) {
    const isTimeout = e instanceof DOMException && e.name === "AbortError";
    return NextResponse.json(
      { error: isTimeout ? "Timeout" : "Request failed" },
      { status: isTimeout ? 504 : 500 },
    );
  }
}
