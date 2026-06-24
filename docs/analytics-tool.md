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

## Notes & limits

- Day boundaries are **KST** (UTC+9).
- The aggregation route pages through up to 60k rows/30 days in JS — ample for
  these goals (~1k MAU). If you ever exceed that, the dashboard shows a "capped"
  warning; switch the aggregation to a Postgres RPC/`count(distinct …)` at that point.
- The table has RLS enabled with no policies: only the server (service-role key)
  can read/write it; the public anon key gets nothing.
