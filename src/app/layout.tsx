import type { Metadata } from "next";
import localFont from "next/font/local";
import dynamic from "next/dynamic";
import "./globals.css";

const PrivyProvider = dynamic(
  () => import("@/components/providers/PrivyProvider"),
  { ssr: false }
);

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
  title: "Ttoni - TON Staking Made Easy",
  description:
    "Stake your TON with one click. Earn 35% APR seigniorage rewards. No MetaMask, no ETH gas fees, no complexity.",
  keywords: ["TON", "Tokamak Network", "Staking", "Seigniorage", "DeFi"],
  openGraph: {
    title: "Ttoni - TON Staking Made Easy",
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
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-grid min-h-screen`}
      >
        <PrivyProvider>{children}</PrivyProvider>
      </body>
    </html>
  );
}
