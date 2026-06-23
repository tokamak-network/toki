"use client";

import dynamic from "next/dynamic";
import TokiLoader from "@/components/common/TokiLoader";
import Header from "@/components/layout/Header";

const ExploreContent = dynamic(
  () => import("@/components/explore/ExploreContent"),
  {
    ssr: false,
    loading: () => <TokiLoader />,
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
