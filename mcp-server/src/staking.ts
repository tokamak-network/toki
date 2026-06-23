// Read-only Tokamak staking data via viem. Mirrors src/lib/staking.ts in the app
// (same APR formula, same RAY decimals). No signing — purely public reads.
import { formatUnits } from "viem";
import { publicClient } from "./chain.js";
import {
  CONTRACTS,
  RAY_DECIMALS,
  TON_DECIMALS,
  MAX_OPERATORS,
  seigManagerAbi,
  layer2RegistryAbi,
  candidateAbi,
  erc20Abi,
  depositManagerAbi,
} from "./contracts.js";

const SEIG = CONTRACTS.SEIG_MANAGER_PROXY as `0x${string}`;
const REGISTRY = CONTRACTS.LAYER2_REGISTRY_PROXY as `0x${string}`;
const DEPOSIT = CONTRACTS.DEPOSIT_MANAGER_PROXY as `0x${string}`;
const TON = CONTRACTS.TON as `0x${string}`;

// 74% staker-share APR formula (relativeSeigRate = 0.4), per the community version.
function calculateApr(totalStaked: number, totalSupply: number): number {
  const seigPerBlock = 3.92;
  const blocksPerYear = 2_628_000;
  const stakedRatio = totalStaked / totalSupply;
  return (
    (seigPerBlock * blocksPerYear * (stakedRatio + 0.4 * (1 - stakedRatio))) /
    totalStaked
  );
}
function aprToApy(apr: number): number {
  const n = 365;
  return (1 + apr / n) ** n - 1;
}

export interface Operator {
  name: string;
  address: string;
  totalStaked: number;
  commissionPct: number; // signed: negative = rebate to stakers (better)
}

export interface NetworkStaking {
  network: "mainnet" | "sepolia";
  apr: number; // %
  apy: number; // %
  totalStaked: number;
  totalSupply: number;
  seigPerBlock: number;
  operatorCount: number;
  operators: Operator[];
  tokiPick: Operator | null; // lowest fee -> highest stake
}

export async function fetchStakingData(limit = MAX_OPERATORS): Promise<NetworkStaking> {
  const [stakeOfTotal, totalSupplyOfTon, seigPerBlockRaw, numLayer2s] =
    await Promise.all([
      publicClient.readContract({ address: SEIG, abi: seigManagerAbi, functionName: "stakeOfTotal" }),
      publicClient.readContract({ address: SEIG, abi: seigManagerAbi, functionName: "totalSupplyOfTon" }),
      publicClient.readContract({ address: SEIG, abi: seigManagerAbi, functionName: "seigPerBlock" }),
      publicClient.readContract({ address: REGISTRY, abi: layer2RegistryAbi, functionName: "numLayer2s" }),
    ]);

  const totalStaked = Number(formatUnits(stakeOfTotal, RAY_DECIMALS));
  const totalSupply = Number(formatUnits(totalSupplyOfTon, RAY_DECIMALS));
  const seigPerBlock = Number(formatUnits(seigPerBlockRaw, RAY_DECIMALS));
  const apr = calculateApr(totalStaked, totalSupply);

  const operatorCount = Number(numLayer2s);
  const fetchCount = Math.min(operatorCount, limit);

  const addresses = (await Promise.all(
    Array.from({ length: fetchCount }, (_, i) =>
      publicClient.readContract({ address: REGISTRY, abi: layer2RegistryAbi, functionName: "layer2ByIndex", args: [BigInt(i)] }),
    ),
  )) as `0x${string}`[];

  const [memos, stakes, rates, negs] = await Promise.all([
    publicClient.multicall({ allowFailure: true, contracts: addresses.map((a) => ({ address: a, abi: candidateAbi, functionName: "memo" as const })) }),
    publicClient.multicall({ allowFailure: true, contracts: addresses.map((a) => ({ address: a, abi: candidateAbi, functionName: "totalStaked" as const })) }),
    publicClient.multicall({ allowFailure: true, contracts: addresses.map((a) => ({ address: SEIG, abi: seigManagerAbi, functionName: "commissionRates" as const, args: [a] })) }),
    publicClient.multicall({ allowFailure: true, contracts: addresses.map((a) => ({ address: SEIG, abi: seigManagerAbi, functionName: "isCommissionRateNegative" as const, args: [a] })) }),
  ]);

  const operators: Operator[] = addresses.map((address, i) => {
    const rate = rates[i].status === "success" ? Number(formatUnits(rates[i].result as bigint, RAY_DECIMALS)) * 100 : 0;
    const negative = negs[i].status === "success" ? (negs[i].result as boolean) : false;
    return {
      name: memos[i].status === "success" ? (memos[i].result as string) || `Operator ${i}` : `Operator ${i}`,
      address,
      totalStaked: stakes[i].status === "success" ? Number(formatUnits(stakes[i].result as bigint, RAY_DECIMALS)) : 0,
      commissionPct: negative ? -rate : rate,
    };
  });

  operators.sort((a, b) => b.totalStaked - a.totalStaked);

  // Toki Pick: lowest commission first (rebates win), then most staked.
  const tokiPick =
    [...operators].sort((a, b) => a.commissionPct - b.commissionPct || b.totalStaked - a.totalStaked)[0] ?? null;

  return {
    network: process.env.TOKI_NETWORK === "sepolia" ? "sepolia" : "mainnet",
    apr: apr * 100,
    apy: aprToApy(apr) * 100,
    totalStaked,
    totalSupply,
    seigPerBlock,
    operatorCount,
    operators,
    tokiPick,
  };
}

export interface Position {
  address: string;
  idleTon: number; // wallet TON not staked
  staked: number; // total staked across operators
  pendingUnstake: number; // requested, in 14-day cooldown
  total: number;
}

export async function fetchPosition(address: string): Promise<Position> {
  const acct = address as `0x${string}`;
  const [bal, staked, pending] = await Promise.all([
    publicClient.readContract({ address: TON, abi: erc20Abi, functionName: "balanceOf", args: [acct] }),
    publicClient.readContract({ address: DEPOSIT, abi: depositManagerAbi, functionName: "accStakedAccount", args: [acct] }),
    publicClient.readContract({ address: DEPOSIT, abi: depositManagerAbi, functionName: "pendingUnstakedAccount", args: [acct] }),
  ]);
  const idleTon = Number(formatUnits(bal, TON_DECIMALS));
  const stakedNum = Number(formatUnits(staked, RAY_DECIMALS));
  const pendingNum = Number(formatUnits(pending, RAY_DECIMALS));
  const net = stakedNum > pendingNum ? stakedNum - pendingNum : 0;
  return { address, idleTon, staked: net, pendingUnstake: pendingNum, total: idleTon + net };
}
