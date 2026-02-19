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

  useEffect(() => {
    if (PrivyProviderModule) return;
    import("./PrivyProvider").then((mod) => {
      PrivyProviderModule = mod.default;
      setProvider(() => mod.default);
    });
  }, []);

  if (Provider) {
    return <Provider>{children}</Provider>;
  }

  // Privy 로드 전에도 children 렌더 (레이아웃/페이지가 보임)
  return <>{children}</>;
}
