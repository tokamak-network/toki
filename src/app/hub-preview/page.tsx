"use client";

import dynamic from "next/dynamic";

const HubLobby = dynamic(() => import("@/components/hub/HubLobby"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-400">Loading hub...</div>
    </div>
  ),
});

// No-auth visual preview of the hub lobby (empty data). Not linked in nav.
export default function HubPreviewPage() {
  return <HubLobby preview />;
}
