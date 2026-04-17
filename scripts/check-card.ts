/**
 * Read a single card row, print every column with its current value.
 * Usage: npx tsx scripts/check-card.ts [CARD_NUMBER]
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
  const cardNumber = process.argv[2] || "TK01-24XDCP";
  const { data, error } = await sb
    .from("cards")
    .select("*")
    .eq("card_number", cardNumber)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    console.log(`no card with number ${cardNumber}`);
    return;
  }
  console.log(`=== ${cardNumber} ===`);
  for (const [k, v] of Object.entries(data)) {
    console.log(`  ${k.padEnd(24)} ${v === null ? "(null)" : JSON.stringify(v)}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
