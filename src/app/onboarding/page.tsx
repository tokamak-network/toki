"use client";

import dynamic from "next/dynamic";

const OnboardingQuest = dynamic(
  () => import("@/components/onboarding/OnboardingQuest"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading quest...</div>
      </div>
    ),
  }
);

export default function OnboardingPage() {
  return <OnboardingQuest />;
}
