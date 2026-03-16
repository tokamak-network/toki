"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  createWalletClient,
  formatUnits,
  parseUnits,
  encodeFunctionData,
  custom,
} from "viem";
import { CONTRACTS } from "@/constants/contracts";
import {
  seigManagerAbi,
  layer2RegistryAbi,
  candidateAbi,
  depositManagerAbi,
} from "@/lib/abi";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { chain, publicClient, isTestnet } from "@/lib/chain";

const BLOCK_TIME_SECONDS = 12;

interface Operator {
  address: string;
  name: string;
  totalStaked: string;
  myStaked: string;
}

interface WithdrawalRequest {
  index: number;
  withdrawableBlockNumber: bigint;
  amount: bigint;
  processed: boolean;
  isWithdrawable: boolean;
  blocksRemaining: number;
}

import type { PaymasterMode } from "@/hooks/useEip7702";

interface UnstakingPanelProps {
  walletAddress: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getEthereumProvider: () => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  smartAccountClient?: { sendTransaction: (...args: any[]) => Promise<`0x${string}`> } | null;
  onBalanceChange?: () => void;
  paymasterMode?: PaymasterMode;
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

export default function UnstakingPanel({
  walletAddress,
  getEthereumProvider,
  smartAccountClient,
  onBalanceChange,
  paymasterMode = "none",
}: UnstakingPanelProps) {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [unstakeAmounts, setUnstakeAmounts] = useState<Record<string, string>>({});
  const [requesting, setRequesting] = useState<string | null>(null);
  const [processingOp, setProcessingOp] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [withdrawalRequests, setWithdrawalRequests] = useState<Record<string, WithdrawalRequest[]>>({});
  const [loadingRequests, setLoadingRequests] = useState(false);
  const operatorsRef = useRef(operators);
  operatorsRef.current = operators;
  const { t } = useTranslation();

  const addr = walletAddress as `0x${string}`;
  const seigManagerAddr = CONTRACTS.SEIG_MANAGER_PROXY as `0x${string}`;
  const registryAddr = CONTRACTS.LAYER2_REGISTRY_PROXY as `0x${string}`;
  const depositManagerAddr = CONTRACTS.DEPOSIT_MANAGER_PROXY as `0x${string}`;

  const fetchOperators = useCallback(async () => {
    setLoading(true);
    try {
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

      const memoContracts = addresses.map((a) => ({
        address: a,
        abi: candidateAbi,
        functionName: "memo" as const,
      }));
      const myStakedContracts = addresses.map((a) => ({
        address: seigManagerAddr,
        abi: seigManagerAbi,
        functionName: "stakeOf" as const,
        args: [a, addr] as const,
      }));
      const stakedContracts = addresses.map((a) => ({
        address: a,
        abi: candidateAbi,
        functionName: "totalStaked" as const,
      }));

      const [memoResults, stakedResults, myStakedResults] = await Promise.all([
        publicClient.multicall({ contracts: memoContracts, allowFailure: true }),
        publicClient.multicall({ contracts: stakedContracts, allowFailure: true }),
        publicClient.multicall({ contracts: myStakedContracts, allowFailure: true }),
      ]);

      const ops: Operator[] = addresses.map((a, i) => ({
        address: a,
        name:
          memoResults[i].status === "success"
            ? (memoResults[i].result as string) || `Operator ${i}`
            : `Operator ${i}`,
        totalStaked:
          stakedResults[i].status === "success"
            ? formatUnits(stakedResults[i].result as bigint, 27)
            : "0",
        myStaked:
          myStakedResults[i].status === "success"
            ? formatUnits(myStakedResults[i].result as bigint, 27)
            : "0",
      }));

      // Only show operators where user has staked
      const stakedOps = ops.filter((o) => Number(o.myStaked) > 0);
      stakedOps.sort((a, b) => Number(b.myStaked) - Number(a.myStaked));
      setOperators(stakedOps);
    } catch (e) {
      console.error("Failed to fetch operators:", e);
    }
    setLoading(false);
  }, [addr, seigManagerAddr, registryAddr]);

  const fetchWithdrawalRequests = useCallback(async () => {
    if (operatorsRef.current.length === 0 && !loading) {
      // Even with no staked operators, check all layer2s for pending requests
    }
    setLoadingRequests(true);
    try {
      const blockNumber = await publicClient.getBlockNumber();

      // Get all layer2 addresses to check for pending requests
      const numLayer2s = await publicClient.readContract({
        address: registryAddr,
        abi: layer2RegistryAbi,
        functionName: "numLayer2s",
      });
      const count = Math.min(Number(numLayer2s), 10);
      const allAddresses = await Promise.all(
        Array.from({ length: count }, (_, i) =>
          publicClient.readContract({
            address: registryAddr,
            abi: layer2RegistryAbi,
            functionName: "layer2ByIndex",
            args: [BigInt(i)],
          })
        )
      );

      const allRequests: Record<string, WithdrawalRequest[]> = {};

      for (const layer2Addr of allAddresses) {
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
          const requests: WithdrawalRequest[] = [];

          for (let i = startIndex; i < total && requests.length < pending; i++) {
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
              });
            } catch {
              // Skip individual request errors
            }
          }

          if (requests.length > 0) {
            allRequests[layer2Addr] = requests;
          }
        } catch {
          // Skip operator errors
        }
      }

