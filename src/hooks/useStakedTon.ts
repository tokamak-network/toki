"use client";

import { useCallback, useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { formatUnits } from "viem";
import { publicClient as client } from "@/lib/chain";
import { CONTRACTS } from "@/constants/contracts";

// On-chain staked-TON read, extracted from HubLobby so secondary pages (AI Access
// gate, wallet) can show the same net-staked figure without duplicating the
// multicall. WTON is 27-decimal (RAY); TON is 18-decimal. Net staked subtracts
// pending-unstaked so the number matches the hub.
const erc20Abi = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const stakedAbi = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "accStakedAccount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "pendingUnstakedAccount",
    outputs: [{ name: "wtonAmount", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export interface StakedTon {
  /** Net staked TON (active stake minus pending-unstaked), null while unknown. */
  stakedTon: number | null;
  /** Idle (liquid) TON balance, null while unknown. */
  idleTon: number | null;
  loading: boolean;
  address?: string;
  /** Primary connected wallet — for SIWE signing / provider access. */
  wallet?: { address: string; getEthereumProvider: () => Promise<unknown> };
}

export function useStakedTon(): StakedTon {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const [stakedTon, setStakedTon] = useState<number | null>(null);
  const [idleTon, setIdleTon] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
  const externalWallet = wallets.find((w) => w.walletClientType !== "privy");
  const hasLinkedExternalWallet = user?.linkedAccounts?.some(
    (acc) => acc.type === "wallet",
  );
  const primaryWallet =
    (hasLinkedExternalWallet && externalWallet) || embeddedWallet;
  const address = primaryWallet?.address;

  const fetchStaked = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const addr = address as `0x${string}`;
      const results = await client.multicall({
        contracts: [
          {
            address: CONTRACTS.TON as `0x${string}`,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [addr],
          },
          {
            address: CONTRACTS.DEPOSIT_MANAGER_PROXY as `0x${string}`,
            abi: stakedAbi,
            functionName: "accStakedAccount",
            args: [addr],
          },
          {
            address: CONTRACTS.DEPOSIT_MANAGER_PROXY as `0x${string}`,
            abi: stakedAbi,
            functionName: "pendingUnstakedAccount",
            args: [addr],
          },
        ],
      });
      const tonBal =
        results[0].status === "success" ? (results[0].result as bigint) : BigInt(0);
      const stakedBal =
        results[1].status === "success" ? (results[1].result as bigint) : BigInt(0);
      const pendingBal =
        results[2].status === "success" ? (results[2].result as bigint) : BigInt(0);
      const netStaked = stakedBal > pendingBal ? stakedBal - pendingBal : BigInt(0);
      setIdleTon(Number(formatUnits(tonBal, 18)));
      setStakedTon(Number(formatUnits(netStaked, 27)));
    } catch (e) {
      console.error("useStakedTon: failed to read on-chain balances:", e);
    }
    setLoading(false);
  }, [address]);

  useEffect(() => {
    if (address) fetchStaked();
    else setLoading(false);
  }, [address, fetchStaked]);

  return { stakedTon, idleTon, loading, address, wallet: primaryWallet };
}
