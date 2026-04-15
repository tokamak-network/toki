import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "스테이킹 퀘스트",
  description: "토키와 함께 3단계로 TON 스테이킹을 시작하세요.",
  alternates: { canonical: "/onboarding" },
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
