"use client";

import dynamic from "next/dynamic";
import TokiLoader from "@/components/common/TokiLoader";
import Header from "@/components/layout/Header";

// Shareable "Toki Passport" — the user's ecosystem profile summary card.
const ProfileView = dynamic(() => import("@/components/profile/ProfileView"), {
  ssr: false,
  loading: () => <TokiLoader />,
});

export default function ProfilePage() {
  return (
    <>
      <Header />
      <ProfileView />
    </>
  );
}
