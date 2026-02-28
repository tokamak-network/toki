"use client";

import dynamic from "next/dynamic";

const DashboardContent = dynamic(
  () => import("@/components/dashboard/DashboardContent"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading dashboard...</div>
      </div>
    ),
  },
);

export default function DashboardPage() {
  return <DashboardContent />;
}
