/**
 * Reset a single lottery card back to pristine "unclaimed" state so the
 * next person who scratches it can use it. Card identity (number, tier,
 * prize_amount) is preserved.
 *
 * Usage: npx tsx scripts/reset-single-card.ts TK01-XXXXXX
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

async function main() {
  const cardNumber = process.argv[2];
  if (!cardNumber) {
    console.error("usage: npx tsx scripts/reset-single-card.ts <CARD_NUMBER>");
    process.exit(1);
  }

  console.log(`=== BEFORE ===`);
  const { data: before } = await sb
    .from("cards")
    .select("card_number, tier, status, claimed_by, discount_verified_at, expires_at, claimed_at, wallet_address, tx_hash")
    .eq("card_number", cardNumber)
    .maybeSingle();
  if (!before) {
    console.error(`card ${cardNumber} not found`);
    process.exit(1);
  }
  console.log(before);

  const { error } = await sb
    .from("cards")
    .update({
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
      updated_at: new Date().toISOString(),
    })
    .eq("card_number", cardNumber);
  if (error) throw error;

  console.log(`\n=== AFTER ===`);
  const { data: after } = await sb
    .from("cards")
    .select("card_number, tier, status, claimed_by, discount_verified_at, expires_at, claimed_at, wallet_address, tx_hash")
    .eq("card_number", cardNumber)
    .maybeSingle();
  console.log(after);
  console.log(`\n✓ ${cardNumber} reset to unclaimed (identity preserved)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
