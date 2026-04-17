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
