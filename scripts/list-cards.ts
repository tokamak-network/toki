/**
 * List all cards with their tier, created_at, and sort by card_number
 * so we can see the 123 vs 120 discrepancy.
 *
 * Usage: npx tsx scripts/list-cards.ts
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
  const { data } = await sb
    .from("cards")
    .select("card_number, tier, prize_amount, created_at")
    .order("created_at", { ascending: true })
    .order("card_number", { ascending: true });
  if (!data) return;

  console.log(`total: ${data.length}`);
  // Group by created_at date
  const buckets: Record<string, typeof data> = {};
  for (const r of data) {
    const day = String(r.created_at).slice(0, 10);
    (buckets[day] ??= []).push(r);
  }
  for (const [day, rows] of Object.entries(buckets)) {
    console.log(`\n${day}: ${rows.length} cards`);
    const tierCounts: Record<string, number> = {};
    for (const r of rows) tierCounts[r.tier] = (tierCounts[r.tier] ?? 0) + 1;
    console.log(`  tiers:`, tierCounts);
    console.log(`  first 5:`, rows.slice(0, 5).map(r => r.card_number).join(", "));
    console.log(`  last 5: `, rows.slice(-5).map(r => r.card_number).join(", "));
  }

  // Show all card numbers for debugging
  console.log(`\nAll ${data.length} card_numbers:`);
  data.forEach((r, i) => {
    console.log(`  ${String(i + 1).padStart(3)}. ${r.card_number}  [${r.tier}]  ${String(r.created_at).slice(0, 19)}`);
  });
}

main().catch((e) => { console.error(e); process.exit(1); });
