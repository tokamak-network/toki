import { NextRequest, NextResponse } from "next/server";

// Agent Workspace proxy (Stage 1 MVP). Forwards a chat turn to the Tokamak AI
// server using the *user's* issued AI Access key (sent per request). Proxying
// avoids cross-origin CORS with the AI server, normalizes the model name, and
// adds server-side guardrails (timeout, clamping). The key is never stored here.
// See docs/ai-agent-workspace.md.
const LLM_URL = process.env.AI_ACCESS_LLM_URL ?? "https://api2.ai.tokamak.network";
const MODEL = process.env.AI_ACCESS_MODEL ?? "qwen-3.6";

interface InMessage {
  role?: string;
  content?: unknown;
}

export async function POST(req: NextRequest) {
  try {
    const { key, messages } = await req.json();

    if (typeof key !== "string" || !key.startsWith("sk-")) {
      return NextResponse.json({ error: "Missing or invalid key" }, { status: 401 });
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages" }, { status: 400 });
    }

    // Clamp history + content to keep requests bounded.
    const safeMessages = (messages as InMessage[]).slice(-20).map((m) => ({
      role: m.role === "assistant" || m.role === "system" ? m.role : "user",
      content: String(m.content ?? "").slice(0, 4000),
    }));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(`${LLM_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
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

    if (res.status === 401 || res.status === 403) {
      return NextResponse.json({ error: "Key rejected (expired or revoked)" }, { status: 401 });
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
