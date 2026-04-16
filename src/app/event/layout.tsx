import type { Metadata } from "next";
import { SITE_URL } from "@/constants/seo";

export const metadata: Metadata = {
  title: "Toki 오프라인 이벤트",
  description:
    "Toki 오프라인 이벤트에 참여하고 TON 스테이킹 보상을 받으세요. 복권, 지도, 이벤트 정보를 한눈에 확인하세요.",
  alternates: { canonical: "/event" },
  openGraph: {
    title: "Toki 오프라인 이벤트 | Tokamak Network",
    description:
      "Toki 오프라인 이벤트에 참여하고 TON 스테이킹 보상을 받으세요.",
    images: ["/toki-promo-poster.jpg"],
    url: `${SITE_URL}/event`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Toki 오프라인 이벤트 | Tokamak Network",
    description:
      "Toki 오프라인 이벤트에 참여하고 TON 스테이킹 보상을 받으세요.",
    images: ["/opengraph-image"],
  },
};

export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
