// BigInt JSON serialization polyfill — prevents "Do not know how to serialize a BigInt"
// when viem/bundler clients internally call JSON.stringify on paymaster data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import type { Metadata } from "next";
import localFont from "next/font/local";
import dynamic from "next/dynamic";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import PrivyClientProvider from "@/components/providers/PrivyClientProvider";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { AchievementProvider } from "@/components/providers/AchievementProvider";
import { AudioProvider } from "@/components/audio/AudioProvider";
import { OrganizationJsonLd, WebApplicationJsonLd } from "@/components/seo/JsonLd";
import { SITE_URL, SITE_NAME } from "@/constants/seo";
import "./globals.css";

const TokiChat = dynamic(() => import("@/components/chat/TokiChat"), { ssr: false });
const AchievementToast = dynamic(() => import("@/components/achievements/AchievementToast"), { ssr: false });

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Toki - TON 스테이킹을 쉽게 | 토카막 네트워크",
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "원클릭으로 TON을 스테이킹하고 세뇨리지 보상을 받으세요. 20%+ APR, 가스비 무료, 복잡한 설정 없이.",
  keywords: [
    "토카막 네트워크",
    "스테이킹",
    "세뇨리지",
    "TON 스테이킹",
    "TON",
    "Tokamak Network",
    "Staking",
    "Seigniorage",
    "DeFi",
  ],
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Toki - TON 스테이킹을 쉽게 | 토카막 네트워크",
    description:
      "원클릭으로 TON을 스테이킹하고 세뇨리지 보상을 받으세요. 20%+ APR.",
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
    url: SITE_URL,
    images: [
      {
        url: `${SITE_URL}/toki-promo-poster.jpg`,
        width: 1280,
        height: 720,
        alt: "Toki - TON 스테이킹을 쉽게",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Toki - TON 스테이킹을 쉽게",
    description:
      "원클릭으로 TON을 스테이킹하고 세뇨리지 보상을 받으세요. 20%+ APR.",
    images: [`${SITE_URL}/toki-promo-poster.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* Google Analytics 4 */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}
        {/* Microsoft Clarity */}
        {process.env.NEXT_PUBLIC_CLARITY_ID && (
          <Script id="clarity-init" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window,document,"clarity","script","${process.env.NEXT_PUBLIC_CLARITY_ID}");
            `}
          </Script>
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-grid min-h-screen`}
      >
        <OrganizationJsonLd />
        <WebApplicationJsonLd />
        <LanguageProvider>
          <AudioProvider>
            <PrivyClientProvider>
              <AchievementProvider>
                {children}
                <TokiChat />
                <AchievementToast />
              </AchievementProvider>
            </PrivyClientProvider>
          </AudioProvider>
        </LanguageProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
