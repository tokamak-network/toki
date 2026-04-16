import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TON 스테이킹",
  description:
    "토카막 네트워크에서 TON을 스테이킹하고 시뇨리지 보상을 받으세요.",
  alternates: { canonical: "/staking" },
};

export default function StakingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
