"use client";

import dynamic from "next/dynamic";
import Footer from "@/components/layout/Footer";

// Detailed wallet view (balances, staking positions, withdrawals, accounts).
// DashboardContent already renders the shared Header; we add the shared Footer
// for consistency with the rest of the site.
const DashboardContent = dynamic(
  () => import("@/components/dashboard/DashboardContent"),
  {
    ssr: false,
    loading: () => <div className="min-h-screen bg-[#070b14]" />,
  }
);

export default function WalletPage() {
  return (
    <>
      <DashboardContent />
      <Footer />
    </>
  );
}
