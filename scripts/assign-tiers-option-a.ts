/**
 * Randomly distribute Option A tier plan across the 100 production cards.
 *
 *   jackpot × 1   (100 TON)
 *   super   × 2   ( 50 TON)
 *   lucky   × 4   ( 20 TON)
 *   basic   × 43  ( 10 TON)
 *   bust    × 50  (  0 TON)
 *
 * Uses Fisher-Yates shuffle on the card list. Every card row is updated
 * with the new tier + prize_amount, and every claim-state column is
 * reset so previously tested cards start fresh.
 *
 * Prerequisite: CHECK constraint on cards.tier must allow the tier names
 * used below (bust / basic / lucky / super / jackpot).
 *
 * Usage: npx tsx scripts/assign-tiers-option-a.ts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(resolve(__dirname, "../.env.local"), "utf-8");
for (const line of envContent.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const DISTRIBUTION: { tier: string; amount: number; count: number }[] = [
  { tier: "jackpot", amount: 100, count: 1 },
  { tier: "super", amount: 50, count: 2 },
  { tier: "lucky", amount: 20, count: 4 },
  { tier: "basic", amount: 10, count: 43 },
  { tier: "bust", amount: 0, count: 50 },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function main() {
  // Sanity: total in distribution equals 100
  const total = DISTRIBUTION.reduce((s, d) => s + d.count, 0);
  if (total !== 100) {
    console.error(`Distribution sums to ${total}, expected 100`);
    process.exit(1);
  }

  const { data: cards, error } = await sb
    .from("cards")
    .select("card_number")
    .order("card_number");
  if (error || !cards) throw error ?? new Error("no cards");
  if (cards.length !== 100) {
    console.error(`DB has ${cards.length} cards, expected 100. Run trim-to-production.ts first.`);
    process.exit(1);
  }

  // Shuffle and assign
  const shuffled = shuffle(cards.map((c) => c.card_number as string));
  const assignments: { card_number: string; tier: string; prize_amount: number }[] = [];
  let cursor = 0;
  for (const group of DISTRIBUTION) {
    const slice = shuffled.slice(cursor, cursor + group.count);
    for (const cn of slice) {
      assignments.push({
        card_number: cn,
        tier: group.tier,
        prize_amount: group.amount,
      });
    }
    cursor += group.count;
  }

  console.log(`Applying tier assignments to 100 cards…`);
  // Update in a single loop — Supabase doesn't support bulk upsert with per-row
  // values easily, so we fire 100 updates in parallel (small table, all good).
  const now = new Date().toISOString();
  const results = await Promise.all(
    assignments.map((a) =>
      sb
        .from("cards")
        .update({
          tier: a.tier,
          prize_amount: a.prize_amount,
          status: "unclaimed",
          claimed_by: null,
          claimed_at: null,
          expires_at: null,
          wallet_address: null,
          tx_hash: null,
          discount_verified_at: null,
          discount_verified_by: null,
          mission_type: null,
          mission_proof: null,
          updated_at: now,
        })
        .eq("card_number", a.card_number),
    ),
  );

  const failed = results.filter((r) => r.error);
  if (failed.length > 0) {
    console.error(`${failed.length} updates failed:`);
    failed.slice(0, 5).forEach((r) => console.error(`  ${r.error?.message}`));
    if (failed[0]?.error?.message.includes("check constraint")) {
      console.error(
        "\nCHECK constraint rejected a tier. Run this in Supabase SQL Editor first:",
      );
      console.error(`  ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_tier_check;`);
      console.error(
        `  ALTER TABLE cards ADD CONSTRAINT cards_tier_check CHECK (tier IN ('bust','basic','super','lucky','jackpot'));`,
      );
    }
    process.exit(1);
  }

  // Verify
  const { data: after } = await sb
    .from("cards")
    .select("card_number, tier, prize_amount, status");
  const counts: Record<string, number> = {};
  for (const r of after!) counts[r.tier] = (counts[r.tier] ?? 0) + 1;
  console.log(`\n✓ Tier assignment complete`);
  console.log(`DB total: ${after!.length}`);
  console.log(`Distribution:`, counts);

  // Show a sample per tier for spot-check
  console.log(`\nSample per tier:`);
  for (const group of DISTRIBUTION) {
    const sample = after!
      .filter((r) => r.tier === group.tier)
      .slice(0, Math.min(3, group.count))
      .map((r) => r.card_number);
    console.log(`  ${group.tier.padEnd(8)} (${group.count}) →  ${sample.join(", ")}${group.count > sample.length ? `, … (+${group.count - sample.length})` : ""}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
