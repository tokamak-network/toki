import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Dashboard - Ttoni",
  description: "Manage your wallet and staking",
};

const DashboardContent = dynamic(
  () => import("@/components/dashboard/DashboardContent"),
  { ssr: false }
);

export default function DashboardPage() {
  return <DashboardContent />;
}
