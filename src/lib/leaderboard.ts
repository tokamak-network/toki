// Server-only leaderboard for the Toki Passport "RANK" — a single score per Privy
// user, upserted whenever they open their profile, ranked by score desc. Reuses
// the same supabaseAdmin + Privy-verify infra as the AI key vault. Everything is
// best-effort: if Supabase isn't configured the card simply renders without a rank.
import { supabaseAdmin } from "@/lib/supabase-admin";

const TABLE = "profile_scores";

export const isLeaderboardConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

export interface RankResult {
  rank: number;
  total: number;
  /** Top X% (1–100), rounded. null if total is 0. */
  percentile: number | null;
}

export interface SyncInput {
  address?: string | null;
  displayName?: string | null;
  score: number;
  level: number;
  tier: string;
}

/** Upsert the user's score, then compute their global rank. Returns null on any
 *  failure (unconfigured env, table missing, network) so callers degrade cleanly. */
export async function syncAndRank(
  userId: string,
  input: SyncInput,
): Promise<RankResult | null> {
  if (!isLeaderboardConfigured) return null;
  try {
    const score = Math.max(0, Math.round(input.score || 0));
    await supabaseAdmin.from(TABLE).upsert(
      {
        privy_user_id: userId,
        address: input.address ? input.address.toLowerCase() : null,
        display_name: input.displayName ?? null,
        score,
        level: input.level,
        tier: input.tier,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "privy_user_id" },
    );

    const [{ count: higher }, { count: total }] = await Promise.all([
      supabaseAdmin.from(TABLE).select("*", { count: "exact", head: true }).gt("score", score),
      supabaseAdmin.from(TABLE).select("*", { count: "exact", head: true }),
    ]);

    const rank = (higher ?? 0) + 1;
    const totalN = total ?? 0;
    const percentile = totalN > 0 ? Math.max(1, Math.round((rank / totalN) * 100)) : null;
    return { rank, total: totalN, percentile };
  } catch {
    return null;
  }
}
