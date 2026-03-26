import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staking",
  description:
    "Stake TON with one click and earn 20%+ APR seigniorage rewards. Choose from top operators with Toki's smart recommendations.",
  openGraph: {
    title: "Staking | Toki",
    description: "Stake TON with one click and earn 20%+ APR seigniorage rewards.",
  },
};

export default function StakingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
