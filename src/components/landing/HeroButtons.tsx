"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/components/providers/LanguageProvider";

export default function HeroButtons() {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();
  const { t } = useTranslation();

  const handleStartStaking = () => {
    if (!ready) return;
    if (authenticated) {
      router.push("/staking");
    } else {
      login();
    }
  };

  return (
    <div className="flex flex-col gap-4 justify-center lg:justify-start">
      {/* Temporary event banner — remove after event ends */}
      <a
        href="/event"
        className="group relative px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold text-base shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_28px_rgba(236,72,153,0.5)] hover:scale-105 transition-all text-center animate-pulse-slow"
      >
        <span>🎫 {t.eventPage.lottery} — {t.eventPage.lotteryDesc}</span>
        <span className="block text-sm font-normal text-white/70 mt-0.5">
          {t.eventPage.tagline}
        </span>
      </a>
      <a
        href="/onboarding"
        className="group relative px-8 py-4 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-blue text-white font-semibold text-lg shadow-[0_0_24px_rgba(34,211,238,0.35)] hover:shadow-[0_0_32px_rgba(34,211,238,0.5)] hover:scale-105 transition-all text-center"
      >
        <span>{t.hero.stakingQuest}</span>
        <span className="block text-sm font-normal text-white/70 mt-0.5">
          {t.hero.questSub}
        </span>
      </a>
      <button
        onClick={handleStartStaking}
        className="px-8 py-4 rounded-xl border border-accent-blue/40 text-accent-blue font-semibold text-lg hover:bg-accent-blue/10 hover:border-accent-blue/60 transition-colors"
      >
        {t.hero.startStaking}
      </button>
    </div>
  );
}
