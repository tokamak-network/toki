import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const { cardNumber, barStaffPin } = await request.json();

    if (!cardNumber || !barStaffPin) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Verify staff PIN
    const staffPin = process.env.LOTTERY_STAFF_PIN;
    if (!staffPin || barStaffPin !== staffPin) {
      return NextResponse.json(
        { valid: false, error: "Invalid staff PIN" },
        { status: 403 },
      );
    }

    const { data: card, error } = await supabaseAdmin
      .from("cards")
      .select("card_number, prize_amount, status, expires_at, discount_verified_at")
      .eq("card_number", cardNumber)
      .single();

    if (error || !card) {
      return NextResponse.json(
        { error: "Card not found", valid: false },
        { status: 404 },
      );
    }

    if (card.discount_verified_at) {
      return NextResponse.json({
        valid: false,
        alreadyUsed: true,
        error: "Discount already verified",
      });
    }

    if (card.status !== "discount_used") {
      return NextResponse.json({
        valid: false,
        error: "Card is not in discount mode",
      });
    }

    if (card.expires_at && new Date(card.expires_at) < new Date()) {
      return NextResponse.json({
        valid: false,
        error: "Discount has expired",
      });
    }

    // Mark as verified
    await supabaseAdmin
      .from("cards")
      .update({
        discount_verified_at: new Date().toISOString(),
        discount_verified_by: barStaffPin,
      })
      .eq("card_number", cardNumber);

    return NextResponse.json({
      valid: true,
      prizeAmount: card.prize_amount,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
