import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Collection",
  description:
    "View your Toki achievement cards. Collect rewards for staking milestones and community participation.",
  openGraph: {
    title: "Collection | Toki",
    description: "View your Toki achievement cards and staking milestone rewards.",
  },
};

export default function CollectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
