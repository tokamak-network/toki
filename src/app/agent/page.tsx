"use client";

import dynamic from "next/dynamic";
import TokiLoader from "@/components/common/TokiLoader";
import Header from "@/components/layout/Header";

// Agent Workspace — the user's stake-powered AI, separate from the TokiChat
// consultation assistant. See docs/ai-agent-workspace.md.
const AgentWorkspace = dynamic(() => import("@/components/agent/AgentWorkspace"), {
  ssr: false,
  loading: () => <TokiLoader />,
});

export default function AgentPage() {
  return (
    <>
      <Header />
      <AgentWorkspace />
    </>
  );
}
