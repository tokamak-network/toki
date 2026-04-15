import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "View your TON staking positions, rewards, and portfolio. Track seigniorage earnings in real-time.",
  openGraph: {
    title: "Dashboard | Toki",
    description: "View your TON staking positions, rewards, and portfolio.",
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
