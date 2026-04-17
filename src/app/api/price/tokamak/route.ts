import { NextResponse } from "next/server";

// Cache the Upbit response for 60s on the edge. Same ticker source as
// tokamak-landing-page's /api/price.
export const revalidate = 60;

interface UpbitTicker {
  trade_price: number;
  opening_price: number;
  prev_closing_price: number;
}

export async function GET() {
  try {
    const res = await fetch(
      "https://api.upbit.com/v1/ticker?markets=KRW-tokamak",
      { next: { revalidate: 60 } },
    );
    if (!res.ok) {
      throw new Error(`Upbit ${res.status}`);
    }
    const data = (await res.json()) as UpbitTicker[];
    const ticker = data[0];
    if (!ticker) {
      throw new Error("Empty Upbit response");
    }
    return NextResponse.json({
      krw: ticker.trade_price,
      opening: ticker.opening_price,
      closing: ticker.prev_closing_price,
      fetchedAt: Date.now(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
