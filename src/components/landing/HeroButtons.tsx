"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";

export default function HeroButtons() {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();

  const handleStartStaking = () => {
    if (!ready) return;
    if (authenticated) {
      router.push("/dashboard");
    } else {
      login();
    }
  };

  return (
    <div className="flex flex-col gap-4 justify-center lg:justify-start">
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleStartStaking}
          className="px-8 py-4 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold text-lg glow-blue hover:scale-105 transition-transform"
        >
          Start Staking
        </button>
        <a
          href="#how-it-works"
          className="px-8 py-4 rounded-xl border border-gray-600 text-gray-300 font-semibold text-lg hover:border-accent-sky hover:text-accent-sky transition-colors text-center"
        >
          Learn More
        </a>
      </div>
      <a
        href="/onboarding"
        className="text-sm text-gray-500 hover:text-accent-cyan transition-colors text-center lg:text-left"
      >
        MetaMask / TON Staking Guide
      </a>
    </div>
  );
}
