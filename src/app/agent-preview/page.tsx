"use client";

import dynamic from "next/dynamic";

// Internal visual-QA route for the AI agent workspace (mirrors /hub-preview).
// Renders AgentWorkspace with preview=true so the auth gate is skipped; seed a
// key in localStorage to view the gallery/connect screens.
const AgentWorkspace = dynamic(() => import("@/components/agent/AgentWorkspace"), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-[#070b14]" />,
});

export default function AgentPreviewPage() {
  return <AgentWorkspace preview />;
}
