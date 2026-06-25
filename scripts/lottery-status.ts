/**
 * Report current lottery event progress:
 * - campaigns
 * - total cards per tier
 * - status breakdown (unclaimed / discount_used / ton_claimed / expired)
 * - prize amount distributed
 *
 * Usage: npx tsx scripts/lottery-status.ts
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
  const { data: campaigns } = await sb.from("campaigns").select("*");
  console.log("=== CAMPAIGNS ===");
  console.log(JSON.stringify(campaigns, null, 2));

  const { data: cards, error } = await sb
    .from("cards")
    .select("*");
  if (error) throw error;
  if (!cards) return;

  console.log(`\n=== CARDS TOTAL: ${cards.length} ===`);

  const tier: Record<string, number> = {};
  const status: Record<string, number> = {};
  const tierStatus: Record<string, Record<string, number>> = {};
  let prizeSum = 0;
  let prizeClaimed = 0;
  let prizeDiscounted = 0;

  for (const c of cards) {
    tier[c.tier] = (tier[c.tier] ?? 0) + 1;
    status[c.status] = (status[c.status] ?? 0) + 1;
    (tierStatus[c.tier] ??= {})[c.status] =
      (tierStatus[c.tier]?.[c.status] ?? 0) + 1;
    prizeSum += Number(c.prize_amount ?? 0);
    if (c.status === "ton_claimed") prizeClaimed += Number(c.prize_amount ?? 0);
    if (c.status === "discount_used")
      prizeDiscounted += Number(c.prize_amount ?? 0);
  }

  console.log("\nBy tier:", tier);
  console.log("By status:", status);
  console.log("\nTier × Status matrix:");
  for (const [t, row] of Object.entries(tierStatus)) {
    console.log(`  ${t.padEnd(10)}`, row);
  }

  console.log("\n=== PRIZES (TON) ===");
  console.log(`  total issued:     ${prizeSum}`);
  console.log(`  ton_claimed:      ${prizeClaimed}`);
  console.log(`  discount_used:    ${prizeDiscounted}`);

  // Redemptions table (if exists)
  const { data: claims, error: claimsErr } = await sb
    .from("claims")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);
  if (!claimsErr) {
    console.log(`\n=== RECENT CLAIMS (top 10 of ${claims?.length ?? 0}) ===`);
    for (const c of claims ?? []) {
      console.log(
        `  ${String(c.created_at).slice(0, 19)}  ${c.card_number ?? c.card_id}  ${c.method ?? c.type ?? ""}  ${c.prize_amount ?? ""}`,
      );
    }
  } else {
    console.log(`\n(no 'claims' table: ${claimsErr.message})`);
  }

  // Latest touched cards
  const { data: recent } = await sb
    .from("cards")
    .select("card_number, tier, status, prize_amount, updated_at")
    .order("updated_at", { ascending: false })
    .limit(10);
  console.log("\n=== 10 MOST-RECENTLY UPDATED CARDS ===");
  for (const c of recent ?? []) {
    console.log(
      `  ${String(c.updated_at).slice(0, 19)}  ${c.card_number}  ${c.tier.padEnd(8)}  ${c.status.padEnd(14)}  ${c.prize_amount} TON`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
