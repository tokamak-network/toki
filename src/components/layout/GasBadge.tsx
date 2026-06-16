"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { chain } from "@/lib/chain";

/**
 * Header indicator: shows whether the active connection can use the TON
 * paymaster (gasless) — i.e. a Privy embedded wallet — or is an external
 * wallet (paymaster N/A, user pays gas). For external wallets on the wrong
 * network it also offers a one-click switch to mainnet.
 */
export default function GasBadge() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { t } = useTranslation();

  if (!ready || !authenticated) return null;

  const embedded = wallets.find((w) => w.walletClientType === "privy");
  const external = wallets.find((w) => w.walletClientType !== "privy");
  const hasLinkedExternal = user?.linkedAccounts?.some(
    (a) => a.type === "wallet"
  );
  const primary = (hasLinkedExternal && external) || embedded;
  if (!primary) return null;

  // Embedded (Privy) → gasless via TON paymaster
  if (primary.walletClientType === "privy") {
    return (
      <span
        title={t.gas.gaslessHint}
        className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent-cyan/15 border border-accent-cyan/30 text-[11px] font-semibold text-accent-cyan"
      >
        ⚡ {t.gas.gasless}
      </span>
    );
  }

  // External wallet → paymaster N/A, user pays gas
  const wrongNetwork = primary.chainId !== `eip155:${chain.id}`;
  return (
    <span className="hidden sm:inline-flex items-center gap-1.5">
      <span
        title={t.gas.selfGasHint}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent-amber/15 border border-accent-amber/30 text-[11px] font-semibold text-accent-amber"
      >
        {t.gas.selfGas}
      </span>
      {wrongNetwork && (
        <button
          type="button"
          onClick={() => primary.switchChain(chain.id)}
          className="px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/40 text-[11px] font-semibold text-red-300 hover:bg-red-500/25 transition-colors"
        >
          ⚠ {t.gas.switchNetwork}
        </button>
      )}
    </span>
  );
}
