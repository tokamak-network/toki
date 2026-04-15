"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { formatUnits } from "viem";
import { CONTRACTS } from "@/constants/contracts";
import {
  layer2RegistryAbi,
  depositManagerAbi,
} from "@/lib/abi";
import { publicClient, isTestnet } from "@/lib/chain";

const BLOCK_TIME_SECONDS = 12;
const POLL_INTERVAL_MS = 30_000; // 30 seconds
const MULTICALL_BATCH_SIZE = 50; // Max calls per multicall to avoid RPC limits

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function batchedMulticall(contracts: any[]): Promise<any[]> {
  if (contracts.length <= MULTICALL_BATCH_SIZE) {
    return publicClient.multicall({ contracts });
  }
  const results = [];
  for (let i = 0; i < contracts.length; i += MULTICALL_BATCH_SIZE) {
    const chunk = contracts.slice(i, i + MULTICALL_BATCH_SIZE);
    const chunkResults = await publicClient.multicall({ contracts: chunk });
    results.push(...chunkResults);
  }
  return results;
}

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

      // Fetch operator count
      const numLayer2s = await publicClient.readContract({
        address: registryAddr,
        abi: layer2RegistryAbi,
        functionName: "numLayer2s",
      });
      const count = Number(numLayer2s);

      // Multicall: get all operator addresses at once
      const indexCalls = Array.from({ length: count }, (_, i) => ({
        address: registryAddr,
        abi: layer2RegistryAbi,
        functionName: "layer2ByIndex" as const,
        args: [BigInt(i)] as const,
      }));
      const indexResults = await batchedMulticall(indexCalls);
      const addresses = indexResults
        .filter((r) => r.status === "success")
        .map((r) => r.result as `0x${string}`);

      // Multicall: check numPendingRequests for ALL operators at once
      const pendingCalls = addresses.map((a) => ({
        address: depositManagerAddr,
        abi: depositManagerAbi,
        functionName: "numPendingRequests" as const,
        args: [a, addr] as const,
      }));
      const pendingResults = await batchedMulticall(pendingCalls);

      // Only process operators that have pending requests
      const operatorsWithPending = addresses.filter(
        (_, i) => pendingResults[i].status === "success" && Number(pendingResults[i].result) > 0
      );

      if (operatorsWithPending.length === 0) {
        setAllRequests([]);
        prevHasWithdrawable.current = false;
        setLoading(false);
        return;
      }

      // Multicall: get requestIndex + numRequests for operators with pending
      const detailCalls = operatorsWithPending.flatMap((a) => [
        {
          address: depositManagerAddr,
          abi: depositManagerAbi,
          functionName: "withdrawalRequestIndex" as const,
          args: [a, addr] as const,
        },
        {
          address: depositManagerAddr,
          abi: depositManagerAbi,
          functionName: "numRequests" as const,
          args: [a, addr] as const,
        },
      ]);
      const detailResults = await batchedMulticall(detailCalls);

      // Build batch of all withdrawal request calls
      const requestCalls: { layer2Addr: string; index: number }[] = [];
      for (let opIdx = 0; opIdx < operatorsWithPending.length; opIdx++) {
        const startIndex = detailResults[opIdx * 2].status === "success"
          ? Number(detailResults[opIdx * 2].result) : 0;
        const total = detailResults[opIdx * 2 + 1].status === "success"
          ? Number(detailResults[opIdx * 2 + 1].result) : 0;

        for (let i = startIndex; i < total; i++) {
          requestCalls.push({ layer2Addr: operatorsWithPending[opIdx], index: i });
        }
      }

      // Multicall all withdrawal requests at once
      const requests: WithdrawalRequest[] = [];
      if (requestCalls.length > 0) {
        const withdrawalCalls = requestCalls.map((rc) => ({
          address: depositManagerAddr,
          abi: depositManagerAbi,
          functionName: "withdrawalRequest" as const,
          args: [rc.layer2Addr as `0x${string}`, addr, BigInt(rc.index)] as const,
        }));
        const withdrawalResults = await batchedMulticall(withdrawalCalls);

        for (let i = 0; i < withdrawalResults.length; i++) {
          if (withdrawalResults[i].status !== "success") continue;
          const [withdrawableBlockNumber, amount, processed] = withdrawalResults[i].result as [bigint, bigint, boolean];
          if (processed) continue;

          const blocksRemaining = Number(withdrawableBlockNumber) - Number(blockNumber);
          // On testnet (Sepolia), delay is set to 1 block — treat all unprocessed requests as withdrawable
          const withdrawable = isTestnet ? true : blocksRemaining <= 0;
          requests.push({
            index: requestCalls[i].index,
            withdrawableBlockNumber,
            amount,
            processed,
            isWithdrawable: withdrawable,
            blocksRemaining: withdrawable ? 0 : Math.max(0, blocksRemaining),
            operatorAddress: requestCalls[i].layer2Addr,
          });
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
      // On error (e.g. 429 rate limit), preserve existing data instead of clearing
      console.error("Failed to fetch withdrawal requests:", e);
    }
    setLoading(false);
  }, [address, registryAddr, depositManagerAddr]);

  // Delay initial fetch to let lighter RPC calls (e.g. fetchBalances) complete first
  useEffect(() => {
    if (!address) return;
    const timeout = setTimeout(() => { fetchRequests(); }, 2000);
    return () => clearTimeout(timeout);
  }, [address, fetchRequests]);

  // Poll periodically instead of every block to avoid RPC rate limits
  useEffect(() => {
    if (!address) return;
    const id = setInterval(() => { fetchRequests(); }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
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
