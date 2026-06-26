import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const sb = createClient(url, key);

async function main() {
  // Check existing cards to see column structure
  const { data: sample } = await sb
    .from("cards")
    .select("*")
    .limit(1);
  console.log("Sample card columns:", sample?.length ? Object.keys(sample[0]) : "no rows");
  console.log("Sample card:", JSON.stringify(sample?.[0], null, 2));

  // Check campaigns
  const { data: campaigns } = await sb
    .from("campaigns")
    .select("*")
    .limit(5);
  console.log("\nCampaigns:", JSON.stringify(campaigns, null, 2));

  // Try inserting a test card to see the error detail
  const { error } = await sb
    .from("cards")
    .insert({ card_number: "TK01-TEST00", campaign_id: campaigns?.[0]?.id, tier: "basic", prize_amount: 1, status: "unclaimed" })
    .select();
  console.log("\nTest insert error:", error?.message ?? "SUCCESS");

  // Cleanup test
  await sb.from("cards").delete().eq("card_number", "TK01-TEST00");
}

main();
