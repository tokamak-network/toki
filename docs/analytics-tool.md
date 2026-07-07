# Toki Analytics — visitor & KPI tracking

First-party, privacy-friendly analytics for **toki.tokamak.network**, built on the
Supabase instance the app already uses. Tracks the three launch KPIs against goals:

| KPI | Goal | Definition |
|-----|------|------------|
| **MAU** (월간 방문자) | 1,000 | distinct anonymous sessions in the last 30 days |
| **Wallet created** (지갑 생성) | 100 | all-time count of `wallet_created` events |
| **Active-wallet DAU** | 10 | distinct embedded wallets active today (KST) |

A secondary "visitor DAU" (distinct sessions today) is shown for reference.

## How it works

```
browser ──track()──▶ POST /api/analytics/track ──▶ Supabase: analytics_events
                                                          │
admin ──token──▶ GET /api/admin/analytics ──aggregates──┘──▶ /admin/analytics
```

- **Visitors** are an anonymous UUID in `localStorage` (`toki_sid`). No IP, no
  cookies, no PII. Bots are dropped by user-agent in the ingest route.
- **`AnalyticsTracker`** (mounted in `app/layout.tsx`, inside the Privy provider)
  fires `page_view` on every route change and tags events with the embedded
  wallet address when known — that powers active-wallet DAU and `wallet_created`.
- Vercel Web Analytics (`<Analytics/>`) and GA4/Clarity stay enabled as a free
  cross-check; this tool owns the goal-vs-target dashboard.

## One-time setup

1. **Create the table** — run [`supabase/analytics_events.sql`](../supabase/analytics_events.sql)
   in the Supabase SQL editor (Dashboard → SQL → New query → paste → Run).
2. **Env vars** (`.env.local` locally, Vercel project settings in prod):
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
     (already set if lottery works)
   - `ADMIN_DASHBOARD_TOKEN` — any long random string. Generate one with:
     `openssl rand -hex 24`
3. **Open the dashboard** at `/admin/analytics`, paste the token once (stored in
   localStorage), and you're in.

## Adding more events

Call `track()` anywhere on the client:

```ts
import { track } from "@/lib/analytics";
track("stake", { walletAddress: addr, meta: { amount } });
track("service_click", { meta: { service: "ai-access" } });
```

To add a new event type, add it to `AnalyticsEvent` in `src/lib/analytics.ts`
**and** the `ALLOWED_EVENTS` set in `src/app/api/analytics/track/route.ts`.
The `stake` funnel step and per-service breakdowns light up automatically once
those events start flowing.

## Dev traffic is excluded (don't pollute prod stats)

Local dev and the prod site share **one** Supabase project, so without guards your
`npm run dev` browsing lands in the same `analytics_events` table the dashboard
reads. Four guards keep dev traffic out:

1. **Client** — `track()` / `trackWalletCreated()` bail when `window.location.hostname`
   is `localhost` / `127.0.0.1` / `0.0.0.0` / `[::1]` / `*.local` (`src/lib/analytics.ts`).
2. **Server** — the ingest route drops events whose `Origin`/`Referer` host is a
   local-dev origin (`isLocalOrigin`, `src/app/api/analytics/track/route.ts`).
3. **Aggregation** — the admin route treats `localhost`, `127.0.0.1`, `vercel.com`,
   `*.vercel.app`, `*.local` (and the site host) as **internal**, so they never
   show up in the referrer breakdown (`isInternalReferrer`, `src/app/api/admin/analytics/route.ts`).
4. **GA4 / Clarity** — their `<Script>` tags only load when `NODE_ENV === "production"`
   (`src/app/layout.tsx`), so dev browsing doesn't pollute GA/Clarity either.

> ⚠️ These guards only apply to **new** events. Historical dev rows already in the
> table must be deleted manually (see below).

### Cleaning up historical dev rows

A dev `session_id` is any session that ever sent a localhost-referrer event
(session ids are per-origin, so dev sessions never collide with prod sessions).
Delete the **whole session** to also catch its empty-referrer rows. Preview first:

```sql
-- preview: how many rows belong to dev sessions
select count(*) from public.analytics_events
where session_id in (
  select distinct session_id from public.analytics_events
  where referrer ilike 'http://localhost%'  or referrer ilike 'https://localhost%'
     or referrer ilike 'http://127.0.0.1%' or referrer ilike 'https://127.0.0.1%'
     or referrer ilike 'http://0.0.0.0%'
);

-- delete them
delete from public.analytics_events
where session_id in (
  select distinct session_id from public.analytics_events
  where referrer ilike 'http://localhost%'  or referrer ilike 'https://localhost%'
     or referrer ilike 'http://127.0.0.1%' or referrer ilike 'https://127.0.0.1%'
     or referrer ilike 'http://0.0.0.0%'
);
```

(2026-06-30: removed 550 rows from 1 dev session; 720 → 170 real rows.)

## Cross-checking the numbers (GA4 / Clarity / Vercel)

The first-party dashboard is the source of truth for goal-vs-target, but three
independent tools let you sanity-check it. **Expect different numbers, not equal
ones** — each tool measures differently.

| Tool | Where to look | What it cross-checks |
|------|---------------|----------------------|
| **GA4** (`G-KX75TXLN8M`) | analytics.google.com → Reports → Realtime / Engagement → Events | Visitors, sessions, pageviews, and mirrored product events (`stake`, `login`, `wallet_created`, `ai_key_issued`, …) |
| **Microsoft Clarity** | clarity.microsoft.com | Sessions + heatmaps/recordings (qualitative gut-check on whether sessions are real) |
| **Vercel Web Analytics** | Vercel project → Analytics | Server-side pageviews/visitors (least ad-blocked) |

How our events reach GA4 (`src/lib/analytics.ts`):
- **`page_view` is NOT forwarded** to GA4 — GA4 enhanced measurement already
  tracks navigations, so forwarding would double-count. Compare **pageviews/sessions**
  against GA4's own automatic measurement.
- **Product events ARE mirrored** to GA4 via `gtag('event', …)`. Compare their
  counts in GA4 → Events against the dashboard's funnel/KPIs.

Why the numbers won't match exactly:

| | First-party (Supabase) | GA4 |
|--|------------------------|-----|
| Ad-blockers (uBlock etc.) | barely affected (1st-party `/api` beacon) | **often blocked** (external gtag script) |
| Bot filtering | UA regex only | Google's bot list |
| "Session" definition | one anonymous UUID per browser, forever | GA4 session (resets after 30 min idle / UTM change) |
| Dev traffic | excluded (guards above) | excluded in dev (prod-only script) |

Net effect: **first-party counts usually run higher than GA4** (ad-blockers hit
gtag, not our beacon). If GA4 is *wildly* lower than expected, suspect ad-block;
if first-party is wildly higher, suspect uncaught bot/dev traffic.

> ⚠️ GA4/Clarity only collect in prod if `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_CLARITY_ID`
> are set in **Vercel** project env (not just `.env.local`). Verify there before
> trusting a "GA shows nothing" conclusion.

## Notes & limits

- Day boundaries are **KST** (UTC+9).
- The aggregation route pages through up to 60k rows/30 days in JS — ample for
  these goals (~1k MAU). If you ever exceed that, the dashboard shows a "capped"
  warning; switch the aggregation to a Postgres RPC/`count(distinct …)` at that point.
- The table has RLS enabled with no policies: only the server (service-role key)
  can read/write it; the public anon key gets nothing.
