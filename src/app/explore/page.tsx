"use client";

import dynamic from "next/dynamic";
import Header from "@/components/layout/Header";

const ExploreContent = dynamic(
  () => import("@/components/explore/ExploreContent"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    ),
  },
);

export default function ExplorePage() {
  return (
    <>
      <Header />
      <ExploreContent />
    </>
  );
}
