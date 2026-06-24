// Lightweight GA4 event helper. No-op when gtag is not loaded
// (e.g. NEXT_PUBLIC_GA_ID not set, or during SSR).

type GtagFn = (command: "event" | "config" | "js", ...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
  }
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  try {
    window.gtag("event", name, params ?? {});
  } catch {
    // Silently ignore — analytics must never break the UX.
  }
}

// ---------------------------------------------------------------------------
// First-party, privacy-friendly analytics (Supabase-backed).
// Visitors are identified only by an anonymous UUID in localStorage — no IP,
// no cookies, no PII. Powers the /admin/analytics KPI dashboard.
// See supabase/analytics_events.sql and docs/analytics-tool.md.
// ---------------------------------------------------------------------------

const SID_KEY = "toki_sid";
const TRACK_URL = "/api/analytics/track";

/** Product events we track. Keep in sync with the API route's allow-list. */
export type AnalyticsEvent =
  | "page_view"
  | "wallet_created"
  | "wallet_active"
  | "login"
  | "stake"
  | "service_click"
  | "lottery_claim"
  | "ai_key_issued"
  | "agent_used"
  | "private_transfer";

interface TrackOptions {
  walletAddress?: string | null;
  path?: string;
  referrer?: string | null;
  meta?: Record<string, unknown> | null;
}

function randomId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Stable anonymous visitor id (one per browser). Empty string on the server. */
export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(SID_KEY);
    if (!id) {
      id = randomId();
      localStorage.setItem(SID_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

/** Fire-and-forget event. Uses sendBeacon so it survives page unload. */
export function track(event: AnalyticsEvent, opts: TrackOptions = {}): void {
  if (typeof window === "undefined") return;
  const sessionId = getSessionId();
  if (!sessionId) return;

  const payload = {
    event_type: event,
    session_id: sessionId,
    wallet_address: opts.walletAddress ?? null,
    path: opts.path ?? window.location.pathname,
    referrer: opts.referrer ?? (document.referrer || null),
    meta: opts.meta ?? null,
  };

  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(TRACK_URL, new Blob([body], { type: "application/json" }));
    } else {
      void fetch(TRACK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
    }
  } catch {
    /* analytics must never break the app */
  }

  // Mirror meaningful product events into GA4 (no-op if gtag isn't loaded).
  // page_view is skipped — GA4 enhanced measurement already tracks navigations,
  // so forwarding it here would double-count pageviews.
  if (event !== "page_view") {
    trackEvent(event, { ...(opts.meta ?? {}), page: payload.path });
  }
}

/** Fire wallet_created at most once per wallet, ever (deduped in localStorage). */
export function trackWalletCreated(address: string): void {
  if (typeof window === "undefined" || !address) return;
  const flag = `toki_wc_${address.toLowerCase()}`;
  try {
    if (localStorage.getItem(flag)) return;
    localStorage.setItem(flag, "1");
  } catch {
    /* if storage fails, still send — minor double-count risk */
  }
  track("wallet_created", { walletAddress: address });
}
