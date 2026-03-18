/**
 * Build the correct staking call(s) depending on network.
 *
 * Sepolia:  TON.approveAndCall(WTON, amount, [DM, layer2])        — 1 call
 * Mainnet:  TON.approve(WTON) → WTON.swapFromTON → WTON.approveAndCall(DM, wtonAmt, layer2)  — 3 calls
 *
 * Mainnet's DepositManager only accepts WTON callbacks (ton() == 0x0),
 * so we must convert TON→WTON first, then deposit via WTON.approveAndCall.
 */
import { encodeFunctionData, encodeAbiParameters, type Address } from "viem";
import { tonTokenAbi, wtonTokenAbi } from "@/lib/abi";
import { isTestnet } from "@/lib/chain";

interface Call {
  to: Address;
  data: `0x${string}`;
}

export function buildStakingCalls(
  tonAddr: Address,
  wtonAddr: Address,
  depositManagerAddr: Address,
  operator: Address,
  tonAmount: bigint,
): Call[] {
  if (isTestnet) {
    // Sepolia: single approveAndCall — TON→WTON+deposit in one tx
    const stakingData = encodeAbiParameters(
      [{ type: "address" }, { type: "address" }],
      [depositManagerAddr, operator],
    );
    return [
      {
        to: tonAddr,
        data: encodeFunctionData({
          abi: tonTokenAbi,
          functionName: "approveAndCall",
          args: [wtonAddr, tonAmount, stakingData],
        }),
      },
    ];
  }

  // Mainnet: 3-step flow
  // WTON amount = TON amount * 10^9 (27 - 18 = 9 extra decimals)
  const wtonAmount = tonAmount * BigInt("1000000000");
  const operatorData = encodeAbiParameters(
    [{ type: "address" }],
    [operator],
  );

  return [
    // Step 1: Approve WTON to pull TON
    {
      to: tonAddr,
      data: encodeFunctionData({
        abi: tonTokenAbi,
        functionName: "approve",
        args: [wtonAddr, tonAmount],
      }),
    },
    // Step 2: Swap TON → WTON
    {
      to: wtonAddr,
      data: encodeFunctionData({
        abi: wtonTokenAbi,
        functionName: "swapFromTON",
        args: [tonAmount],
      }),
    },
    // Step 3: Deposit WTON to operator via DepositManager
    {
      to: wtonAddr,
      data: encodeFunctionData({
        abi: wtonTokenAbi,
        functionName: "approveAndCall",
        args: [depositManagerAddr, wtonAmount, operatorData],
      }),
    },
  ];
}
