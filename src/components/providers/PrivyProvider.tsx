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
        loginMethods: ["google", "email"],
        appearance: {
          theme: "dark",
          accentColor: "#4a90d9",
          logo: "/toki-logo.png",
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
