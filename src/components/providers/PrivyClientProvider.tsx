"use client";

import { useEffect, useState, type ReactNode } from "react";

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

  // Privy 로드 전에도 children 렌더 (레이아웃/페이지가 보임)
  return <>{children}</>;
}
