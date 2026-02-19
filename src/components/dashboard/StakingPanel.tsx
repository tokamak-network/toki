"use client";

import { useState, useEffect, useCallback } from "react";
import {
  createPublicClient,
  createWalletClient,
  http,
  formatUnits,
  parseUnits,
  encodeAbiParameters,
  custom,
} from "viem";
import { sepolia, mainnet } from "viem/chains";
import { CONTRACTS } from "@/constants/contracts";
import {
  seigManagerAbi,
  layer2RegistryAbi,
  candidateAbi,
  tonTokenAbi,
  depositManagerAbi,
} from "@/lib/abi";

const isTestnet = process.env.NEXT_PUBLIC_NETWORK === "sepolia";
const chain = isTestnet ? sepolia : mainnet;

const publicClient = createPublicClient({
  chain,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || undefined, {
    timeout: 15_000,
  }),
});

interface Operator {
  address: string;
  name: string;
  totalStaked: string;
  myStaked: string;
}

interface StakingPanelProps {
  walletAddress: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getEthereumProvider: () => Promise<any>;
  onBalanceChange?: () => void;
}

export default function StakingPanel({
  walletAddress,
  getEthereumProvider,
  onBalanceChange,
}: StakingPanelProps) {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [selectedOp, setSelectedOp] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [staking, setStaking] = useState(false);
  const [unstaking, setUnstaking] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tonBalance, setTonBalance] = useState<string>("0");

  const addr = walletAddress as `0x${string}`;
  const seigManagerAddr = CONTRACTS.SEIG_MANAGER_PROXY as `0x${string}`;
  const registryAddr = CONTRACTS.LAYER2_REGISTRY_PROXY as `0x${string}`;
  const tonAddr = CONTRACTS.TON as `0x${string}`;
  const wtonAddr = CONTRACTS.WTON as `0x${string}`;
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

      // Batch: memo, totalStaked, myStaked
      const memoContracts = addresses.map((a) => ({
        address: a,
        abi: candidateAbi,
        functionName: "memo" as const,
      }));
      const stakedContracts = addresses.map((a) => ({
        address: a,
        abi: candidateAbi,
        functionName: "totalStaked" as const,
      }));
      const myStakedContracts = addresses.map((a) => ({
        address: seigManagerAddr,
        abi: seigManagerAbi,
        functionName: "stakeOf" as const,
        args: [a, addr] as const,
      }));

      const [memoResults, stakedResults, myStakedResults] = await Promise.all([
        publicClient.multicall({ contracts: memoContracts, allowFailure: true }),
        publicClient.multicall({
          contracts: stakedContracts,
          allowFailure: true,
        }),
        publicClient.multicall({
          contracts: myStakedContracts,
          allowFailure: true,
        }),
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

      // Sort by totalStaked desc, take top 5
      ops.sort((a, b) => Number(b.totalStaked) - Number(a.totalStaked));
      const topOps = ops.slice(0, 5);
      setOperators(topOps);
      if (topOps.length > 0 && !selectedOp) {
        setSelectedOp(topOps[0].address);
      }

      // Fetch TON balance
      const tonBal = await publicClient.readContract({
        address: tonAddr,
        abi: tonTokenAbi,
        functionName: "balanceOf",
        args: [addr],
      });
      setTonBalance(formatUnits(tonBal, 18));
    } catch (e) {
      console.error("Failed to fetch operators:", e);
    }
    setLoading(false);
  }, [addr, seigManagerAddr, registryAddr, tonAddr, selectedOp]);

  useEffect(() => {
    if (walletAddress) {
      fetchOperators();
    }
  }, [walletAddress, fetchOperators]);

  const handleStake = async () => {
    if (!amount || !selectedOp) return;
    setStaking(true);
    setError(null);
    setTxHash(null);

    try {
      const provider = await getEthereumProvider();
      const walletClient = createWalletClient({
        chain,
        transport: custom(provider),
        account: addr,
      });

      // TON.approveAndCall(WTON, tonAmount, abi.encode(depositManager, layer2))
      // This swaps TON→WTON and deposits in 1 tx
      const tonAmount = parseUnits(amount, 18);
      const data = encodeAbiParameters(
        [{ type: "address" }, { type: "address" }],
        [depositManagerAddr, selectedOp as `0x${string}`]
      );

      const hash = await walletClient.writeContract({
        address: tonAddr,
        abi: tonTokenAbi,
        functionName: "approveAndCall",
        args: [wtonAddr, tonAmount, data],
      });

      setTxHash(hash);

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash });

      // Refresh data
      setAmount("");
      fetchOperators();
      onBalanceChange?.();
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      console.error("Staking failed:", errMsg);
      if (errMsg.includes("User rejected")) {
        setError("Transaction rejected by user");
      } else {
        setError(errMsg.slice(0, 200));
      }
    }
    setStaking(false);
  };

  const handleUnstake = async () => {
    if (!selectedOp) return;
    const selectedOperator = operators.find((o) => o.address === selectedOp);
    if (!selectedOperator || Number(selectedOperator.myStaked) <= 0) {
      setError("No staked balance on this operator");
      return;
    }

    setUnstaking(true);
    setError(null);
    setTxHash(null);

    try {
      const provider = await getEthereumProvider();
      const walletClient = createWalletClient({
        chain,
        transport: custom(provider),
        account: addr,
      });

      // requestWithdrawal with full staked amount (WTON 27 decimals)
      const wtonAmount = parseUnits(selectedOperator.myStaked, 27);

      const hash = await walletClient.writeContract({
        address: depositManagerAddr,
        abi: depositManagerAbi,
        functionName: "requestWithdrawal",
        args: [selectedOp as `0x${string}`, wtonAmount],
      });

      setTxHash(hash);
      await publicClient.waitForTransactionReceipt({ hash });

      fetchOperators();
      onBalanceChange?.();
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      console.error("Unstake failed:", errMsg);
      if (errMsg.includes("User rejected")) {
        setError("Transaction rejected by user");
      } else {
        setError(errMsg.slice(0, 200));
      }
    }
    setUnstaking(false);
  };

  const selectedOperator = operators.find((o) => o.address === selectedOp);
  const myStakedOnSelected = selectedOperator
    ? Number(selectedOperator.myStaked)
    : 0;

  if (loading) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Staking</h2>
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
        <h2 className="text-lg font-semibold">Staking</h2>
        <button
          onClick={fetchOperators}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Operator Selector */}
      <div className="mb-4">
        <label className="text-sm text-gray-400 mb-2 block">
          Select Operator
        </label>
        <div className="space-y-2">
          {operators.map((op) => (
            <button
              key={op.address}
              onClick={() => setSelectedOp(op.address)}
              className={`w-full p-3 rounded-lg text-left transition-colors ${
                selectedOp === op.address
                  ? "bg-accent-blue/20 border border-accent-blue/40"
                  : "bg-white/5 border border-transparent hover:bg-white/10"
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium text-gray-200 truncate max-w-[200px]">
                    {op.name || `${op.address.slice(0, 10)}...`}
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    {op.address.slice(0, 10)}...{op.address.slice(-6)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">
                    Total:{" "}
                    {Number(op.totalStaked).toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    })}{" "}
                    WTON
                  </div>
                  {Number(op.myStaked) > 0 && (
                    <div className="text-xs text-accent-cyan font-mono-num">
                      My:{" "}
                      {Number(op.myStaked).toLocaleString("en-US", {
                        maximumFractionDigits: 2,
                      })}{" "}
                      WTON
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Stake Input */}
      <div className="mb-4">
        <label className="text-sm text-gray-400 mb-2 block">
          Amount to Stake (TON)
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              min="0"
              step="any"
              className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-accent-blue/50 font-mono-num"
            />
            <button
              onClick={() => setAmount(tonBalance)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-accent-sky hover:text-accent-cyan transition-colors"
            >
              MAX
            </button>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Balance:{" "}
          {Number(tonBalance).toLocaleString("en-US", {
            maximumFractionDigits: 2,
          })}{" "}
          TON
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={handleStake}
          disabled={staking || !amount || Number(amount) <= 0}
          className="flex-1 py-3 rounded-lg bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] transition-transform"
        >
          {staking ? "Staking..." : "Stake TON"}
        </button>
        {myStakedOnSelected > 0 && (
          <button
            onClick={handleUnstake}
            disabled={unstaking}
            className="px-6 py-3 rounded-lg bg-white/10 text-gray-300 font-semibold text-sm disabled:opacity-40 hover:bg-white/15 transition-colors"
          >
            {unstaking ? "Requesting..." : "Unstake All"}
          </button>
        )}
      </div>

      {/* Status Messages */}
      {txHash && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 mb-3">
          <div className="text-sm text-green-400">Transaction submitted!</div>
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
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-3">
          <div className="text-sm text-red-400 break-all">{error}</div>
        </div>
      )}

      {/* My Staking Summary */}
      {operators.some((o) => Number(o.myStaked) > 0) && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <h3 className="text-sm text-gray-400 mb-3">My Staked Positions</h3>
          <div className="space-y-2">
            {operators
              .filter((o) => Number(o.myStaked) > 0)
              .map((op) => (
                <div
                  key={op.address}
                  className="flex justify-between items-center p-3 rounded-lg bg-white/5"
                >
                  <span className="text-sm text-gray-300 truncate max-w-[180px]">
                    {op.name || `${op.address.slice(0, 10)}...`}
                  </span>
                  <span className="text-sm font-mono-num text-accent-cyan">
                    {Number(op.myStaked).toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })}{" "}
                    WTON
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
