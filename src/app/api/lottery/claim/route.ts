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

    // Look up the card
    const { data: card, error } = await supabaseAdmin
      .from("cards")
      .select("card_number, prize_amount, tier, status, campaign_id")
      .eq("card_number", cardNumber)
      .single();

    if (error || !card) {
      return NextResponse.json(
        { error: "Card not found", success: false },
        { status: 404 },
      );
    }

    if (card.status !== "unclaimed") {
      return NextResponse.json({
        success: false,
        alreadyClaimed: true,
        error: "This card has already been used",
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
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
