"use client";

import dynamic from "next/dynamic";

// Dashboard is now the Toki hub (concept A lobby). Detailed wallet lives at /wallet.
const HubLobby = dynamic(() => import("@/components/hub/HubLobby"), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-[#070b14]" />,
});

export default function DashboardPage() {
  return <HubLobby />;
}
