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
import AuthModalProvider from "@/components/auth/AuthModalProvider";
import { AudioProvider } from "@/components/audio/AudioProvider";
import TransitionProvider from "@/components/transitions/TransitionProvider";
import { OrganizationJsonLd, WebApplicationJsonLd } from "@/components/seo/JsonLd";
import { SITE_URL, SITE_NAME } from "@/constants/seo";
import "./globals.css";

const TokiChat = dynamic(() => import("@/components/chat/TokiChat"), { ssr: false });
const NetworkGuard = dynamic(() => import("@/components/layout/NetworkGuard"), { ssr: false });
const AchievementToast = dynamic(() => import("@/components/achievements/AchievementToast"), { ssr: false });
const AnalyticsTracker = dynamic(() => import("@/components/analytics/AnalyticsTracker"), { ssr: false });

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
    "원클릭으로 TON을 스테이킹하고 시뇨리지 보상을 받으세요. 20%+ APR, 가스비 무료, 복잡한 설정 없이.",
  keywords: [
    "토카막 네트워크",
    "스테이킹",
    "시뇨리지",
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
    title: "Toki — Stake 100 TON, get a free AI key",
    description:
      "Toki's summer update: stake 100 TON and unlock AI Membership — unlimited use up to 1M output tokens a day on Qwen 3.6 and Gemma 4. No card, no fee.",
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
    url: SITE_URL,
    images: [
      {
        url: "/toki-og.png",
        width: 1200,
        height: 630,
        alt: "Toki — Stake 100 TON, get a free AI key. Unlimited AI Membership.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Toki — Stake 100 TON, get a free AI key",
    description:
      "Toki's summer update: stake 100 TON and unlock AI Membership — unlimited use up to 1M output tokens a day on Qwen 3.6 and Gemma 4. No card, no fee.",
    images: ["/toki-og.png"],
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
        {/* Bubble display fonts for the cozy hero */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Korean display font (Jua) needs full glyph coverage — a plain
            stylesheet link is simpler/safer than next/font's subset handling. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Fredoka:wght@400;500;600;700&family=Jua&family=Anton&family=Black+Han+Sans&family=Archivo:wght@700;800;900&family=Permanent+Marker&family=Noto+Sans+KR:wght@500;700&display=swap"
          rel="stylesheet"
        />
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
              <AuthModalProvider>
                <AchievementProvider>
                  {/* Global overlays live INSIDE TransitionProvider so anything
                      that navigates (incl. TokiChat) can play screen transitions. */}
                  <TransitionProvider>
                    {children}
                    <NetworkGuard />
                    <TokiChat />
                    <AchievementToast />
                    <AnalyticsTracker />
                  </TransitionProvider>
                </AchievementProvider>
              </AuthModalProvider>
            </PrivyClientProvider>
          </AudioProvider>
        </LanguageProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