      setWithdrawalRequests(allRequests);
    } catch (e) {
      console.error("Failed to fetch withdrawal requests:", e);
    }
    setLoadingRequests(false);
  }, [addr, depositManagerAddr, registryAddr, loading]);

  useEffect(() => {
    if (walletAddress) {
      fetchOperators();
    }
  }, [walletAddress, fetchOperators]);

  useEffect(() => {
    if (walletAddress) {
      fetchWithdrawalRequests();
    }
  }, [walletAddress, fetchWithdrawalRequests]);

  const handleRequestWithdrawal = async (operatorAddr: string) => {
    const unstakeAmount = unstakeAmounts[operatorAddr];
    if (!unstakeAmount || Number(unstakeAmount) <= 0) return;

    setRequesting(operatorAddr);
    setError(null);
    setTxHash(null);

    try {
      const wtonAmount = parseUnits(unstakeAmount, 27);
      let hash: `0x${string}`;

      if (smartAccountClient) {
        hash = await smartAccountClient.sendTransaction({
          calls: [
            {
              to: depositManagerAddr,
              data: encodeFunctionData({
                abi: depositManagerAbi,
                functionName: "requestWithdrawal",
                args: [operatorAddr as `0x${string}`, wtonAmount],
              }),
            },
          ],
        });
      } else {
        const provider = await getEthereumProvider();
        const walletClient = createWalletClient({
          chain,
          transport: custom(provider),
          account: addr,
        });

        hash = await walletClient.writeContract({
          address: depositManagerAddr,
          abi: depositManagerAbi,
          functionName: "requestWithdrawal",
          args: [operatorAddr as `0x${string}`, wtonAmount],
        });
      }

      setTxHash(hash);
      await publicClient.waitForTransactionReceipt({ hash });

      setUnstakeAmounts((prev) => ({ ...prev, [operatorAddr]: "" }));
      fetchOperators();
      fetchWithdrawalRequests();
      onBalanceChange?.();
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      console.error("Unstake request failed:", errMsg);
      if (errMsg.includes("User rejected")) {
        setError(t.dashboard.txRejected);
      } else if (errMsg.includes("insufficient") || errMsg.includes("funds")) {
        setError(t.dashboard.insufficientTonForGas);
      } else if (errMsg.includes("Paymaster")) {
        setError(t.dashboard.paymasterValidationFailed);
      } else {
        setError(errMsg.slice(0, 200));
      }
    }
    setRequesting(null);
  };

  const handleProcessRequests = async (operatorAddr: string, receiveTON: boolean) => {
    const requests = withdrawalRequests[operatorAddr];
    if (!requests) return;

    const withdrawableCount = requests.filter((r) => r.isWithdrawable).length;
    if (withdrawableCount === 0) return;

    setProcessingOp(operatorAddr);
    setError(null);
    setTxHash(null);

    try {
      let hash: `0x${string}`;

      if (smartAccountClient) {
        hash = await smartAccountClient.sendTransaction({
          calls: [
            {
              to: depositManagerAddr,
              data: encodeFunctionData({
                abi: depositManagerAbi,
                functionName: "processRequests",
                args: [operatorAddr as `0x${string}`, BigInt(withdrawableCount), receiveTON],
              }),
            },
          ],
        });
      } else {
        const provider = await getEthereumProvider();
        const walletClient = createWalletClient({
          chain,
          transport: custom(provider),
          account: addr,
        });

        hash = await walletClient.writeContract({
          address: depositManagerAddr,
          abi: depositManagerAbi,
          functionName: "processRequests",
          args: [operatorAddr as `0x${string}`, BigInt(withdrawableCount), receiveTON],
        });
      }

      setTxHash(hash);
      await publicClient.waitForTransactionReceipt({ hash });

      fetchOperators();
      fetchWithdrawalRequests();
      onBalanceChange?.();
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      console.error("Process requests failed:", errMsg);
      if (errMsg.includes("User rejected")) {
        setError(t.dashboard.txRejected);
      } else {
        setError(errMsg.slice(0, 200));
      }
    }
    setProcessingOp(null);
  };

  // Compute totals
  const totalPendingAmount = Object.values(withdrawalRequests)
    .flat()
    .filter((r) => !r.isWithdrawable)
    .reduce((sum, r) => sum + r.amount, BigInt(0));

  const totalWithdrawableAmount = Object.values(withdrawalRequests)
    .flat()
    .filter((r) => r.isWithdrawable)
    .reduce((sum, r) => sum + r.amount, BigInt(0));

  const totalPendingCount = Object.values(withdrawalRequests)
    .flat()
    .filter((r) => !r.isWithdrawable).length;

  const totalWithdrawableCount = Object.values(withdrawalRequests)
    .flat()
    .filter((r) => r.isWithdrawable).length;

  if (loading) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">{t.dashboard.unstaking}</h2>
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-white/5 rounded-lg" />
          <div className="h-10 bg-white/5 rounded-lg" />
          <div className="h-10 bg-white/5 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{t.dashboard.unstaking}</h2>
          {smartAccountClient && paymasterMode === "sponsor" && (
            <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400">
              {t.dashboard.gaslessShort}
            </span>
          )}
        </div>
        <button
          onClick={() => {
            fetchOperators();
            fetchWithdrawalRequests();
          }}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          {t.dashboard.refresh}
        </button>
      </div>

      {/* Withdrawal Delay Info */}
      <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/10 mb-5">
        <div className="text-xs text-yellow-400/80">
          {t.dashboard.withdrawalDelay}
        </div>
      </div>

      {/* Summary Cards */}
      {(totalPendingAmount > BigInt(0) || totalWithdrawableAmount > BigInt(0)) && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3 rounded-lg bg-white/5">
            <div className="text-xs text-gray-500 mb-1">{t.dashboard.pendingAmount} ({totalPendingCount})</div>
            <div className="text-sm font-mono-num text-yellow-400">
              {Number(formatUnits(totalPendingAmount, 27)).toLocaleString("en-US", {
                maximumFractionDigits: 2,
              })}{" "}
              WTON
            </div>
          </div>
          <div className="p-3 rounded-lg bg-white/5">
            <div className="text-xs text-gray-500 mb-1">{t.dashboard.withdrawableAmount} ({totalWithdrawableCount})</div>
            <div className="text-sm font-mono-num text-green-400">
              {Number(formatUnits(totalWithdrawableAmount, 27)).toLocaleString("en-US", {
                maximumFractionDigits: 2,
              })}{" "}
              WTON
            </div>
          </div>
        </div>
      )}

      {/* My Staking Positions */}
      <div className="mb-6">
        <h3 className="text-sm text-gray-400 mb-3">{t.dashboard.myStakingPositions2}</h3>
        {operators.length === 0 ? (
          <div className="p-4 rounded-lg bg-white/5 text-center text-sm text-gray-500">
            {t.dashboard.noStakedToUnstake}
          </div>
        ) : (
          <div className="space-y-3">
            {operators.map((op) => (
              <div
                key={op.address}
                className="p-4 rounded-lg bg-white/5 border border-white/5"
              >
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <div className="text-sm font-medium text-gray-200 truncate max-w-[200px]">
                      {op.name || `${op.address.slice(0, 10)}...`}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      {op.address.slice(0, 10)}...{op.address.slice(-6)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono-num text-accent-cyan">
                      {Number(op.myStaked).toLocaleString("en-US", {
                        maximumFractionDigits: 2,
                      })}{" "}
                      WTON
                    </div>
                    <div className="text-xs text-gray-500">
                      {t.dashboard.myStake}
                    </div>
                  </div>
                </div>

                {/* Partial Unstake Input */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      value={unstakeAmounts[op.address] || ""}
                      onChange={(e) =>
                        setUnstakeAmounts((prev) => ({
                          ...prev,
                          [op.address]: e.target.value,
                        }))
                      }
                      placeholder={t.dashboard.amountToUnstake}
                      min="0"
                      step="any"
                      className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-accent-blue/50 font-mono-num text-sm"
                    />
                    <button
                      onClick={() =>
                        setUnstakeAmounts((prev) => ({
                          ...prev,
                          [op.address]: op.myStaked,
                        }))
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-accent-sky hover:text-accent-cyan transition-colors"
                    >
                      MAX
                    </button>
                  </div>
                  <button
                    onClick={() => handleRequestWithdrawal(op.address)}
                    disabled={
                      requesting === op.address ||
                      !unstakeAmounts[op.address] ||
                      Number(unstakeAmounts[op.address]) <= 0 ||
                      Number(unstakeAmounts[op.address]) > Number(op.myStaked)
                    }
                    className="px-4 py-2.5 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-500/30 transition-colors whitespace-nowrap"
                  >
                    {requesting === op.address
                      ? t.dashboard.requestingUnstake
                      : t.dashboard.requestUnstake}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Withdrawal Requests */}
      <div>
        <h3 className="text-sm text-gray-400 mb-3">
          {t.dashboard.pendingWithdrawals}
          {Object.values(withdrawalRequests).flat().length > 0 &&
            ` (${Object.values(withdrawalRequests).flat().length})`}
        </h3>

        {loadingRequests ? (
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-white/5 rounded-lg" />
          </div>
        ) : Object.keys(withdrawalRequests).length === 0 ? (
          <div className="p-4 rounded-lg bg-white/5 text-center text-sm text-gray-500">
            {t.dashboard.noPendingRequests}
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(withdrawalRequests).map(([opAddr, requests]) => {
              // Find operator name
              const opName = operators.find((o) => o.address === opAddr)?.name ||
                `${opAddr.slice(0, 10)}...${opAddr.slice(-6)}`;
              const withdrawableCount = requests.filter((r) => r.isWithdrawable).length;

              return (
                <div key={opAddr} className="rounded-lg bg-white/5 border border-white/5 overflow-hidden">
                  {/* Operator Header */}
                  <div className="px-4 py-2 bg-white/5 flex justify-between items-center">
                    <span className="text-xs text-gray-400 truncate max-w-[200px]">{opName}</span>
                    <span className="text-xs text-gray-500 font-mono">
                      {opAddr.slice(0, 8)}...{opAddr.slice(-4)}
                    </span>
                  </div>

                  {/* Individual Requests */}
                  <div className="divide-y divide-white/5">
                    {requests.map((req, idx) => (
                      <div key={idx} className="px-4 py-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-sm font-mono-num text-gray-200">
                              {Number(formatUnits(req.amount, 27)).toLocaleString("en-US", {
                                maximumFractionDigits: 2,
                              })}{" "}
                              WTON
                            </span>
                          </div>
                          <div className="text-right">
                            {req.isWithdrawable ? (
                              <span className="text-xs font-medium text-green-400">
                                {t.dashboard.withdrawable}
                              </span>
                            ) : (
                              <div>
                                <div className="text-xs text-yellow-400">
                                  {t.dashboard.waiting}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {t.dashboard.blocksRemaining.replace("{blocks}", req.blocksRemaining.toLocaleString())}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {t.dashboard.timeRemaining.replace("{time}", formatTimeRemaining(req.blocksRemaining))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Withdraw Buttons */}
                  {withdrawableCount > 0 && (
                    <div className="px-4 py-3 bg-green-500/5 border-t border-white/5 flex gap-2">
                      <button
                        onClick={() => handleProcessRequests(opAddr, true)}
                        disabled={processingOp === opAddr}
                        className="flex-1 py-2 rounded-lg bg-green-600/80 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-600 transition-colors"
                      >
                        {processingOp === opAddr
                          ? t.dashboard.processing
                          : t.dashboard.withdrawAsTon}
                      </button>
                      <button
                        onClick={() => handleProcessRequests(opAddr, false)}
                        disabled={processingOp === opAddr}
                        className="flex-1 py-2 rounded-lg bg-white/10 text-gray-300 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/15 transition-colors"
                      >
                        {processingOp === opAddr
                          ? t.dashboard.processing
                          : t.dashboard.withdrawAsWton}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Status Messages */}
      {txHash && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 mt-4">
          <div className="text-sm text-green-400">{t.dashboard.txSubmitted}</div>
          <a
            href={`https://${isTestnet ? "sepolia." : ""}etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-green-500 hover:text-green-300 font-mono break-all"
          >
            {txHash}
          </a>
        </div>
      )}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 mt-4">
          <div className="text-sm text-red-400 break-all">{error}</div>
        </div>
      )}
    </div>
  );
}
