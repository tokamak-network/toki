"use client";

import dynamic from "next/dynamic";

// QA-only: renders the passport card with mock data, no auth required.
const ProfileView = dynamic(() => import("@/components/profile/ProfileView"), {
  ssr: false,
});

export default function ProfilePreviewPage() {
  return <ProfileView preview />;
}
