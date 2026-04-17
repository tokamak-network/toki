import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { LOTTERY_CONFIG } from "@/constants/lottery";

export async function POST(request: NextRequest) {
  try {
    const { cardNumber } = await request.json();

    if (!cardNumber || !LOTTERY_CONFIG.cardNumberPattern.test(cardNumber)) {
      return NextResponse.json(
        { error: "Invalid card number format" },
        { status: 400 },
      );
    }

    // Demo mode for development
    if (process.env.NODE_ENV === "development" && cardNumber === "TK01-DEMO01") {
      return NextResponse.json({
        success: true,
        card: { tier: "basic", prizeAmount: 1 },
      });
    }

    // Look up the card
    const { data: card, error } = await supabaseAdmin
      .from("cards")
      .select(
        "card_number, prize_amount, tier, status, campaign_id, discount_verified_at, expires_at",
      )
      .eq("card_number", cardNumber)
      .single();

    if (error || !card) {
      return NextResponse.json(
        { error: "Card not found", success: false },
        { status: 404 },
      );
    }

    // A card is "truly used" only once staff has verified the discount or
    // the TON has been sent. Re-opening the same URL before staff
    // verification should still resume the flow (show the QR again).
    const staffVerified = !!card.discount_verified_at;
    const tonSent = card.status === "ton_claimed";
    if (staffVerified || tonSent) {
      return NextResponse.json({
        success: false,
        alreadyClaimed: true,
        error: "This card has already been used",
      });
    }

    // Expiry still blocks re-entry (end-of-day cutoff for discount cards)
    if (card.expires_at && new Date(card.expires_at) < new Date()) {
      return NextResponse.json({
        success: false,
        expired: true,
        error: "This card has expired",
      });
    }

    // Verify campaign is active
    const { data: campaign } = await supabaseAdmin
      .from("campaigns")
      .select("status")
      .eq("id", card.campaign_id)
      .single();

    if (!campaign || campaign.status !== "active") {
      return NextResponse.json(
        { error: "This campaign is not active", success: false },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      card: {
        tier: card.tier,
        prizeAmount: card.prize_amount,
        status: card.status,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
