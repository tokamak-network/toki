import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// KPI targets for the dashboard's goal progress.
const GOALS = { mau: 1000, wallets: 100, dau: 10 };

// Day boundaries are computed in KST (the product's primary audience).
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function kstDate(d: Date): string {
  return new Date(d.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

function host(u: string): string | null {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

interface EventRow {
  event_type: string;
  session_id: string | null;
  wallet_address: string | null;
  path: string | null;
  referrer: string | null;
  created_at: string;
}

// PostgREST caps a single response at ~1000 rows, so page through the window.
async function fetchWindow(sinceIso: string): Promise<{ rows: EventRow[]; capped: boolean }> {
  const pageSize = 1000;
  const maxPages = 60; // safety cap = 60k rows
  const rows: EventRow[] = [];
  for (let page = 0; page < maxPages; page++) {
    const from = page * pageSize;
    const { data, error } = await supabaseAdmin
      .from("analytics_events")
      .select("event_type, session_id, wallet_address, path, referrer, created_at")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    rows.push(...(data as EventRow[]));
    if (data.length < pageSize) return { rows, capped: false };
  }
  return { rows, capped: true };
}

export async function GET(req: NextRequest) {
  const token = process.env.ADMIN_DASHBOARD_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "ADMIN_DASHBOARD_TOKEN is not configured on the server." },
      { status: 500 },
    );
  }
  const provided =
    req.headers.get("x-admin-token") || req.nextUrl.searchParams.get("token") || "";
  if (provided !== token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const since = new Date(now.getTime() - 30 * DAY_MS);
  const todayStr = kstDate(now);

  let rows: EventRow[];
  let capped: boolean;
  try {
    ({ rows, capped } = await fetchWindow(since.toISOString()));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }

  // All-time wallet_created count (cheap head count, not bound to the 30d window).
  const { count: walletCreatedTotal } = await supabaseAdmin
    .from("analytics_events")
    .select("*", { count: "exact", head: true })
    .eq("event_type", "wallet_created");

  const siteHost = host(process.env.NEXT_PUBLIC_SITE_URL || "https://toki.tokamak.network");

  const sessions30d = new Set<string>();
  const identifiedSessions = new Set<string>();
  const walletsCreated30d = new Set<string>();
  const stakers30d = new Set<string>();
  const sessionsToday = new Set<string>();
  const walletsToday = new Set<string>();
  const refCount = new Map<string, number>();
  const pathCount = new Map<string, number>();
  const daily = new Map<
    string,
    { visitors: Set<string>; wallets: Set<string>; pageviews: number; created: number }
  >();

  for (const e of rows) {
    const day = kstDate(new Date(e.created_at));
    let bucket = daily.get(day);
    if (!bucket) {
      bucket = { visitors: new Set(), wallets: new Set(), pageviews: 0, created: 0 };
      daily.set(day, bucket);
    }

    if (e.session_id) {
      sessions30d.add(e.session_id);
      bucket.visitors.add(e.session_id);
      if (day === todayStr) sessionsToday.add(e.session_id);
    }
    if (e.wallet_address) {
      if (e.session_id) identifiedSessions.add(e.session_id);
      bucket.wallets.add(e.wallet_address);
      if (day === todayStr) walletsToday.add(e.wallet_address);
    }
    if (e.event_type === "page_view") {
      bucket.pageviews++;
      if (e.path) pathCount.set(e.path, (pathCount.get(e.path) || 0) + 1);
      if (e.referrer) {
        const h = host(e.referrer);
        if (h && h !== siteHost) refCount.set(h, (refCount.get(h) || 0) + 1);
      }
    }
    if (e.event_type === "wallet_created") {
      bucket.created++;
      if (e.wallet_address) walletsCreated30d.add(e.wallet_address);
    }
    if (e.event_type === "stake" && e.wallet_address) stakers30d.add(e.wallet_address);
  }

  // 30-day daily series (oldest → newest), zero-filled.
  const series = [];
  for (let i = 29; i >= 0; i--) {
    const d = kstDate(new Date(now.getTime() - i * DAY_MS));
    const b = daily.get(d);
    series.push({
      date: d,
      visitors: b ? b.visitors.size : 0,
      activeWallets: b ? b.wallets.size : 0,
      pageviews: b ? b.pageviews : 0,
      walletsCreated: b ? b.created : 0,
    });
  }

  const topReferrers = Array.from(refCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([referrer, count]) => ({ referrer, count }));
  const topPaths = Array.from(pathCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([path, count]) => ({ path, count }));

  return NextResponse.json({
    goals: GOALS,
    updatedAt: now.toISOString(),
    capped, // true if the 30d window exceeded 60k rows and was truncated
    kpis: {
      mau: sessions30d.size,
      visitorDau: sessionsToday.size,
      activeWalletDau: walletsToday.size,
      walletCreatedTotal: walletCreatedTotal ?? 0,
    },
    funnel: {
      visitors30d: sessions30d.size,
      identified30d: identifiedSessions.size,
      walletsCreated30d: walletsCreated30d.size,
      stakers30d: stakers30d.size,
    },
    series,
    topReferrers,
    topPaths,
  });
}
