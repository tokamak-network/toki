import { type NextRequest, NextResponse } from "next/server";
import { CONTRACTS } from "@/constants/contracts";

const TON_PAYMASTER = CONTRACTS.TON_PAYMASTER;

const paymasterStubData = {
  paymaster: TON_PAYMASTER,
  paymasterData: "0x",
  paymasterVerificationGasLimit: "0x24900", // 150,000
  paymasterPostOpGasLimit: "0x186a0", // 100,000
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { method, id } = body;

    if (method === "pm_getPaymasterStubData") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          ...paymasterStubData,
          isFinal: true, // Hint: no need for second call
        },
      });
    }

    if (method === "pm_getPaymasterData") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: paymasterStubData,
      });
    }

    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: "Method not found" },
      },
      { status: 400 },
    );
  } catch {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error" },
      },
      { status: 400 },
    );
  }
}
