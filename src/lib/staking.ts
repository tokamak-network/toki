import { formatUnits } from "viem";
import { publicClient } from "./chain";
import { seigManagerAbi, layer2RegistryAbi, candidateAbi } from "./abi";
import { CONTRACTS, MAX_OPERATORS_DISPLAY } from "@/constants/contracts";

// APR calculation based on staking-community-version
// Reference: src/utils/apy/calculateRoi.ts
function calculateApr(totalStakedAmount: number, totalSupply: number): number {
  const seigPerBlock = 3.92;
  const blockNumsPerYear = 2_628_000; // ~12s block time
  const stakedRatio = totalStakedAmount / totalSupply;

  // 74% staker share formula (relativeSeigRate = 0.4)
  const apr =
    (seigPerBlock *
      blockNumsPerYear *
      (stakedRatio + 0.4 * (1 - stakedRatio))) /
    totalStakedAmount;

  return apr;
}

// Compound APY from APR
// Reference: staking-community-version calculateRoiBasedonCompound
function aprToApy(apr: number): number {
  const compoundsPerYear = 365; // daily compounding approximation
  return (1 + apr / compoundsPerYear) ** compoundsPerYear - 1;
}

export interface StakingData {
  totalStaked: string;
  totalStakedRaw: number;
  totalSupply: string;
  totalSupplyRaw: number;
  seigPerBlock: string;
  seigPerBlockRaw: number;
  apr: number;
  apy: number;
  operatorCount: number;
  operators: { name: string; address: string; totalStaked: string }[];
}

export async function fetchStakingData(): Promise<StakingData> {
  const seigManagerAddress = CONTRACTS.SEIG_MANAGER_PROXY as `0x${string}`;
  const registryAddress = CONTRACTS.LAYER2_REGISTRY_PROXY as `0x${string}`;

  // Batch read: stakeOfTotal, totalSupplyOfTon, seigPerBlock, numLayer2s
  const [stakeOfTotal, totalSupplyOfTon, seigPerBlockRaw, numLayer2s] =
    await Promise.all([
      publicClient.readContract({
        address: seigManagerAddress,
        abi: seigManagerAbi,
        functionName: "stakeOfTotal",
      }),
      publicClient.readContract({
        address: seigManagerAddress,
        abi: seigManagerAbi,
        functionName: "totalSupplyOfTon",
      }),
      publicClient.readContract({
        address: seigManagerAddress,
        abi: seigManagerAbi,
        functionName: "seigPerBlock",
      }),
      publicClient.readContract({
        address: registryAddress,
        abi: layer2RegistryAbi,
        functionName: "numLayer2s",
      }),
    ]);

  // Format from 27 decimals (RAY)
  const totalStakedNum = Number(formatUnits(stakeOfTotal, 27));
  const totalSupplyNum = Number(formatUnits(totalSupplyOfTon, 27));
  const seigPerBlockNum = Number(formatUnits(seigPerBlockRaw, 27));

  // Calculate APR/APY
  const apr = calculateApr(totalStakedNum, totalSupplyNum);
  const apy = aprToApy(apr);

  // Fetch operator list (capped for performance)
  const operatorCount = Number(numLayer2s);
  const fetchCount = Math.min(operatorCount, MAX_OPERATORS_DISPLAY);
  const operatorAddresses = await Promise.all(
    Array.from({ length: fetchCount }, (_, i) =>
      publicClient.readContract({
        address: registryAddress,
        abi: layer2RegistryAbi,
        functionName: "layer2ByIndex",
        args: [BigInt(i)],
      })
    )
  );

  // Multicall: get each operator's memo and totalStaked
  const memoContracts = operatorAddresses.map((addr) => ({
    address: addr,
    abi: candidateAbi,
    functionName: "memo" as const,
  }));
  const stakedContracts = operatorAddresses.map((addr) => ({
    address: addr,
    abi: candidateAbi,
    functionName: "totalStaked" as const,
  }));

  const [memoResults, stakedResults] = await Promise.all([
    publicClient.multicall({ contracts: memoContracts, allowFailure: true }),
    publicClient.multicall({ contracts: stakedContracts, allowFailure: true }),
  ]);

  const operators = operatorAddresses.map((addr, i) => ({
    name:
      memoResults[i].status === "success"
        ? (memoResults[i].result as string)
        : `Operator ${i}`,
    address: addr,
    totalStaked:
      stakedResults[i].status === "success"
        ? formatUnits(stakedResults[i].result as bigint, 27)
        : "0",
  }));

  // Sort operators by totalStaked descending
  operators.sort((a, b) => Number(b.totalStaked) - Number(a.totalStaked));

  return {
    totalStaked: totalStakedNum.toLocaleString("en-US", {
      maximumFractionDigits: 0,
    }),
    totalStakedRaw: totalStakedNum,
    totalSupply: totalSupplyNum.toLocaleString("en-US", {
      maximumFractionDigits: 0,
    }),
    totalSupplyRaw: totalSupplyNum,
    seigPerBlock: seigPerBlockNum.toFixed(2),
    seigPerBlockRaw: seigPerBlockNum,
    apr: apr * 100, // percentage
    apy: apy * 100, // percentage
    operatorCount,
    operators,
  };
}
