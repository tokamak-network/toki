"use client";

import Link from "next/link";
import Header from "@/components/layout/Header";
import { useTranslation } from "@/components/providers/LanguageProvider";

// Placeholder for track B (see docs/private-transfer-integration-plan.md).
// The real PrivateTransferPanel replaces this once the prover-worker pipeline lands.
export default function PrivateTransferPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-grid">
      <Header />
      <main className="max-w-xl mx-auto px-4 py-16 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/characters/toki-thinking.png"
          alt="Toki"
          className="w-28 h-28 object-contain mx-auto mb-4"
        />
        <div className="inline-block px-3 py-1 rounded-full bg-white/10 text-gray-400 text-xs font-medium mb-3">
          {t.hub.ptComingSoon}
        </div>
        <h1 className="text-2xl font-bold mb-3">{t.hub.appPrivateTransfer}</h1>
        <p className="text-gray-300 text-sm leading-relaxed mb-5">{t.hub.ptIntro}</p>
        <div className="card p-4 text-left text-xs text-amber-300/80 border-amber-500/20 bg-amber-500/5 mb-6 leading-relaxed">
          ⚠️ {t.hub.ptWarn}
        </div>
        <Link
          href="/dashboard"
          className="inline-block px-5 py-2.5 rounded-xl bg-accent-cyan/15 border border-accent-cyan/30 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/25 transition-colors"
        >
          ← {t.hub.ptBack}
        </Link>
      </main>
    </div>
  );
}
