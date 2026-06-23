"use client";

import dynamic from "next/dynamic";
import TokiLoader from "@/components/common/TokiLoader";

const HubLobby = dynamic(() => import("@/components/hub/HubLobby"), {
  ssr: false,
  loading: () => <TokiLoader />,
});

// No-auth visual preview of the hub lobby (empty data). Not linked in nav.
export default function HubPreviewPage() {
  return <HubLobby preview />;
}
