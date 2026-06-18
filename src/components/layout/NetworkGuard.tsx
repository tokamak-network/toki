/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { chain } from "@/lib/chain";
import { useTranslation } from "@/components/providers/LanguageProvider";

/**
 * Wrong-network guard. toki operates on a single Ethereum network — mainnet in
 * production, Sepolia in testnet (NEXT_PUBLIC_NETWORK). An external wallet sitting
 * on any other chain (Base, Polygon, Base Sepolia, or the "other" Ethereum net)
 * can't transact, so we surface a blocking prompt that switches it to the app's
 * network in one click. Privy embedded wallets always track the app chain, so
 * they never trigger this.
 */
export default function NetworkGuard() {
  const { ready, authenticated, user, logout } = usePrivy();
  const { wallets } = useWallets();
  const { t } = useTranslation();
  const [switching, setSwitching] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!ready || !authenticated) return null;

  const embedded = wallets.find((w) => w.walletClientType === "privy");
  const external = wallets.find((w) => w.walletClientType !== "privy");
  const hasLinkedExternal = user?.linkedAccounts?.some((a) => a.type === "wallet");
  const primary = (hasLinkedExternal && external) || embedded;

  // Only external wallets can be on the wrong chain; embedded tracks the app chain.
  if (!primary || primary.walletClientType === "privy") return null;
  if (primary.chainId === `eip155:${chain.id}`) return null;

  const netName = chain.id === 1 ? t.network.mainnet : t.network.sepolia;

  const onSwitch = async () => {
    setFailed(false);
    setSwitching(true);
    try {
      await primary.switchChain(chain.id);
    } catch {
      setFailed(true);
    }
    setSwitching(false);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-accent-cyan/30 bg-[#0c1422]/95 p-6 text-center shadow-2xl">
        <img
          src="/characters/toki-thinking.png"
          alt=""
          className="mx-auto mb-3 h-24 w-24 object-contain"
        />
        <h2 className="text-lg font-bold text-white">{t.network.wrongTitle}</h2>
        <p className="mt-2 text-sm text-gray-300">
          {t.network.wrongDesc.replace("{network}", netName)}
        </p>
        <button
          type="button"
          onClick={onSwitch}
          disabled={switching}
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-accent-blue to-accent-cyan px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {switching ? t.network.switching : t.network.switchCta.replace("{network}", netName)}
        </button>
        {failed && (
          <p className="mt-2 text-xs text-red-300">{t.network.switchErr}</p>
        )}
        <button
          type="button"
          onClick={() => logout()}
          className="mt-3 text-xs text-gray-500 transition-colors hover:text-gray-300"
        >
          {t.network.disconnect}
        </button>
      </div>
    </div>
  );
}
