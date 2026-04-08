import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { PRIZE_TIERS, type PrizeTier } from "@/constants/lottery";

/**
 * GET /api/lottery/redeem?card=TK01-XXXXXX
 * Fetch card info for the bar-staff redeem page.
 */
export async function GET(request: NextRequest) {
  const cardNumber = request.nextUrl.searchParams.get("card");

  if (!cardNumber) {
    return NextResponse.json(
      { error: "Missing card number" },
      { status: 400 },
    );
  }

  const { data: card, error } = await supabaseAdmin
    .from("cards")
    .select(
      "card_number, prize_amount, tier, status, expires_at, discount_verified_at, claimed_at",
    )
    .eq("card_number", cardNumber)
    .single();

  if (error || !card) {
    return NextResponse.json(
      { error: "Card not found" },
      { status: 404 },
    );
  }

  const tier = card.tier as PrizeTier;
  const prize = PRIZE_TIERS[tier];

  return NextResponse.json({
    cardNumber: card.card_number,
    prizeAmount: card.prize_amount,
    tier,
    label: prize?.label ?? `${card.prize_amount} TON`,
    emoji: prize?.emoji ?? "🎉",
    status: card.status,
    expiresAt: card.expires_at,
    alreadyVerified: !!card.discount_verified_at,
    claimedAt: card.claimed_at,
  });
}

/**
 * POST /api/lottery/redeem
 * Mark discount as used (bar staff presses "사용하기").
 */
export async function POST(request: NextRequest) {
  try {
    const { cardNumber } = await request.json();

    if (!cardNumber) {
      return NextResponse.json(
        { error: "Missing card number" },
        { status: 400 },
      );
    }

    const { data: card, error } = await supabaseAdmin
      .from("cards")
      .select(
        "card_number, prize_amount, status, expires_at, discount_verified_at",
      )
      .eq("card_number", cardNumber)
      .single();

    if (error || !card) {
      return NextResponse.json(
        { error: "Card not found" },
        { status: 404 },
      );
    }

    if (card.discount_verified_at) {
      return NextResponse.json({
        success: false,
        error: "already_used",
        message: "이미 사용된 할인 카드입니다.",
      });
    }

    if (card.status !== "discount_used") {
      return NextResponse.json({
        success: false,
        error: "invalid_status",
        message: "할인 모드가 아닌 카드입니다.",
      });
    }

    if (card.expires_at && new Date(card.expires_at) < new Date()) {
      return NextResponse.json({
        success: false,
        error: "expired",
        message: "유효기간이 만료된 카드입니다.",
      });
    }

    // Mark as used
    const { error: updateError } = await supabaseAdmin
      .from("cards")
      .update({
        discount_verified_at: new Date().toISOString(),
        discount_verified_by: "qr_redeem",
      })
      .eq("card_number", cardNumber)
      .eq("status", "discount_used")
      .is("discount_verified_at", null);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update card" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      prizeAmount: card.prize_amount,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
