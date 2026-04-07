import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { LOTTERY_CONFIG } from "@/constants/lottery";

export async function POST(request: NextRequest) {
  try {
    const { cardNumber, userId, walletAddress, choice } = await request.json();

    if (!cardNumber || !LOTTERY_CONFIG.cardNumberPattern.test(cardNumber)) {
      return NextResponse.json(
        { error: "Invalid card number" },
        { status: 400 },
      );
    }

    if (!userId || !choice || !["discount", "ton"].includes(choice)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Fetch card and verify status
    const { data: card, error } = await supabaseAdmin
      .from("cards")
      .select("*")
      .eq("card_number", cardNumber)
      .single();

    if (error || !card) {
      return NextResponse.json(
        { error: "Card not found" },
        { status: 404 },
      );
    }

    if (card.status !== "unclaimed") {
      return NextResponse.json(
        { error: "Card already used", alreadyClaimed: true },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    if (choice === "discount") {
      // Offchain only — set expiry to end of today
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const { error: updateError } = await supabaseAdmin
        .from("cards")
        .update({
          status: "discount_used",
          claimed_by: userId,
          claimed_at: now,
          expires_at: endOfDay.toISOString(),
        })
        .eq("card_number", cardNumber)
        .eq("status", "unclaimed"); // Optimistic lock

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to process discount" },
          { status: 500 },
        );
      }

      return NextResponse.json({ success: true, choice: "discount" });
    }

    // choice === "ton" — transfer TON to wallet
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { error: "Invalid wallet address" },
        { status: 400 },
      );
    }

    // TODO: Implement actual TON transfer via lottery-wallet.ts
    // For now, record the claim and mark as pending transfer
    const txHash = null; // Will be set by actual transfer

    const { error: updateError } = await supabaseAdmin
      .from("cards")
      .update({
        status: "ton_claimed",
        claimed_by: userId,
        claimed_at: now,
        wallet_address: walletAddress,
        tx_hash: txHash,
      })
      .eq("card_number", cardNumber)
      .eq("status", "unclaimed");

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to process TON claim" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      choice: "ton",
      txHash,
      showMission: card.prize_amount === 1,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
