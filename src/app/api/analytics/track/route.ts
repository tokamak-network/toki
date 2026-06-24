import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Keep in sync with AnalyticsEvent in src/lib/analytics.ts
const ALLOWED_EVENTS = new Set([
  "page_view",
  "wallet_created",
  "wallet_active",
  "login",
  "stake",
  "service_click",
  "lottery_claim",
  "ai_key_issued",
  "agent_used",
  "private_transfer",
]);

const BOT_RE =
  /bot|crawl|spider|slurp|bing|google|yandex|baidu|duckduck|facebookexternalhit|embedly|quora|pinterest|slackbot|telegrambot|whatsapp|headless|lighthouse|pagespeed|gtmetrix|monitor|uptime|curl|wget|python-requests|axios|node-fetch|vercel-screenshot/i;

function deviceFromUA(ua: string): string {
  if (/ipad|tablet/i.test(ua)) return "tablet";
  if (/mobile|android|iphone|ipod/i.test(ua)) return "mobile";
  return "desktop";
}

const noContent = () => new NextResponse(null, { status: 204 });

export async function POST(req: NextRequest) {
  try {
    const ua = req.headers.get("user-agent") || "";
    // Silently drop bots/crawlers so they don't inflate visitor counts.
    if (!ua || BOT_RE.test(ua)) return noContent();

    const raw = await req.text();
    if (!raw) return noContent();

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return noContent();
    }

    const eventType = typeof body.event_type === "string" ? body.event_type : "";
    const sessionId = typeof body.session_id === "string" ? body.session_id : "";
    if (!ALLOWED_EVENTS.has(eventType) || !sessionId) return noContent();

    const wallet =
      typeof body.wallet_address === "string" && body.wallet_address
        ? body.wallet_address.toLowerCase().slice(0, 64)
        : null;
    const path = typeof body.path === "string" ? body.path.slice(0, 512) : null;
    const referrer = typeof body.referrer === "string" ? body.referrer.slice(0, 512) : null;
    const country = req.headers.get("x-vercel-ip-country");
    const meta =
      body.meta && typeof body.meta === "object" && !Array.isArray(body.meta)
        ? (body.meta as Record<string, unknown>)
        : null;

    await supabaseAdmin.from("analytics_events").insert({
      event_type: eventType,
      session_id: sessionId.slice(0, 64),
      wallet_address: wallet,
      path,
      referrer,
      device: deviceFromUA(ua),
      country,
      meta,
    });

    return noContent();
  } catch {
    // Never surface analytics errors to the client.
    return noContent();
  }
}
