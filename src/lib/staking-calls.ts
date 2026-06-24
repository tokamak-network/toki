/**
 * Build the staking call(s).
 *
 * The stake is funded **WTON-first**: any WTON the user already holds is deposited
 * directly (no wrap needed — the DepositManager accepts WTON callbacks), and only
 * the shortfall is wrapped from TON. `wtonAvailable` (RAY, 27dp) is the user's
 * spendable WTON balance; pass 0n (default) for the legacy TON-only behaviour.
 *
 * Per funding portion:
 *   WTON portion:           WTON.approveAndCall(DM, wtonRay, operator)              — 1 call
 *   TON portion (Sepolia):  TON.approveAndCall(WTON, ton, [DM, op])                 — 1 call
 *   TON portion (Mainnet):  TON.approve → WTON.swapFromTON → WTON.approveAndCall(DM) — 3 calls
 *
 * Mainnet's DepositManager only accepts WTON callbacks (ton() == 0x0), so the TON
 * portion must be converted TON→WTON first, then deposited via WTON.approveAndCall.
 */
import { encodeFunctionData, encodeAbiParameters, type Address } from "viem";
import { tonTokenAbi, wtonTokenAbi } from "@/lib/abi";
import { isTestnet } from "@/lib/chain";

interface Call {
  to: Address;
  data: `0x${string}`;
}

// 27 (WTON / RAY) − 18 (TON) decimals.
const RAY_PER_TON = BigInt("1000000000");

export function buildStakingCalls(
  tonAddr: Address,
  wtonAddr: Address,
  depositManagerAddr: Address,
  operator: Address,
  tonAmount: bigint,
  wtonAvailable: bigint = BigInt(0),
): Call[] {
  const operatorData = encodeAbiParameters([{ type: "address" }], [operator]);

  // Split the stake: cover as much as possible from existing WTON (aligned to
  // 18dp so both portions stay exact — sub-1e9-RAY dust is left untouched), and
  // wrap the remainder from TON.
  const wtonAvail18 = wtonAvailable / RAY_PER_TON; // floor → 18dp value
  const wtonUse18 = wtonAvail18 >= tonAmount ? tonAmount : wtonAvail18;
  const tonUse18 = tonAmount - wtonUse18;

  const calls: Call[] = [];

  // 1) WTON portion — deposit the WTON the user already holds, directly.
  if (wtonUse18 > BigInt(0)) {
    calls.push({
      to: wtonAddr,
      data: encodeFunctionData({
        abi: wtonTokenAbi,
        functionName: "approveAndCall",
        args: [depositManagerAddr, wtonUse18 * RAY_PER_TON, operatorData],
      }),
    });
  }

  // 2) TON portion — wrap to WTON, then deposit.
  if (tonUse18 > BigInt(0)) {
    if (isTestnet) {
      // Sepolia: single approveAndCall — TON→WTON + deposit in one tx.
      const stakingData = encodeAbiParameters(
        [{ type: "address" }, { type: "address" }],
        [depositManagerAddr, operator],
      );
      calls.push({
        to: tonAddr,
        data: encodeFunctionData({
          abi: tonTokenAbi,
          functionName: "approveAndCall",
          args: [wtonAddr, tonUse18, stakingData],
        }),
      });
    } else {
      // Mainnet: approve TON → swapFromTON → deposit WTON.
      calls.push({
        to: tonAddr,
        data: encodeFunctionData({
          abi: tonTokenAbi,
          functionName: "approve",
          args: [wtonAddr, tonUse18],
        }),
      });
      calls.push({
        to: wtonAddr,
        data: encodeFunctionData({
          abi: wtonTokenAbi,
          functionName: "swapFromTON",
          args: [tonUse18],
        }),
      });
      calls.push({
        to: wtonAddr,
        data: encodeFunctionData({
          abi: wtonTokenAbi,
          functionName: "approveAndCall",
          args: [depositManagerAddr, tonUse18 * RAY_PER_TON, operatorData],
        }),
      });
    }
  }

  return calls;
}
