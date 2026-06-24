"use client";

import dynamic from "next/dynamic";

const HubLobby = dynamic(() => import("@/components/hub/HubLobby"), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-[#070b14]" />,
});

// No-auth visual preview of the hub lobby (empty data). Not linked in nav.
export default function HubPreviewPage() {
  return <HubLobby preview />;
}
