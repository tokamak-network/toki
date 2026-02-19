"use client";

import React, { type ReactNode } from "react";

// Lazy wrapper that only loads Privy hooks when provider is available
function PrivyConnectButton() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { usePrivy, useWallets } = require("@privy-io/react-auth") as typeof import("@privy-io/react-auth");

  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();

  if (!ready) {
    return (
      <button
        disabled
        className="px-5 py-2 rounded-lg bg-white/10 text-gray-500 text-sm font-medium"
      >
        Loading...
      </button>
    );
  }

  if (authenticated && user) {
    const embeddedWallet = wallets.find(
      (w: { walletClientType: string }) => w.walletClientType === "privy"
    );
    const externalWallet = wallets.find(
      (w: { walletClientType: string }) => w.walletClientType !== "privy"
    );
    const displayWallet = externalWallet || embeddedWallet;
    const addr = displayWallet?.address;
    const shortAddr = addr
      ? `${addr.slice(0, 6)}...${addr.slice(-4)}`
      : null;

    const googleAccount = user.linkedAccounts?.find(
      (a: { type: string }) => a.type === "google_oauth"
    );
    const emailAccount = user.linkedAccounts?.find(
      (a: { type: string }) => a.type === "email"
    );
    const displayName =
      (googleAccount as { name?: string })?.name ||
      (emailAccount as { address?: string })?.address ||
      shortAddr ||
      "Connected";

    return (
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-gray-300 max-w-[120px] truncate">
            {displayName}
          </span>
          {shortAddr && (
            <span className="text-gray-500 font-mono text-xs">
              {shortAddr}
            </span>
          )}
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 rounded-lg bg-white/10 text-gray-300 text-sm font-medium hover:bg-white/15 transition-colors"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      className="px-5 py-2 rounded-lg bg-gradient-to-r from-accent-pink/80 to-accent-purple/80 text-white text-sm font-medium hover:from-accent-pink hover:to-accent-purple transition-all"
    >
      Connect
    </button>
  );
}

class ConnectButtonErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <button
          disabled
          className="px-5 py-2 rounded-lg bg-white/10 text-gray-500 text-sm font-medium cursor-not-allowed"
        >
          Connect
        </button>
      );
    }
    return this.props.children;
  }
}

export default function ConnectButton() {
  return (
    <ConnectButtonErrorBoundary>
      <PrivyConnectButton />
    </ConnectButtonErrorBoundary>
  );
}
