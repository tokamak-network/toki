"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useTranslation } from "@/components/providers/LanguageProvider";

export default function ConnectButton() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const { t } = useTranslation();

  if (!ready) {
    return (
      <button
        disabled
        className="px-5 py-2 rounded-lg bg-white/10 text-gray-500 text-sm font-medium"
      >
        {t.header.loading}
      </button>
    );
  }

  if (authenticated && user) {
    const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
    const externalWallet = wallets.find((w) => w.walletClientType !== "privy");
    const displayWallet = externalWallet || embeddedWallet;
    const addr = displayWallet?.address;
    const shortAddr = addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : null;

    const googleAccount = user.linkedAccounts?.find(
      (a) => a.type === "google_oauth",
    );
    const emailAccount = user.linkedAccounts?.find((a) => a.type === "email");
    const displayName =
      (googleAccount as { name?: string })?.name ||
      (emailAccount as { address?: string })?.address ||
      shortAddr ||
      "Connected";

    return (
      <div className="flex items-center gap-2">
        <a
          href="/dashboard"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors"
        >
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-gray-300 max-w-[120px] truncate">
            {displayName}
          </span>
          {shortAddr && (
            <span className="text-gray-500 font-mono text-xs">{shortAddr}</span>
          )}
        </a>
        <button
          onClick={logout}
          className="px-4 py-2 rounded-lg bg-white/10 text-gray-300 text-sm font-medium hover:bg-white/15 transition-colors"
        >
          {t.header.logout}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      className="px-5 py-2 rounded-lg bg-gradient-to-r from-accent-blue/80 to-accent-navy/80 text-white text-sm font-medium hover:from-accent-blue hover:to-accent-navy transition-all"
    >
      {t.header.connect}
    </button>
  );
}
