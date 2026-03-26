import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore",
  description:
    "Explore the Tokamak Network ecosystem. Discover operators, staking opportunities, and DeFi protocols.",
  openGraph: {
    title: "Explore | Toki",
    description: "Explore the Tokamak Network ecosystem and discover staking opportunities.",
  },
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
