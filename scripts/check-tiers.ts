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

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const campaignId = "d7207dd8-dac3-4450-a42a-cac81d7f8a43";

async function testTier(tier: string) {
  const cn = `TK01-ZZZ${tier.slice(0, 3).toUpperCase()}`;
  const { error } = await sb.from("cards").insert({ card_number: cn, campaign_id: campaignId, tier, prize_amount: 1, status: "unclaimed" });
  const ok = !error;
  console.log(`  ${tier}: ${ok ? "OK" : error.message}`);
  if (ok) await sb.from("cards").delete().eq("card_number", cn);
}

async function main() {
  for (const t of ["basic", "normal", "lucky", "jackpot", "silver", "gold"]) {
    await testTier(t);
  }
}
main();
