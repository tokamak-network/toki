"use client";

import dynamic from "next/dynamic";
import Header from "@/components/layout/Header";

const ExploreContent = dynamic(
  () => import("@/components/explore/ExploreContent"),
  {
    ssr: false,
    loading: () => <div className="min-h-screen bg-[#070b14]" />,
  }
);

export default function ExplorePage() {
  return (
    <>
      <Header />
      <ExploreContent />
    </>
  );
}
