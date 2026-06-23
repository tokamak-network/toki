"use client";

import dynamic from "next/dynamic";

// Shareable "Toki Passport" — the user's ecosystem profile summary card.
const ProfileView = dynamic(() => import("@/components/profile/ProfileView"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-[#070b14]">
      <div className="text-gray-400">Loading...</div>
    </div>
  ),
});

export default function ProfilePage() {
  return <ProfileView />;
}
