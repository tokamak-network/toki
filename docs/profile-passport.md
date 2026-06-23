# Toki Passport — profile summary card

Status: **built** · Created: 2026-06-22

A Kaito-style, shareable one-card summary of a user's Toki ecosystem profile. Lives
at `/profile`; reachable from the hub left rail ("My Toki").

## What it shows

The **public, shareable** card (`ProfileCard`) — public-safe, **no balances**:

- **Hero**: TOKI SCORE (the achievement `score`) — the single big number.
- **Tier**: BRONZE → SILVER → GOLD → PLATINUM → TOKI BLACK + stars + Lv. The tier
  reskins the whole card (accent / glow / holo sheen) via CSS custom props.
- **RANK**: global rank + percentile (optional — see leaderboard below).
- **Progress**: points to the next tier (`getNextLevelProgress`).
- **Achievement heatmap**: a 19-cell mosaic, category-colored (onboarding=cyan,
  staking=gold, explore=violet, social=pink, special=white), lit = unlocked. The
  card's signature visual; honest (no fake time-series — achievements have no
  timestamps).

The **page** (`ProfileView`) wraps the card with: Save-as-image + Copy-link
actions, and a **private** wallet panel (Staked / Idle / Total TON) that is
owner-only and never appears on the shared card.

## Data sources (all existing)

| On card | From |
|---|---|
| score / level / unlocked | `useAchievement().storage` → `buildProfileSummary` (`src/lib/profileCard.ts`) |
| tier / stars / art | `getCardTier` + `CARD_TIERS` (`src/lib/achievements.ts`) |
| progress | `getNextLevelProgress` |
| rank | `/api/profile` → `src/lib/leaderboard.ts` (optional) |
| balances (private only) | `useStakedTon` |
| identity | `usePrivy()` (Google name / email / short address) |

## Files

```
src/lib/profileCard.ts             # buildProfileSummary + tier skins + heatmap palette (pure)
src/components/profile/ProfileCard.tsx  # the shareable passport (forwardRef → PNG export)
src/components/profile/ProfileView.tsx  # the /profile page (data wiring, save/copy, private panel)
src/app/profile/page.tsx           # /profile (auth-gated, dynamic ssr:false)
src/app/profile-preview/page.tsx   # /profile-preview — QA, mock data, no login
src/lib/leaderboard.ts             # syncAndRank (Supabase, graceful)
src/app/api/profile/route.ts       # POST: verify Privy → sync score → return rank
supabase/migrations/20260622000000_profile_scores.sql
```

Image export uses **`html-to-image`** (`toPng` on the card node, `pixelRatio: 2.5`).

## Leaderboard / RANK — activation

Rank is **best-effort**: if unconfigured, the card simply renders without the RANK
chip (no error). To light it up:

1. Apply `supabase/migrations/20260622000000_profile_scores.sql`.
2. Ensure env `PRIVY_APP_SECRET` (Privy token verify — same as AI Access Stage 2)
   and `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set.

On each `/profile` open, the user's score is upserted and ranked
(`rank = count(score > mine) + 1`, percentile = `rank/total`).

## Possible next steps

- **Public profile page** `/u/[address]` + `opengraph-image` (satori) so a shared
  link renders a Twitter/OG card — turns the passport into a viral loop.
- **Tier skins polish** — bespoke holo per tier (esp. TOKI BLACK neon).
- **Leaderboard page** — top-N ranking view.
