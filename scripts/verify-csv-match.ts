/**
 * Sanity check: verify the DB card_numbers exactly match CSV production rows.
 * Usage: npx tsx scripts/verify-csv-match.ts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { homedir } from "os";

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
  const csv = readFileSync(
    resolve(homedir(), "Desktop/assets/toki/lottery-codes-120.csv"),
    "utf-8",
  );
  const lines = csv.trim().split(/\r?\n/).slice(1);
  const rows = lines.map((l) => l.split(",").map((c) => c.trim()));
  const production = new Set(
    rows.filter(([, , s]) => s === "production").map(([, cn]) => cn),
  );
  const spare = new Set(
    rows.filter(([, , s]) => s === "spare").map(([, cn]) => cn),
  );
  console.log(`CSV: production=${production.size}, spare=${spare.size}`);

  const { data } = await sb.from("cards").select("card_number");
  const dbSet = new Set(data!.map((r) => r.card_number as string));
  console.log(`DB:  ${dbSet.size} rows`);

  const inDbNotProd = [...dbSet].filter((cn) => !production.has(cn));
  const inProdNotDb = [...production].filter((cn) => !dbSet.has(cn));
  const sparesInDb = [...dbSet].filter((cn) => spare.has(cn));

  console.log(`\nDB rows that are NOT in CSV production : ${inDbNotProd.length}`);
  inDbNotProd.forEach((cn) => console.log(`  - ${cn}`));
  console.log(`\nCSV production rows MISSING from DB     : ${inProdNotDb.length}`);
  inProdNotDb.forEach((cn) => console.log(`  - ${cn}`));
  console.log(`\nCSV spare rows still in DB (should be 0): ${sparesInDb.length}`);
  sparesInDb.forEach((cn) => console.log(`  - ${cn}`));

  const pass =
    inDbNotProd.length === 0 && inProdNotDb.length === 0 && sparesInDb.length === 0;
  console.log(`\n${pass ? "✓ MATCH — DB is exactly CSV production set" : "✗ MISMATCH"}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
