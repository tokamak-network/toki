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
      <button
        onClick={handleStartStaking}
        className="px-8 py-4 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold text-lg glow-blue hover:scale-105 transition-transform"
      >
        {t.hero.startStaking}
      </button>
      <a
        href="/onboarding"
        className="px-8 py-4 rounded-xl border border-accent-cyan/40 text-accent-cyan font-semibold text-lg hover:bg-accent-cyan/10 hover:border-accent-cyan/60 transition-colors text-center"
      >
        {t.hero.stakingQuest}
      </a>
    </div>
  );
}
