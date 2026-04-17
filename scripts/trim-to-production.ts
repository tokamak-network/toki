/**
 * Trim the cards table down to exactly the 100 production cards listed
 * in lottery-codes-120.csv (status = "production"). Everything else
 * — the 20 spare cards, the 3 DEMO cards, and any orphans — gets deleted.
 *
 * Usage: npx tsx scripts/trim-to-production.ts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { homedir } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envContent = readFileSync(resolve(__dirname, "../.env.local"), "utf-8");
for (const line of envContent.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const CSV_PATH = resolve(homedir(), "Desktop/assets/toki/lottery-codes-120.csv");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
  // Read CSV, keep only production rows (handle CRLF + stray whitespace)
  const csv = readFileSync(CSV_PATH, "utf-8");
  const lines = csv.trim().split(/\r?\n/).slice(1);
  const productionNumbers = lines
    .map((l) => l.split(",").map((c) => c.trim()))
    .filter(([, , status]) => status === "production")
    .map(([, cardNumber]) => cardNumber);

  if (productionNumbers.length !== 100) {
    console.error(`Expected 100 production cards in CSV, got ${productionNumbers.length}`);
    process.exit(1);
  }
  const keep = new Set(productionNumbers);
  console.log(`CSV: ${productionNumbers.length} production card_numbers to KEEP`);

  // Snapshot current DB
  const { data: before } = await sb.from("cards").select("card_number, tier, status");
  if (!before) throw new Error("could not read cards");
  console.log(`DB before: ${before.length} rows`);

  // Anything not in the production keep-set is a delete candidate
  const toDelete = before
    .map((r) => r.card_number as string)
    .filter((cn) => !keep.has(cn));
  console.log(`will delete ${toDelete.length} rows:`);
  for (const cn of toDelete) console.log(`  - ${cn}`);

  if (toDelete.length > 0) {
    const { error: delErr, count } = await sb
      .from("cards")
      .delete({ count: "exact" })
      .in("card_number", toDelete);
    if (delErr) throw delErr;
    console.log(`\n✓ deleted ${count ?? toDelete.length} rows`);
  } else {
    console.log("\n(nothing to delete)");
  }

  // Verify
  const { data: after } = await sb.from("cards").select("card_number, tier");
  console.log(`\nDB after: ${after!.length} rows`);

  const missing = productionNumbers.filter(
    (cn) => !after!.some((r) => r.card_number === cn),
  );
  if (missing.length > 0) {
    console.warn(`\n⚠ ${missing.length} production cards are MISSING from DB:`);
    for (const cn of missing) console.warn(`  - ${cn}`);
  } else {
    console.log("\n✓ all 100 production cards present in DB");
  }

  // Tier summary
  const tierCounts: Record<string, number> = {};
  for (const r of after!) tierCounts[r.tier] = (tierCounts[r.tier] ?? 0) + 1;
  console.log(`\nTiers: `, tierCounts);
}

main().catch((e) => { console.error(e); process.exit(1); });
