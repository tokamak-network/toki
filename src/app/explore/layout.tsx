import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "생태계 탐색",
  description:
    "토카막 네트워크 생태계를 탐색하세요. DeFi, 브릿지, 거버넌스 등.",
  alternates: { canonical: "/explore" },
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
