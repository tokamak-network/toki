"use client";

import dynamic from "next/dynamic";
import TokiLoader from "@/components/common/TokiLoader";
import Header from "@/components/layout/Header";

const StakingScreen = dynamic(
  () => import("@/components/staking/StakingScreen"),
  {
    ssr: false,
    loading: () => <TokiLoader />,
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
