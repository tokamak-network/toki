/**
 * Reset lottery claim state WITHOUT deleting cards.
 * Card rows (card_number, tier, prize_amount) are preserved — those are
 * the printed physical cards and must not change.
 *
 * Steps:
 * 1. Read one row to discover the actual column set.
 * 2. For each "claim state" column that exists in the schema, set it to
 *    its neutral value (status → 'unclaimed', timestamps/strings → null).
 * 3. Print before / after for the target card.
 *
 * Usage: npx tsx scripts/reset-lottery-state.ts [CARD_NUMBER]
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const TARGET = process.argv[2] || "TK01-24XDCP";

/** Columns we KEEP as-is (identity of the physical card). */
const KEEP = new Set([
  "id",
  "card_number",
  "campaign_id",
  "bar_id",
  "tier",
  "prize_amount",
  "created_at",
]);

/** Default reset values per column (only applied if the column exists). */
const RESET_DEFAULTS: Record<string, unknown> = {
  status: "unclaimed",
  claimed_at: null,
  expires_at: null,
  user_id: null,
  wallet_address: null,
  choice: null,
  tx_hash: null,
  discount_verified_at: null,
  discount_verified_by: null,
  mission_type: null,
  mission_proof: null,
  bonus_from: null,
  is_bonus: false,
  updated_at: null,
};

type AnyRow = Record<string, unknown>;

function summariseStatus(rows: AnyRow[]) {
  const counts: Record<string, number> = {};
  for (const r of rows) {
    const s = String(r.status ?? "null");
    counts[s] = (counts[s] || 0) + 1;
  }
  return counts;
}

async function main() {
  // Discover schema by reading a single row
  const { data: sample, error: sampleErr } = await supabase
    .from("cards")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (sampleErr) throw sampleErr;
  if (!sample) {
    console.error("cards table empty — nothing to reset");
    process.exit(1);
  }
  const schema = Object.keys(sample);
  console.log(`detected columns: ${schema.join(", ")}`);

  // Build reset payload only from columns that (a) exist and (b) are not in KEEP.
  const payload: AnyRow = {};
  for (const col of schema) {
    if (KEEP.has(col)) continue;
    if (col in RESET_DEFAULTS) payload[col] = RESET_DEFAULTS[col];
  }
  console.log(`reset payload:`, payload);

  console.log(`\n=== BEFORE reset ===`);
  const { data: beforeAll } = await supabase
    .from("cards")
    .select("card_number, status");
  console.log(`total cards: ${beforeAll!.length}`);
  console.log(`status counts:`, summariseStatus(beforeAll as AnyRow[]));
  const { data: targetBefore } = await supabase
    .from("cards")
    .select("*")
    .eq("card_number", TARGET)
    .maybeSingle();
  console.log(`target ${TARGET}:`, targetBefore ?? "(not found)");

  // Update all rows. Using a filter that always matches (status not null).
  const { error: updErr, count } = await supabase
    .from("cards")
    .update(payload, { count: "exact" })
    .not("card_number", "is", null);
  if (updErr) throw updErr;
  console.log(`\nupdated ${count ?? 0} rows`);

  console.log(`\n=== AFTER reset ===`);
  const { data: afterAll } = await supabase
    .from("cards")
    .select("card_number, status");
  console.log(`total cards: ${afterAll!.length}`);
  console.log(`status counts:`, summariseStatus(afterAll as AnyRow[]));
  const { data: targetAfter } = await supabase
    .from("cards")
    .select("*")
    .eq("card_number", TARGET)
    .maybeSingle();
  console.log(`target ${TARGET}:`, targetAfter ?? "(not found)");
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
