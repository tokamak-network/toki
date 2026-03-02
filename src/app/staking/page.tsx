"use client";

import dynamic from "next/dynamic";
import Header from "@/components/layout/Header";

const StakingScreen = dynamic(
  () => import("@/components/staking/StakingScreen"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-gray-400">Loading...</div>
      </div>
    ),
  }
);

export default function StakingPage() {
  return (
    <>
      <Header />
      <StakingScreen />
    </>
  );
}
