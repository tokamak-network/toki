"use client";

// BigInt JSON serialization polyfill — must run client-side before Privy's
// SignRequestScreen calls JSON.stringify on authorization data containing BigInt
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import { type ReactNode, useEffect, useState } from "react";

// Lazy load PrivyProvider to avoid SSR "React is not defined" from @privy-io/react-auth
let PrivyProviderModule: React.ComponentType<{ children: ReactNode }> | null =
  null;

export default function PrivyClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [Provider, setProvider] = useState<React.ComponentType<{
    children: ReactNode;
  }> | null>(PrivyProviderModule);
  const [, setEthereumReady] = useState(!!globalThis.window?.ethereum);

  useEffect(() => {
    if (PrivyProviderModule) return;
    import("./PrivyProvider").then((mod) => {
      PrivyProviderModule = mod.default;
      setProvider(() => mod.default);
    });
  }, []);

  // Detect MetaMask injected after page load (e.g. freshly installed)
  useEffect(() => {
    if (window.ethereum) return;

    const onEthereum = () => {
      setEthereumReady(true);
      // Force Privy to re-initialize with the new provider
      if (PrivyProviderModule) {
        setProvider(null);
        requestAnimationFrame(() => setProvider(() => PrivyProviderModule));
      }
    };

    window.addEventListener("ethereum#initialized", onEthereum);

    // Polling fallback — some wallets don't fire the event
    const interval = setInterval(() => {
      if (window.ethereum) {
        clearInterval(interval);
        onEthereum();
      }
    }, 500);

    return () => {
      window.removeEventListener("ethereum#initialized", onEthereum);
      clearInterval(interval);
    };
  }, []);

  if (Provider) {
    return <Provider>{children}</Provider>;
  }

  // Render children even before Privy loads (layout/page remains visible)
  return <>{children}</>;
}
