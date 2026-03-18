import { NextRequest, NextResponse } from "next/server";
import {
  createPublicClient,
  createWalletClient,
  http,
  encodePacked,
  encodeAbiParameters,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CONTRACTS } from "@/constants/contracts";
import { chain, rpcUrl } from "@/lib/chain";

// ─── Config ──────────────────────────────────────────────────────
const TON_PAYMASTER = CONTRACTS.TON_PAYMASTER as Address;

const GUARANTOR_KEY = process.env.GUARANTOR_PRIVATE_KEY;
if (!GUARANTOR_KEY) {
  console.warn("[Paymaster API] GUARANTOR_PRIVATE_KEY not set — Mode 0x01 will fail");
}

const guarantorAccount = GUARANTOR_KEY
  ? privateKeyToAccount(`0x${GUARANTOR_KEY.replace(/^0x/, "")}`)
  : null;

const serverPublicClient = createPublicClient({
  chain,
  transport: http(rpcUrl),
});

// ─── TONPaymaster ABI fragments ─────────────────────────────────
const paymasterAbi = [
  {
    name: "guarantorNonces",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "guarantor", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "ethToToken",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "ethAmount", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "eip712Domain",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "fields", type: "bytes1" },
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "chainId", type: "uint256" },
      { name: "verifyingContract", type: "address" },
      { name: "salt", type: "bytes32" },
      { name: "extensions", type: "uint256[]" },
    ],
  },
] as const;

// ─── EIP-712 types for Guarantee ────────────────────────────────
const GUARANTEE_TYPES = {
  Guarantee: [
    { name: "sender", type: "address" },
    { name: "guaranteedAmount", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "validUntil", type: "uint48" },
    { name: "validAfter", type: "uint48" },
  ],
} as const;

// ─── Validity window ─────────────────────────────────────────────
const VALIDITY_SECONDS = 600; // 10 minutes
const GUARANTEE_MARKUP = BigInt(3); // 3x maxTokenCost for generous guarantee

// ─── Build Mode 0x01 guarantor paymasterData ─────────────────────
async function buildGuarantorPaymasterData(
  sender: Address,
  maxCost: bigint, // Total max ETH cost (from UserOp gas params)
): Promise<{
  paymasterData: Hex;
  guarantor: Address;
}> {
  if (!guarantorAccount) {
    throw new Error("Guarantor key not configured");
  }

  const guarantor = guarantorAccount.address;

  // Query on-chain: nonce and estimated token cost
  const [nonce, maxTokenCost] = await Promise.all([
    serverPublicClient.readContract({
      address: TON_PAYMASTER,
      abi: paymasterAbi,
      functionName: "guarantorNonces",
      args: [guarantor],
    }),
    serverPublicClient.readContract({
      address: TON_PAYMASTER,
      abi: paymasterAbi,
      functionName: "ethToToken",
      args: [maxCost],
    }),
  ]);

  // guaranteedAmount: generous multiple of maxTokenCost so signature doesn't get invalidated
  // by minor gas estimation changes between stub and final
  const guaranteedAmount = maxTokenCost * GUARANTEE_MARKUP;

  const now = Math.floor(Date.now() / 1000);
  const validAfter = now - 60; // 1 minute ago (allow clock skew)
  const validUntil = now + VALIDITY_SECONDS;

  // Query EIP-712 domain from contract
  const domainResult = await serverPublicClient.readContract({
    address: TON_PAYMASTER,
    abi: paymasterAbi,
    functionName: "eip712Domain",
  });

  const domain = {
    name: domainResult[1],
    version: domainResult[2],
    chainId: Number(domainResult[3]),
    verifyingContract: domainResult[4] as Address,
  };

  // Sign EIP-712 typed data
  const walletClient = createWalletClient({
    account: guarantorAccount,
    chain,
    transport: http(rpcUrl),
  });

  const signature = await walletClient.signTypedData({
    domain,
    types: GUARANTEE_TYPES,
    primaryType: "Guarantee",
    message: {
      sender,
      guaranteedAmount,
      nonce,
      validUntil,
      validAfter,
    },
  });

  // Encode paymasterData: [mode(1B)][guarantor(20B)][guaranteedAmount(32B)][validUntil(6B)][validAfter(6B)][signature]
  const paymasterData = encodePacked(
    ["uint8", "address", "bytes32", "uint48", "uint48", "bytes"],
    [
      1, // MODE_GUARANTOR
      guarantor,
      encodeAbiParameters([{ type: "uint256" }], [guaranteedAmount]) as `0x${string}`,
      validUntil,
      validAfter,
      signature,
    ],
  );

  return { paymasterData, guarantor };
}

