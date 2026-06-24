// POST /api/profile — sync the caller's score to the leaderboard and return their
// rank. Auth = verified Privy access token (same as the AI key vault). Degrades
// gracefully: if Privy/Supabase aren't configured, returns { rank: null } (200) so
// the passport card just hides the RANK chip rather than erroring.
import { NextRequest, NextResponse } from "next/server";
import { verifyPrivyUser, isPrivyServerConfigured } from "@/lib/privyServer";
import { syncAndRank, isLeaderboardConfigured } from "@/lib/leaderboard";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isPrivyServerConfigured || !isLeaderboardConfigured) {
    return NextResponse.json({ rank: null });
  }

  const userId = await verifyPrivyUser(req);
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: {
    score?: number;
    level?: number;
    tier?: string;
    address?: string | null;
    displayName?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const result = await syncAndRank(userId, {
    score: Number(body.score) || 0,
    level: Number(body.level) || 1,
    tier: typeof body.tier === "string" ? body.tier : "BRONZE",
    address: body.address ?? null,
    displayName: body.displayName ?? null,
  });

  return NextResponse.json(result ?? { rank: null });
}
