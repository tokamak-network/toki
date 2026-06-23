"use client";

import dynamic from "next/dynamic";
import Header from "@/components/layout/Header";

// Agent Workspace — the user's stake-powered AI, separate from the TokiChat
// consultation assistant. See docs/ai-agent-workspace.md.
const AgentWorkspace = dynamic(() => import("@/components/agent/AgentWorkspace"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-400">Loading...</div>
    </div>
  ),
});

export default function AgentPage() {
  return (
    <>
      <Header />
      <AgentWorkspace />
    </>
  );
}
