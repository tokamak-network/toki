import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Started",
  description:
    "Start your TON staking journey with Toki. Set up your wallet and earn rewards in minutes.",
  openGraph: {
    title: "Get Started | Toki",
    description: "Start your TON staking journey with Toki in minutes.",
  },
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
