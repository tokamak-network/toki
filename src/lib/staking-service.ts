// ─── Staking service: pure logic extracted from StakingScreen ──────────
// Used by useChatStakingFlow for in-chat staking

import {
  formatUnits,
  parseUnits,
  encodeAbiParameters,
  encodeFunctionData,
  createWalletClient,
  custom,
} from "viem";
import { CONTRACTS } from "@/constants/contracts";
import {
  seigManagerAbi,
  layer2RegistryAbi,
  candidateAbi,
  tonTokenAbi,
} from "@/lib/abi";
import { publicClient, chain } from "@/lib/chain";

// ─── Types ────────────────────────────────────────────────────────────

export interface OperatorInfo {
  address: string;
  name: string;
  totalStaked: string;
  commissionRate: number; // percentage, negative = rebate
}

export interface StakeResult {
  success: boolean;
  txHash?: string;
  error?: string;
  errorType?: "rejected" | "insufficient-gas" | "generic";
}

// ─── Fetch top operators ──────────────────────────────────────────────

export async function fetchTopOperators(): Promise<OperatorInfo[]> {
  const registryAddr = CONTRACTS.LAYER2_REGISTRY_PROXY as `0x${string}`;
  const seigManagerAddr = CONTRACTS.SEIG_MANAGER_PROXY as `0x${string}`;

  const numLayer2s = await publicClient.readContract({
    address: registryAddr,
    abi: layer2RegistryAbi,
    functionName: "numLayer2s",
  });

  const count = Number(numLayer2s);
  const BATCH_SIZE = 50;
  const addresses: `0x${string}`[] = [];

  for (let start = 0; start < count; start += BATCH_SIZE) {
    const end = Math.min(start + BATCH_SIZE, count);
    const batchContracts = Array.from({ length: end - start }, (_, i) => ({
      address: registryAddr,
      abi: layer2RegistryAbi,
      functionName: "layer2ByIndex" as const,
      args: [BigInt(start + i)] as const,
    }));
    const batchResults = await publicClient.multicall({ contracts: batchContracts, allowFailure: true });
    for (const r of batchResults) {
      if (r.status === "success") addresses.push(r.result as `0x${string}`);
    }
  }

  const memoContracts = addresses.map((a) => ({
    address: a, abi: candidateAbi, functionName: "memo" as const,
  }));
  const stakedContracts = addresses.map((a) => ({
    address: a, abi: candidateAbi, functionName: "totalStaked" as const,
  }));
  const commissionContracts = addresses.map((a) => ({
    address: seigManagerAddr, abi: seigManagerAbi, functionName: "commissionRates" as const,
    args: [a] as const,
  }));
  const commissionNegContracts = addresses.map((a) => ({
    address: seigManagerAddr, abi: seigManagerAbi, functionName: "isCommissionRateNegative" as const,
    args: [a] as const,
  }));

  const [memoResults, stakedResults, commResults, commNegResults] = await Promise.all([
    publicClient.multicall({ contracts: memoContracts, allowFailure: true }),
    publicClient.multicall({ contracts: stakedContracts, allowFailure: true }),
    publicClient.multicall({ contracts: commissionContracts, allowFailure: true }),
    publicClient.multicall({ contracts: commissionNegContracts, allowFailure: true }),
  ]);

  const ops: OperatorInfo[] = addresses.map((a, i) => {
    const rawRate = commResults[i].status === "success"
      ? Number(formatUnits(commResults[i].result as bigint, 27)) * 100
      : 0;
    const isNeg = commNegResults[i].status === "success"
      ? (commNegResults[i].result as boolean)
      : false;
    return {
      address: a,
      name: memoResults[i].status === "success"
        ? (memoResults[i].result as string) || `Operator ${i}`
        : `Operator ${i}`,
      totalStaked: stakedResults[i].status === "success"
        ? formatUnits(stakedResults[i].result as bigint, 27)
        : "0",
      commissionRate: isNeg ? -rawRate : rawRate,
    };
  });

  ops.sort((a, b) => Number(b.totalStaked) - Number(a.totalStaked));
  return ops.slice(0, 10);
}