// ─── Estimate max ETH cost from UserOp params ────────────────────
function estimateMaxCost(userOp: Record<string, string | undefined>): bigint {
  // Parse gas fields from the UserOp
  const callGasLimit = BigInt(userOp.callGasLimit || "0x30d40"); // 200k default
  const verificationGasLimit = BigInt(userOp.verificationGasLimit || "0x24900"); // 150k default
  const preVerificationGas = BigInt(userOp.preVerificationGas || "0xc350"); // 50k default
  const paymasterVerificationGasLimit = BigInt(userOp.paymasterVerificationGasLimit || "0x24900");
  const paymasterPostOpGasLimit = BigInt(userOp.paymasterPostOpGasLimit || "0x186a0");

  // maxFeePerGas from packed gasFees (lower 128 bits) or standalone field
  let maxFeePerGas: bigint;
  if (userOp.maxFeePerGas) {
    maxFeePerGas = BigInt(userOp.maxFeePerGas);
  } else if (userOp.gasFees) {
    // Packed: upper 128 = maxPriorityFeePerGas, lower 128 = maxFeePerGas
    maxFeePerGas = BigInt(userOp.gasFees) & ((BigInt(1) << BigInt(128)) - BigInt(1));
  } else {
    maxFeePerGas = BigInt(30000000000); // 30 gwei fallback
  }

  const totalGas =
    callGasLimit +
    verificationGasLimit +
    preVerificationGas +
    paymasterVerificationGasLimit +
    paymasterPostOpGasLimit;

  return totalGas * maxFeePerGas;
}

// ─── API Handler ─────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { method, id, params } = body;

    // ERC-7677: pm_getPaymasterStubData
    // Called during gas estimation — return stub with approximate guarantor data
    if (method === "pm_getPaymasterStubData") {
      // params[0] = userOp, params[1] = entryPoint, params[2] = chainId
      const userOp = params?.[0];
      const sender = (userOp?.sender ?? userOp?.Sender) as Address | undefined;

      console.log("[Paymaster API] pm_getPaymasterStubData - sender:", sender, "userOp keys:", userOp ? Object.keys(userOp) : "null");

      if (!sender) {
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          error: { code: -32602, message: `Missing sender in UserOp. Keys: ${userOp ? Object.keys(userOp).join(",") : "null"}` },
        }, { status: 400 });
      }
      if (!guarantorAccount) {
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          error: { code: -32603, message: "Guarantor not configured on server" },
        }, { status: 500 });
      }

      try {
        const maxCost = estimateMaxCost(userOp);
        const { paymasterData } = await buildGuarantorPaymasterData(sender, maxCost);

        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: {
            paymaster: TON_PAYMASTER,
            paymasterData,
            paymasterVerificationGasLimit: "0x30d40", // 200k (guarantor mode needs more)
            paymasterPostOpGasLimit: "0x249f0", // 150k
            isFinal: false, // Need second call with final gas values
          },
        });
      } catch (e) {
        console.error("[Paymaster API] stub guarantor signing failed:", e);
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          error: { code: -32603, message: `Guarantor signing failed: ${e instanceof Error ? e.message : String(e)}` },
        }, { status: 500 });
      }
    }

    // ERC-7677: pm_getPaymasterData
    // Called with final gas values — return definitive guarantor signature
    if (method === "pm_getPaymasterData") {
      const userOp = params?.[0];
      const sender = userOp?.sender as Address | undefined;

      if (!sender) {
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          error: { code: -32602, message: "Missing sender in UserOp" },
        }, { status: 400 });
      }
      if (!guarantorAccount) {
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          error: { code: -32603, message: "Guarantor not configured on server" },
        }, { status: 500 });
      }

      try {
        const maxCost = estimateMaxCost(userOp);
        const { paymasterData } = await buildGuarantorPaymasterData(sender, maxCost);

        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: {
            paymaster: TON_PAYMASTER,
            paymasterData,
            paymasterVerificationGasLimit: "0x30d40",
            paymasterPostOpGasLimit: "0x249f0",
          },
        });
      } catch (e) {
        console.error("[Paymaster API] guarantor signing failed:", e);
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          error: { code: -32603, message: `Guarantor signing failed: ${e instanceof Error ? e.message : String(e)}` },
        }, { status: 500 });
      }
    }

    return NextResponse.json(
      { jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } },
      { status: 400 },
    );
  } catch {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } },
      { status: 400 },
    );
  }
}
