"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/providers/LanguageProvider";
import {
  AI_ACCESS_URL,
  AiAccessError,
  issueAiAccessKey,
  saveIssuedKey,
  type Eip1193Provider,
  type IssueResult,
} from "@/lib/aiAccess";

type Phase = "signing" | "issuing" | "done" | "error";

// Native in-app issuance modal (Arch B). Runs the SIWE-sign → delegated-issue
// flow on mount and shows the one-time key. The AI Access service holds the
// master key and re-validates the stake on-chain before issuing.
export default function AiAccessKeyModal({
  address,
  getProvider,
  onClose,
}: {
  address: string;
  getProvider: () => Promise<Eip1193Provider>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>("signing");
  const [result, setResult] = useState<IssueResult | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const startedRef = useRef(false);

  const run = useCallback(async () => {
    setPhase("signing");
    setErrorStatus(null);
    try {
      const provider = await getProvider();
      const res = await issueAiAccessKey(provider, address, setPhase);
      saveIssuedKey(res); // persist for the in-app Agent Workspace
      setResult(res);
      setPhase("done");
    } catch (e) {
      setErrorStatus(e instanceof AiAccessError ? e.status : -1);
      setPhase("error");
    }
  }, [address, getProvider]);

  // Auto-start once (the user already opted in by opening the modal).
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void run();
  }, [run]);

  const copyKey = useCallback(() => {
    if (!result?.key) return;
    navigator.clipboard
      ?.writeText(result.key)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  }, [result]);

  const errorMsg =
    errorStatus === 409
      ? t.hub.aiAccessErrAlready
      : errorStatus === 403
        ? t.hub.aiAccessErrStake
        : t.hub.aiAccessErrGeneric;

  const expiresLabel = result?.expiresAt
    ? t.hub.aiAccessExpires.replace(
        "{date}",
        new Date(result.expiresAt).toLocaleDateString()
      )
    : "";

  const busy = phase === "signing" || phase === "issuing";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={busy ? undefined : onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[#0d0d12] border border-accent-cyan/25 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🤖</span>
          <h2 className="text-lg font-semibold text-white">{t.hub.aiAccessModalTitle}</h2>
        </div>

        {busy && (
          <div className="py-6 flex flex-col items-center text-center gap-3">
            <span className="inline-block w-8 h-8 rounded-full border-2 border-accent-cyan/30 border-t-accent-cyan animate-spin" />
            <p className="text-sm text-gray-300">
              {phase === "signing" ? t.hub.aiAccessSigning : t.hub.aiAccessIssuing}
            </p>
            {phase === "signing" && (
              <p className="text-xs text-gray-500">{t.hub.aiAccessModalIntro}</p>
            )}
          </div>
        )}

        {phase === "done" && result && (
          <div>
            <div className="text-sm font-semibold text-accent-gold mb-1">
              {t.hub.aiAccessIssuedTitle}
            </div>
            <p className="text-xs text-amber-400/80 mb-3">{t.hub.aiAccessKeyWarn}</p>
            <code className="block p-3 mb-3 rounded-lg bg-white/5 font-mono text-xs text-accent-cyan break-all">
              {result.key}
            </code>
            <button
              onClick={copyKey}
              className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-accent-blue to-accent-cyan text-white text-sm font-semibold hover:scale-[1.01] transition-transform mb-3"
            >
              {copied ? t.hub.aiAccessCopied : t.hub.aiAccessCopyKey}
            </button>
            {expiresLabel && <p className="text-xs text-gray-500 mb-2">{expiresLabel}</p>}
            <p className="text-xs text-gray-500 mb-4">{t.hub.aiAccessUsageHint}</p>
            <div className="flex gap-2">
              <Link
                href="/agent"
                className="flex-1 text-center px-4 py-2 rounded-xl bg-gradient-to-r from-accent-blue to-accent-cyan text-white text-sm font-semibold hover:scale-[1.01] transition-transform"
              >
                {t.agent.openWorkspace} →
              </Link>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/10 text-sm text-gray-300 hover:bg-white/15 transition-colors"
              >
                {t.hub.aiAccessClose}
              </button>
            </div>
          </div>
        )}

        {phase === "error" && (
          <div>
            <p className="text-sm text-red-300 mb-4">{errorMsg}</p>
            <div className="flex gap-2">
              {errorStatus === 409 ? (
                <a
                  href={AI_ACCESS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center px-4 py-2 rounded-xl bg-accent-cyan/15 border border-accent-cyan/30 text-accent-cyan text-sm font-semibold hover:bg-accent-cyan/25 transition-colors"
                >
                  {t.hub.aiAccessManageOnSite}
                </a>
              ) : (
                <button
                  onClick={run}
                  className="flex-1 px-4 py-2 rounded-xl bg-accent-cyan/15 border border-accent-cyan/30 text-accent-cyan text-sm font-semibold hover:bg-accent-cyan/25 transition-colors"
                >
                  {t.hub.aiAccessRetry}
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-xl bg-white/10 text-sm text-gray-300 hover:bg-white/15 transition-colors"
              >
                {t.hub.aiAccessClose}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
