import { NextRequest, NextResponse } from "next/server";

// ─── Rate limiting (in-memory, per-process) ──────────────────────────
const dropLog = new Map<string, number>(); // address → timestamp

const EVENT_MIN_TON = Number(process.env.EVENT_MIN_TON ?? "0.1");
const EVENT_MAX_TON = Number(process.env.EVENT_MAX_TON ?? "1.0");
const EVENT_TREASURY_PRIVATE_KEY = process.env.EVENT_TREASURY_PRIVATE_KEY ?? "";

function randomTonAmount(): string {
  const amount = EVENT_MIN_TON + Math.random() * (EVENT_MAX_TON - EVENT_MIN_TON);
  return amount.toFixed(4);
}

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address || typeof address !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: "Invalid wallet address" },
        { status: 400 },
      );
    }

    // Rate limit: 1 drop per wallet per event
    if (dropLog.has(address.toLowerCase())) {
      return NextResponse.json(
        { error: "Already received TON drop", alreadyClaimed: true },
        { status: 429 },
      );
    }

    if (!EVENT_TREASURY_PRIVATE_KEY) {
      // Demo mode: no treasury configured, simulate the drop
      const amount = randomTonAmount();
      dropLog.set(address.toLowerCase(), Date.now());
      return NextResponse.json({
        success: true,
        amount,
        txHash: null,
        demo: true,
      });
    }

    // Production mode: send actual TON from treasury
    // This is a placeholder — implement actual on-chain transfer when treasury is configured
    const amount = randomTonAmount();
    dropLog.set(address.toLowerCase(), Date.now());

    return NextResponse.json({
      success: true,
      amount,
      txHash: null,
      demo: !EVENT_TREASURY_PRIVATE_KEY,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
