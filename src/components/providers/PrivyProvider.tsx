"use client";

import React from "react";
import { PrivyProvider as Provider } from "@privy-io/react-auth";
import { chain } from "@/lib/chain";

export default function PrivyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    // Privy 미설정 시 그냥 렌더링 (개발 편의)
    return <>{children}</>;
  }

  return (
    <Provider
      appId={appId}
      config={{
        // Google/email = beginner path (embedded wallet + gasless paymaster).
        // wallet = advanced path: connect MetaMask/other external wallets.
        loginMethods: ["google", "email", "wallet"],
        appearance: {
          theme: "dark",
          accentColor: "#4a90d9",
          logo: "/toki-logo.png",
          walletList: ["detected_wallets", "metamask", "coinbase_wallet", "rainbow"],
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        defaultChain: chain,
        supportedChains: [chain],
      }}
    >
      {children}
    </Provider>
  );
}
