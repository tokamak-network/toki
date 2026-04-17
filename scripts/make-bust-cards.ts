/**
 * Prepare two bust (꽝) test cards:
 * 1. Convert TK01-24XDCP from "lucky" to "bust" (keeps the number)
 * 2. Insert a brand-new bust card so the retry flow has a second card to use
 *
 * Usage: npx tsx scripts/make-bust-cards.ts
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

const TARGET_EXISTING = "TK01-24XDCP";
const NEW_BUST = "TK01-BUST99";

async function main() {
  // Discover campaign/bar ids from an existing card
  const { data: sample } = await sb
    .from("cards")
    .select("campaign_id, bar_id")
    .limit(1)
    .single();
  if (!sample) {
    console.error("no cards in DB to derive campaign/bar ids");
    process.exit(1);
  }

  // 1. Convert TK01-24XDCP → bust
  const { error: updErr, data: upd } = await sb
    .from("cards")
    .update({
      tier: "bust",
      prize_amount: 0,
      status: "unclaimed",
      claimed_by: null,
      claimed_at: null,
      expires_at: null,
      wallet_address: null,
      tx_hash: null,
      discount_verified_at: null,
      discount_verified_by: null,
      updated_at: new Date().toISOString(),
    })
    .eq("card_number", TARGET_EXISTING)
    .select();
  if (updErr) {
    console.error(`failed to convert ${TARGET_EXISTING} to bust:`, updErr.message);
    if (updErr.message.includes("check constraint")) {
      console.error(
        "\nDB has a CHECK constraint on tier. Run this SQL in Supabase SQL Editor first:",
      );
      console.error(
        `  ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_tier_check;`,
      );
      console.error(
        `  ALTER TABLE cards ADD CONSTRAINT cards_tier_check CHECK (tier IN ('bust','basic','normal','lucky','jackpot'));`,
      );
    }
    process.exit(1);
  }
  console.log(`✓ ${TARGET_EXISTING} converted to bust`);

  // 2. Delete any prior NEW_BUST row (if re-running), then insert fresh
  await sb.from("cards").delete().eq("card_number", NEW_BUST);

  const { error: insErr } = await sb.from("cards").insert({
    card_number: NEW_BUST,
    campaign_id: sample.campaign_id,
    bar_id: sample.bar_id,
    tier: "bust",
    prize_amount: 0,
    status: "unclaimed",
  });
  if (insErr) {
    console.error(`failed to insert ${NEW_BUST}:`, insErr.message);
    process.exit(1);
  }
  console.log(`✓ ${NEW_BUST} inserted as bust`);

  // 3. Verify both
  const { data: rows } = await sb
    .from("cards")
    .select("card_number, tier, prize_amount, status")
    .in("card_number", [TARGET_EXISTING, NEW_BUST]);
  console.log(`\n=== Test cards ready ===`);
  for (const r of rows!) {
    console.log(
      `  ${r.card_number}  tier=${r.tier}  prize=${r.prize_amount}  status=${r.status}`,
    );
  }
  console.log(`\nTest URLs (prod):`);
  console.log(`  https://toki.tokamak.network/lottery/claim?code=${TARGET_EXISTING}`);
  console.log(`  https://toki.tokamak.network/lottery/claim?code=${NEW_BUST}`);
  console.log(`\nTest URLs (local):`);
  console.log(`  http://localhost:3000/lottery/claim?code=${TARGET_EXISTING}`);
  console.log(`  http://localhost:3000/lottery/claim?code=${NEW_BUST}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
