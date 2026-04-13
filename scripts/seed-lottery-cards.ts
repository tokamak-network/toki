/**
 * Seed script: Insert 120 lottery card numbers into Supabase
 *
 * Usage: npx tsx scripts/seed-lottery-cards.ts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Load .env.local manually
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const CAMPAIGN_ID = "d7207dd8-dac3-4450-a42a-cac81d7f8a43";
const BAR_ID = "031a34ab-037b-41d7-b5ca-3376f51aec27";

async function main() {
  // 1. Ensure Season 1 campaign is active
  const { error: campaignError } = await supabase
    .from("campaigns")
    .upsert(
      { id: CAMPAIGN_ID, status: "active", name: "Season 1" },
      { onConflict: "id" },
    );

  if (campaignError) {
    console.error("Failed to upsert campaign:", campaignError.message);
    process.exit(1);
  }
  console.log(`✓ Campaign 'Season 1' (${CAMPAIGN_ID})`);

  // 2. Read CSV
  const csv = readFileSync("lottery-codes-120.csv", "utf-8");
  const lines = csv.trim().split("\n").slice(1);
  const rows = lines.map((line) => {
    const [no, card_number, status] = line.split(",");
    return { no, card_number, status };
  });
  console.log(`✓ Read ${rows.length} card numbers from CSV`);

  // 3. Build card rows with random tier assignment
  // DB allows: basic, lucky, jackpot
  // Distribution: basic 80%, lucky 15%, jackpot 5%
  const TIERS = [
    { tier: "basic", amount: 1, cutoff: 80 },
    { tier: "lucky", amount: 20, cutoff: 95 },
    { tier: "jackpot", amount: 100, cutoff: 100 },
  ];

  function pickTier() {
    const roll = Math.random() * 100;
    return TIERS.find((t) => roll < t.cutoff)!;
  }

  const tierCounts: Record<string, number> = {};
  const cards = rows.map((row) => {
    const t = pickTier();
    tierCounts[t.tier] = (tierCounts[t.tier] || 0) + 1;
    return {
      card_number: row.card_number,
      campaign_id: CAMPAIGN_ID,
      bar_id: BAR_ID,
      tier: t.tier,
      prize_amount: t.amount,
      status: "unclaimed",
    };
  });

  // 4. Insert cards in batch
  const { data, error: insertError } = await supabase
    .from("cards")
    .insert(cards)
    .select("card_number");

  if (insertError) {
    console.error("Failed to insert cards:", insertError.message);
    process.exit(1);
  }

  console.log(`✓ Inserted ${data.length} cards into 'cards' table`);
  console.log(`  Campaign: ${CAMPAIGN_ID}`);
  console.log(`  Bar: ${BAR_ID}`);
  console.log(`  Production: ${rows.filter((r) => r.status === "production").length}`);
  console.log(`  Spare: ${rows.filter((r) => r.status === "spare").length}`);
  console.log(`  Tier distribution:`, tierCounts);
}

main();
