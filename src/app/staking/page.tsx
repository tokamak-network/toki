"use client";

import dynamic from "next/dynamic";
import Header from "@/components/layout/Header";

const StakingScreen = dynamic(
  () => import("@/components/staking/StakingScreen"),
  {
    ssr: false,
    loading: () => <div className="min-h-screen bg-[#070b14]" />,
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
