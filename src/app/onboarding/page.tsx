"use client";

import { Component, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/layout/Header";

const OnboardingQuest = dynamic(
  () => import("@/components/onboarding/OnboardingQuest"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading quest...</div>
      </div>
    ),
  }
);

class OnboardingErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-4">
            <div className="text-2xl">⚠️</div>
            <h2 className="text-lg font-semibold text-white">Something went wrong</h2>
            <pre className="text-xs text-red-400 bg-red-400/10 rounded-lg p-4 text-left overflow-auto max-h-40">
              {this.state.error.message}
            </pre>
            <button
              onClick={() => {
                this.setState({ error: null });
                window.location.reload();
              }}
              className="px-6 py-2 rounded-lg bg-accent-blue text-white text-sm font-medium"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function OnboardingPage() {
  return (
    <>
      <Header />
      <OnboardingErrorBoundary>
        <OnboardingQuest />
      </OnboardingErrorBoundary>
    </>
  );
}
