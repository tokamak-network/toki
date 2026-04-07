import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { PRIZE_TIERS, type PrizeTier } from "@/constants/lottery";
import crypto from "crypto";

function generateCardNumber(campaignPrefix: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No 0/O/1/I confusion
  let code = "";
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `${campaignPrefix}-${code}`;
}

function randomTier(): PrizeTier {
  const roll = Math.random() * 100;
  if (roll < 60) return "basic";
  if (roll < 85) return "normal";
  if (roll < 97) return "lucky";
  return "jackpot";
}

export async function POST(request: NextRequest) {
  try {
    const { cardNumber, userId, missionType, proof } = await request.json();

    if (!cardNumber || !userId || !missionType || !proof) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (!["instagram", "twitter"].includes(missionType)) {
      return NextResponse.json(
        { error: "Invalid mission type" },
        { status: 400 },
      );
    }

    // Verify original card
    const { data: originalCard, error } = await supabaseAdmin
      .from("cards")
      .select("*")
      .eq("card_number", cardNumber)
      .single();

    if (error || !originalCard) {
      return NextResponse.json(
        { error: "Original card not found" },
        { status: 404 },
      );
    }

    if (originalCard.tier !== "basic" || originalCard.status !== "ton_claimed") {
      return NextResponse.json(
        { error: "Only 1 TON winners who claimed TON can do missions" },
        { status: 400 },
      );
    }

    // Check if bonus already issued
    const { data: existingBonus } = await supabaseAdmin
      .from("cards")
      .select("card_number")
      .eq("bonus_from", cardNumber)
      .limit(1);

    if (existingBonus && existingBonus.length > 0) {
      return NextResponse.json(
        { error: "Bonus card already issued for this card" },
        { status: 400 },
      );
    }

    // Generate bonus card
    const tier = randomTier();
    const prizeAmount = PRIZE_TIERS[tier].amount;
    const campaignPrefix = cardNumber.split("-")[0];
    const bonusCardNumber = generateCardNumber(campaignPrefix);

    const { data: bonusCard, error: insertError } = await supabaseAdmin
      .from("cards")
      .insert({
        card_number: bonusCardNumber,
        campaign_id: originalCard.campaign_id,
        bar_id: originalCard.bar_id,
        prize_amount: prizeAmount,
        tier,
        is_bonus: true,
        status: "unclaimed",
        bonus_from: cardNumber,
        mission_type: missionType,
        mission_proof: proof,
      })
      .select()
      .single();

    if (insertError || !bonusCard) {
      return NextResponse.json(
        { error: "Failed to create bonus card" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      bonusCard: {
        cardNumber: bonusCardNumber,
        tier,
        prizeAmount,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