// ─── Toki Pick: best operator (lowest fee → highest staked) ───────────

export function tokiPick(operators: OperatorInfo[]): OperatorInfo | null {
  if (operators.length === 0) return null;
  const sorted = [...operators].sort((a, b) => {
    if (a.commissionRate !== b.commissionRate) return a.commissionRate - b.commissionRate;
    return Number(b.totalStaked) - Number(a.totalStaked);
  });
  return sorted[0];
}

// ─── Fetch TON balance ────────────────────────────────────────────────

export async function fetchTonBalance(address: `0x${string}`): Promise<string> {
  const tonAddr = CONTRACTS.TON as `0x${string}`;
  const bal = await publicClient.readContract({
    address: tonAddr,
    abi: tonTokenAbi,
    functionName: "balanceOf",
    args: [address],
  });
  return formatUnits(bal, 18);
}

// ─── Execute staking ──────────────────────────────────────────────────

export async function executeStaking(params: {
  walletAddress: `0x${string}`;
  operatorAddress: `0x${string}`;
  amount: string;
  smartAccountClient?: {
    sendTransaction: (args: { calls: { to: `0x${string}`; data: `0x${string}` }[] }) => Promise<`0x${string}`>;
  };
  sessionKey?: {
    delegationReady: boolean;
    stakeWithDelegation: (operator: `0x${string}`, amount: string) => Promise<`0x${string}`>;
  };
  getEthereumProvider?: () => Promise<unknown>;
}): Promise<StakeResult> {
  const { walletAddress, operatorAddress, amount, smartAccountClient, sessionKey, getEthereumProvider } = params;

  const tonAddr = CONTRACTS.TON as `0x${string}`;
  const wtonAddr = CONTRACTS.WTON as `0x${string}`;
  const depositManagerAddr = CONTRACTS.DEPOSIT_MANAGER_PROXY as `0x${string}`;

  try {
    const tonAmount = parseUnits(amount, 18);
    const stakingData = encodeAbiParameters(
      [{ type: "address" }, { type: "address" }],
      [depositManagerAddr, operatorAddress],
    );

    let hash: `0x${string}`;

    if (sessionKey?.delegationReady) {
      hash = await sessionKey.stakeWithDelegation(operatorAddress, amount);
    } else if (smartAccountClient) {
      hash = await smartAccountClient.sendTransaction({
        calls: [{
          to: tonAddr,
          data: encodeFunctionData({
            abi: tonTokenAbi,
            functionName: "approveAndCall",
            args: [wtonAddr, tonAmount, stakingData],
          }),
        }],
      });
    } else if (getEthereumProvider) {
      const provider = await getEthereumProvider();
      const walletClient = createWalletClient({
        chain,
        transport: custom(provider as Parameters<typeof custom>[0]),
        account: walletAddress,
      });
      hash = await walletClient.writeContract({
        address: tonAddr,
        abi: tonTokenAbi,
        functionName: "approveAndCall",
        args: [wtonAddr, tonAmount, stakingData],
      });
    } else {
      return { success: false, error: "No wallet available", errorType: "generic" };
    }

    await publicClient.waitForTransactionReceipt({ hash });
    return { success: true, txHash: hash };
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e);
    console.error("Staking failed:", errMsg);

    if (errMsg.includes("User rejected")) {
      return { success: false, error: errMsg, errorType: "rejected" };
    }
    if (errMsg.includes("insufficient TON") || errMsg.includes("insufficient funds") ||
        errMsg.includes("validatePaymasterUserOp") || errMsg.includes("Paymaster")) {
      return { success: false, error: errMsg, errorType: "insufficient-gas" };
    }
    return { success: false, error: errMsg.slice(0, 200), errorType: "generic" };
  }
}
