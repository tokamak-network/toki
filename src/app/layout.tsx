// BigInt JSON serialization polyfill — prevents "Do not know how to serialize a BigInt"
// when viem/bundler clients internally call JSON.stringify on paymaster data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import type { Metadata } from "next";
import localFont from "next/font/local";
import dynamic from "next/dynamic";
import PrivyClientProvider from "@/components/providers/PrivyClientProvider";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { AudioProvider } from "@/components/audio/AudioProvider";
import "./globals.css";

const TokiChat = dynamic(() => import("@/components/chat/TokiChat"), { ssr: false });

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
  title: "Toki - TON Staking Made Easy",
  description:
    "Stake your TON with one click. Earn 35% APR seigniorage rewards. No MetaMask, no ETH gas fees, no complexity.",
  keywords: ["TON", "Tokamak Network", "Staking", "Seigniorage", "DeFi"],
  openGraph: {
    title: "Toki - TON Staking Made Easy",
    description: "Stake your TON with one click. Earn 35% APR.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-grid min-h-screen`}
      >
        <LanguageProvider>
          <AudioProvider>
            <PrivyClientProvider>
              {children}
              <TokiChat />
            </PrivyClientProvider>
          </AudioProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
