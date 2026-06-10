"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { useTranslation } from "@/components/providers/LanguageProvider";
import {
  agentChat,
  loadIssuedKey,
  saveIssuedKey,
  clearIssuedKey,
  AiAccessError,
  type AgentMessage,
} from "@/lib/aiAccess";

// Stage 1 MVP agentic chat. Uses the user's issued AI Access key (from
// localStorage) via the /api/agent proxy. Distinct from TokiChat (consultation).
export default function AgentWorkspace() {
  const { ready, authenticated } = usePrivy();
  const router = useRouter();
  const { t } = useTranslation();
  const a = t.agent;

  const [apiKey, setApiKey] = useState<string | null>(null);
  const [pasteValue, setPasteValue] = useState("");
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ready && !authenticated) router.push("/");
  }, [ready, authenticated, router]);

  useEffect(() => {
    const stored = loadIssuedKey();
    if (stored) setApiKey(stored.key);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || !apiKey || busy) return;
    setError(null);
    const next: AgentMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const reply = await agentChat(apiKey, next);
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e) {
      if (e instanceof AiAccessError && e.status === 401) {
        setError(a.keyExpired);
        clearIssuedKey();
        setApiKey(null);
      } else {
        setError(a.errorGeneric);
      }
    }
    setBusy(false);
  }, [input, apiKey, busy, messages, a]);

  const usePastedKey = () => {
    const v = pasteValue.trim();
    if (!v.startsWith("sk-")) return;
    saveIssuedKey({ key: v, expiresAt: "" });
    setApiKey(v);
    setPasteValue("");
  };

  if (!ready || !authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grid flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 pt-20 pb-6 flex flex-col">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🤖</span> {a.title}
          </h1>
          <p className="text-sm text-gray-500">{a.subtitle}</p>
        </div>

        {!apiKey ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            <div className="text-5xl">🔑</div>
            <div>
              <div className="text-lg font-semibold text-white">{a.emptyTitle}</div>
              <p className="text-sm text-gray-500 mt-1 max-w-sm">{a.emptyDesc}</p>
            </div>
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-blue to-accent-cyan text-white text-sm font-semibold hover:scale-[1.02] transition-transform"
            >
              {a.getKeyCta} →
            </Link>
            <div className="w-full max-w-sm mt-4 text-left">
              <label className="block text-xs text-gray-500 mb-1">{a.pasteKeyLabel}</label>
              <div className="flex gap-2">
                <input
                  value={pasteValue}
                  onChange={(e) => setPasteValue(e.target.value)}
                  placeholder="sk-litellm-…"
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200 font-mono focus:outline-none focus:border-accent-cyan/40"
                />
                <button
                  onClick={usePastedKey}
                  className="px-4 py-2 rounded-lg bg-white/10 text-sm text-gray-200 hover:bg-white/15 transition-colors"
                >
                  {a.pasteKeyCta}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-3">
              {messages.length === 0 && (
                <div className="text-sm text-gray-600 text-center mt-10">{a.placeholder}</div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-accent-blue/30 text-white"
                        : "bg-white/[0.06] text-gray-200"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex justify-start">
                  <div className="px-4 py-2.5 rounded-2xl bg-white/[0.06] text-gray-400 text-sm">
                    {a.thinking}
                  </div>
                </div>
              )}
            </div>

            {error && <div className="mb-2 text-xs text-red-300">{error}</div>}

            <div className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder={a.placeholder}
                className="flex-1 resize-none px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-100 focus:outline-none focus:border-accent-cyan/40"
              />
              <button
                onClick={send}
                disabled={busy || !input.trim()}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-accent-blue to-accent-cyan text-white text-sm font-semibold disabled:opacity-40 hover:scale-[1.02] transition-transform"
              >
                {a.send}
              </button>
            </div>

            <div className="mt-2 flex justify-between text-[11px] text-gray-600">
              <Link href="/dashboard" className="hover:text-accent-cyan transition-colors">
                ← {a.back}
              </Link>
              <button
                onClick={() => {
                  clearIssuedKey();
                  setApiKey(null);
                  setMessages([]);
                }}
                className="hover:text-accent-cyan transition-colors"
              >
                {a.clearKey}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
