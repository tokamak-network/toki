"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useWallets } from "@privy-io/react-auth";
import { track, trackWalletCreated } from "@/lib/analytics";

/**
 * Mounted once inside the Privy provider tree (see app/layout.tsx).
 * Fires page_view on every route change and tags events with the user's
 * embedded-wallet address when known, which powers the "active wallet" DAU.
 * No UI.
 */
export default function AnalyticsTracker() {
  const pathname = usePathname();
  const { wallets } = useWallets();
  const address = wallets.find((w) => w.walletClientType === "privy")?.address;

  const lastPath = useRef<string | null>(null);
  const firedWalletActive = useRef(false);

  // page_view on initial load + each client navigation
  useEffect(() => {
    if (!pathname || lastPath.current === pathname) return;
    lastPath.current = pathname;
    track("page_view", { walletAddress: address ?? null, path: pathname });
  }, [pathname, address]);

  // Wallet signals: fire wallet_created once ever, and wallet_active once per
  // page load so returning users still count toward active-wallet DAU.
  useEffect(() => {
    if (!address) return;
    trackWalletCreated(address);
    if (!firedWalletActive.current) {
      firedWalletActive.current = true;
      track("wallet_active", { walletAddress: address });
    }
  }, [address]);

  return null;
}
