"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPublicClient, http, formatUnits } from "viem";
import { sepolia, mainnet } from "viem/chains";
import { CONTRACTS } from "@/constants/contracts";
import {
  layer2RegistryAbi,
  depositManagerAbi,
} from "@/lib/abi";

const isTestnet = process.env.NEXT_PUBLIC_NETWORK === "sepolia";
const chain = isTestnet ? sepolia : mainnet;
const BLOCK_TIME_SECONDS = 12;

const publicClient = createPublicClient({
  chain,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || undefined, {
    timeout: 15_000,
  }),
});

export interface WithdrawalRequest {
  index: number;
  withdrawableBlockNumber: bigint;
  amount: bigint;
  processed: boolean;
  isWithdrawable: boolean;
  blocksRemaining: number;
  operatorAddress: string;
  operatorName?: string;
}

export interface WithdrawalStatus {
  /** All pending (not yet withdrawable) requests */
  pendingRequests: WithdrawalRequest[];
  /** All withdrawable requests */
  withdrawableRequests: WithdrawalRequest[];
  /** Total pending amount (WTON, raw bigint) */
  totalPending: bigint;
  /** Total withdrawable amount (WTON, raw bigint) */
  totalWithdrawable: bigint;
  /** Formatted total pending */
  totalPendingFormatted: string;
  /** Formatted total withdrawable */
  totalWithdrawableFormatted: string;
  /** Whether there are any withdrawable requests */
  hasWithdrawable: boolean;
  /** Nearest withdrawable time in seconds from now (null if none pending) */
  nearestWithdrawSeconds: number | null;
  /** Formatted time remaining for nearest withdrawal */
  nearestWithdrawTimeFormatted: string | null;
  /** Loading state */
  loading: boolean;
  /** Refresh function */
  refresh: () => Promise<void>;
  /** Grouped by operator: { [operatorAddr]: WithdrawalRequest[] } */
  byOperator: Record<string, WithdrawalRequest[]>;
}

function formatTimeRemaining(blocks: number): string {
  const totalSeconds = blocks * BLOCK_TIME_SECONDS;
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function useWithdrawalStatus(address: string | undefined): WithdrawalStatus {
  const [allRequests, setAllRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const prevHasWithdrawable = useRef(false);
  const onWithdrawableCallbackRef = useRef<((count: number) => void) | null>(null);

  const registryAddr = CONTRACTS.LAYER2_REGISTRY_PROXY as `0x${string}`;
  const depositManagerAddr = CONTRACTS.DEPOSIT_MANAGER_PROXY as `0x${string}`;

  const fetchRequests = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    try {
      const addr = address as `0x${string}`;
      const blockNumber = await publicClient.getBlockNumber();

      const numLayer2s = await publicClient.readContract({
        address: registryAddr,
        abi: layer2RegistryAbi,
        functionName: "numLayer2s",
      });
      const count = Math.min(Number(numLayer2s), 10);
      const addresses = await Promise.all(
        Array.from({ length: count }, (_, i) =>
          publicClient.readContract({
            address: registryAddr,
            abi: layer2RegistryAbi,
            functionName: "layer2ByIndex",
            args: [BigInt(i)],
          })
        )
      );

      const requests: WithdrawalRequest[] = [];

      for (const layer2Addr of addresses) {
        try {
          const [numPending, requestIndex, numTotal] = await Promise.all([
            publicClient.readContract({
              address: depositManagerAddr,
              abi: depositManagerAbi,
              functionName: "numPendingRequests",
              args: [layer2Addr, addr],
            }),
            publicClient.readContract({
              address: depositManagerAddr,
              abi: depositManagerAbi,
              functionName: "withdrawalRequestIndex",
              args: [layer2Addr, addr],
            }),
            publicClient.readContract({
              address: depositManagerAddr,
              abi: depositManagerAbi,
              functionName: "numRequests",
              args: [layer2Addr, addr],
            }),
          ]);

          const pending = Number(numPending);
          if (pending === 0) continue;

          const startIndex = Number(requestIndex);
          const total = Number(numTotal);

          for (let i = startIndex; i < total && requests.length < pending + requests.length; i++) {
            try {
              const result = await publicClient.readContract({
                address: depositManagerAddr,
                abi: depositManagerAbi,
                functionName: "withdrawalRequest",
                args: [layer2Addr, addr, BigInt(i)],
              });

              const [withdrawableBlockNumber, amount, processed] = result as [bigint, bigint, boolean];
              if (processed) continue;

              const blocksRemaining = Number(withdrawableBlockNumber) - Number(blockNumber);
              requests.push({
                index: i,
                withdrawableBlockNumber,
                amount,
                processed,
                isWithdrawable: blocksRemaining <= 0,
                blocksRemaining: Math.max(0, blocksRemaining),
                operatorAddress: layer2Addr,
              });
            } catch {
              // Skip individual request errors
            }
          }
        } catch {
          // Skip operator errors
        }
      }

      setAllRequests(requests);

      // Check if new withdrawable requests appeared
      const newWithdrawableCount = requests.filter((r) => r.isWithdrawable).length;
      if (newWithdrawableCount > 0 && !prevHasWithdrawable.current) {
        onWithdrawableCallbackRef.current?.(newWithdrawableCount);
      }
      prevHasWithdrawable.current = newWithdrawableCount > 0;
    } catch (e) {
      console.error("Failed to fetch withdrawal requests:", e);
    }
    setLoading(false);
  }, [address, registryAddr, depositManagerAddr]);

  useEffect(() => {
    if (address) {
      fetchRequests();
    }
  }, [address, fetchRequests]);

  // Auto-refresh every 5 minutes to detect newly withdrawable requests
  useEffect(() => {
    if (!address) return;
    const interval = setInterval(fetchRequests, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [address, fetchRequests]);

  const pendingRequests = allRequests.filter((r) => !r.isWithdrawable);
  const withdrawableRequests = allRequests.filter((r) => r.isWithdrawable);

  const totalPending = pendingRequests.reduce((sum, r) => sum + r.amount, BigInt(0));
  const totalWithdrawable = withdrawableRequests.reduce((sum, r) => sum + r.amount, BigInt(0));

  // Nearest withdrawal
  const nearestPending = pendingRequests.length > 0
    ? pendingRequests.reduce((min, r) => r.blocksRemaining < min.blocksRemaining ? r : min)
    : null;

  const nearestWithdrawSeconds = nearestPending
    ? nearestPending.blocksRemaining * BLOCK_TIME_SECONDS
    : null;

  // Group by operator
  const byOperator: Record<string, WithdrawalRequest[]> = {};
  for (const req of allRequests) {
    if (!byOperator[req.operatorAddress]) {
      byOperator[req.operatorAddress] = [];
    }
    byOperator[req.operatorAddress].push(req);
  }

  return {
    pendingRequests,
    withdrawableRequests,
    totalPending,
    totalWithdrawable,
    totalPendingFormatted: Number(formatUnits(totalPending, 27)).toLocaleString("en-US", {
      maximumFractionDigits: 2,
    }),
    totalWithdrawableFormatted: Number(formatUnits(totalWithdrawable, 27)).toLocaleString("en-US", {
      maximumFractionDigits: 2,
    }),
    hasWithdrawable: withdrawableRequests.length > 0,
    nearestWithdrawSeconds,
    nearestWithdrawTimeFormatted: nearestPending
      ? formatTimeRemaining(nearestPending.blocksRemaining)
      : null,
    loading,
    refresh: fetchRequests,
    byOperator,
  };
}
