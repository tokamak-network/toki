"use client";

import { useCallback, useEffect, useState } from "react";

interface SeriesPoint {
  date: string;
  visitors: number;
  activeWallets: number;
  pageviews: number;
  walletsCreated: number;
}

interface AnalyticsData {
  goals: { mau: number; wallets: number; dau: number };
  updatedAt: string;
  capped: boolean;
  kpis: {
    mau: number;
    visitorDau: number;
    activeWalletDau: number;
    walletCreatedTotal: number;
  };
  funnel: {
    visitors30d: number;
    identified30d: number;
    walletsCreated30d: number;
    stakers30d: number;
  };
  series: SeriesPoint[];
  topReferrers: { referrer: string; count: number }[];
  topPaths: { path: string; count: number }[];
}

const TOKEN_KEY = "toki_admin_token";
const LANG_KEY = "toki_admin_lang";

type Lang = "ko" | "en";

// Self-contained i18n for this admin-only page (kept out of the main locale
// files, which drive the public site). Toggle at the top switches EN / 한국어.
const STRINGS: Record<Lang, {
  locale: string;
  subtitle: string;
  tokenPrompt: string;
  tokenInvalid: string;
  enter: string;
  reqFail: (s: number) => string;
  updated: string;
  loading: string;
  refresh: string;
  capped: string;
  mau: string;
  mauHint: string;
  walletCreated: string;
  walletCreatedHint: string;
  activeWalletDau: string;
  activeWalletDauHint: string;
  visitorDau: string;
  visitorDauHint: string;
  trendTitle: string;
  legendVisitors: string;
  legendActiveWallets: string;
  tipVisitors: string;
  tipActiveWallets: string;
  tipPageviews: string;
  funnelTitle: string;
  funnelVisitors: string;
  funnelIdentified: string;
  funnelWalletsCreated: string;
  funnelStakers: string;
  referrerTitle: string;
  topPathsTitle: string;
  noData: string;
}> = {
  ko: {
    locale: "ko-KR",
    subtitle: "목표 대비 현황",
    tokenPrompt: "관리자 토큰을 입력하세요.",
    tokenInvalid: "토큰이 올바르지 않습니다.",
    enter: "들어가기",
    reqFail: (s) => `요청 실패 (${s})`,
    updated: "업데이트",
    loading: "불러오는 중…",
    refresh: "새로고침",
    capped:
      "30일 이벤트가 6만 건을 넘어 일부가 집계에서 잘렸습니다. 정확도가 필요하면 SQL 집계로 전환하세요.",
    mau: "월간 방문자 (MAU)",
    mauHint: "최근 30일 고유 세션",
    walletCreated: "지갑 생성 (누적)",
    walletCreatedHint: "전체 기간",
    activeWalletDau: "활성지갑 DAU",
    activeWalletDauHint: "오늘(KST) 활동 지갑",
    visitorDau: "방문자 DAU (참고)",
    visitorDauHint: "오늘(KST) 고유 방문 세션",
    trendTitle: "최근 30일 일별 방문자 / 활성지갑",
    legendVisitors: "방문자(세션)",
    legendActiveWallets: "활성지갑",
    tipVisitors: "방문자",
    tipActiveWallets: "활성지갑",
    tipPageviews: "페이지뷰",
    funnelTitle: "전환 퍼널 (최근 30일)",
    funnelVisitors: "방문자",
    funnelIdentified: "지갑 보유",
    funnelWalletsCreated: "지갑 생성",
    funnelStakers: "스테이킹",
    referrerTitle: "유입 경로 (Referrer)",
    topPathsTitle: "인기 페이지",
    noData: "아직 데이터 없음",
  },
  en: {
    locale: "en-US",
    subtitle: "Progress toward goals",
    tokenPrompt: "Enter the admin token.",
    tokenInvalid: "Invalid token.",
    enter: "Enter",
    reqFail: (s) => `Request failed (${s})`,
    updated: "Updated",
    loading: "Loading…",
    refresh: "Refresh",
    capped:
      "More than 60k events in the last 30 days — some were truncated from the aggregation. Switch to SQL aggregation if you need full accuracy.",
    mau: "Monthly visitors (MAU)",
    mauHint: "Unique sessions, last 30 days",
    walletCreated: "Wallets created (total)",
    walletCreatedHint: "All time",
    activeWalletDau: "Active-wallet DAU",
    activeWalletDauHint: "Wallets active today (KST)",
    visitorDau: "Visitor DAU (ref.)",
    visitorDauHint: "Unique sessions today (KST)",
    trendTitle: "Daily visitors / active wallets — last 30 days",
    legendVisitors: "Visitors (sessions)",
    legendActiveWallets: "Active wallets",
    tipVisitors: "Visitors",
    tipActiveWallets: "Active wallets",
    tipPageviews: "Pageviews",
    funnelTitle: "Conversion funnel (last 30 days)",
    funnelVisitors: "Visitors",
    funnelIdentified: "Has wallet",
    funnelWalletsCreated: "Wallet created",
    funnelStakers: "Staked",
    referrerTitle: "Referrers",
    topPathsTitle: "Top pages",
    noData: "No data yet",
  },
};

type T = (typeof STRINGS)[Lang];

// Error is stored as a language-agnostic kind, localized only at render time.
type ErrKind =
  | { kind: "invalid" }
  | { kind: "status"; status: number }
  | { kind: "raw"; msg: string };

function errText(e: ErrKind | null, t: T): string | null {
  if (!e) return null;
  if (e.kind === "invalid") return t.tokenInvalid;
  if (e.kind === "status") return t.reqFail(e.status);
  return e.msg;
}

function LangToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-white/15 text-xs">
      {(["ko", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => onChange(l)}
          className={`px-2.5 py-1 transition-colors ${
            lang === l
              ? "bg-cyan-500 font-semibold text-black"
              : "text-white/60 hover:bg-white/5"
          }`}
        >
          {l === "ko" ? "한국어" : "EN"}
        </button>
      ))}
    </div>
  );
}

function GoalCard({
  label,
  value,
  goal,
  hint,
}: {
  label: string;
  value: number;
  goal: number;
  hint?: string;
}) {
  const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  const reached = value >= goal;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-white/60">{label}</span>
        <span className={`text-xs font-semibold ${reached ? "text-emerald-400" : "text-cyan-400"}`}>
          {pct}%
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-3xl font-bold tabular-nums">{value.toLocaleString()}</span>
        <span className="text-sm text-white/40">/ {goal.toLocaleString()}</span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${reached ? "bg-emerald-400" : "bg-cyan-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {hint && <p className="mt-2 text-xs text-white/40">{hint}</p>}
    </div>
  );
}

function TrendChart({ series, t }: { series: SeriesPoint[]; t: T }) {
  const max = Math.max(1, ...series.map((p) => p.visitors));
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="mb-4 text-sm font-semibold text-white/70">{t.trendTitle}</h2>
      <div className="flex h-40 items-end gap-1">
        {series.map((p) => {
          const h = Math.round((p.visitors / max) * 100);
          const wh = Math.round((p.activeWallets / max) * 100);
          return (
            <div
              key={p.date}
              className="group relative flex flex-1 flex-col items-center justify-end"
              title={`${p.date}\n${t.tipVisitors} ${p.visitors} · ${t.tipActiveWallets} ${p.activeWallets} · ${t.tipPageviews} ${p.pageviews}`}
            >
              <div className="flex w-full items-end justify-center gap-[1px]">
                <div
                  className="w-1/2 rounded-t-sm bg-cyan-400/70 group-hover:bg-cyan-300"
                  style={{ height: `${Math.max(2, h)}px` }}
                />
                <div
                  className="w-1/2 rounded-t-sm bg-fuchsia-400/70 group-hover:bg-fuchsia-300"
                  style={{ height: `${Math.max(2, wh)}px` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex gap-4 text-xs text-white/50">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm bg-cyan-400/70" /> {t.legendVisitors}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm bg-fuchsia-400/70" /> {t.legendActiveWallets}
        </span>
      </div>
    </div>
  );
}

function FunnelRow({ label, value, base }: { label: string; value: number; base: number }) {
  const pct = base > 0 ? Math.round((value / base) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-sm text-white/60">{label}</span>
      <div className="h-6 flex-1 overflow-hidden rounded-md bg-white/10">
        <div
          className="flex h-full items-center rounded-md bg-cyan-500/40 px-2 text-xs font-medium"
          style={{ width: `${Math.max(6, pct)}%` }}
        >
          {value.toLocaleString()}
        </div>
      </div>
      <span className="w-10 shrink-0 text-right text-xs text-white/40">{pct}%</span>
    </div>
  );
}

function ListCard({
  title,
  rows,
  emptyText,
}: {
  title: string;
  rows: { label: string; count: number }[];
  emptyText: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="mb-3 text-sm font-semibold text-white/70">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-white/30">{emptyText}</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-white/70">{r.label}</span>
              <span className="shrink-0 tabular-nums text-white/40">{r.count.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [lang, setLang] = useState<Lang>("ko");
  const [token, setToken] = useState("");
  const [input, setInput] = useState("");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrKind | null>(null);

  const t = STRINGS[lang];

  useEffect(() => {
    try {
      const saved = localStorage.getItem(TOKEN_KEY);
      if (saved) setToken(saved);
      const savedLang = localStorage.getItem(LANG_KEY);
      if (savedLang === "en" || savedLang === "ko") setLang(savedLang);
    } catch {
      /* ignore */
    }
  }, []);

  const changeLang = (l: Lang) => {
    setLang(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* ignore */
    }
  };

  const load = useCallback(async (tok: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/analytics", {
        headers: { "x-admin-token": tok },
      });
      if (res.status === 401) {
        setError({ kind: "invalid" });
        setData(null);
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ? { kind: "raw", msg: j.error } : { kind: "status", status: res.status });
        setData(null);
        return;
      }
      setData(await res.json());
    } catch (e) {
      setError({ kind: "raw", msg: String(e) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) load(token);
  }, [token, load]);

  const submit = () => {
    const val = input.trim();
    if (!val) return;
    try {
      localStorage.setItem(TOKEN_KEY, val);
    } catch {
      /* ignore */
    }
    setToken(val);
  };

  const errMsg = errText(error, t);

  // Token gate
  if (!token || (error && !data)) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 text-white">
        <div className="mb-4 flex justify-end">
          <LangToggle lang={lang} onChange={changeLang} />
        </div>
        <h1 className="text-2xl font-bold">Toki Analytics</h1>
        <p className="mt-1 text-sm text-white/50">{t.tokenPrompt}</p>
        <input
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="ADMIN_DASHBOARD_TOKEN"
          className="mt-4 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-cyan-400"
        />
        {errMsg && <p className="mt-2 text-sm text-rose-400">{errMsg}</p>}
        <button
          onClick={submit}
          className="mt-3 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-400"
        >
          {t.enter}
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 text-white">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Toki Analytics</h1>
          <p className="text-sm text-white/50">toki.tokamak.network · {t.subtitle}</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/40">
          <LangToggle lang={lang} onChange={changeLang} />
          {data && <span>{t.updated} {new Date(data.updatedAt).toLocaleString(t.locale)}</span>}
          <button onClick={() => load(token)} className="rounded-md border border-white/15 px-3 py-1.5 hover:bg-white/5">
            {loading ? t.loading : t.refresh}
          </button>
        </div>
      </div>

      {data?.capped && (
        <p className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
          {t.capped}
        </p>
      )}

      {data && (
        <>
          <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <GoalCard label={t.mau} value={data.kpis.mau} goal={data.goals.mau} hint={t.mauHint} />
            <GoalCard label={t.walletCreated} value={data.kpis.walletCreatedTotal} goal={data.goals.wallets} hint={t.walletCreatedHint} />
            <GoalCard label={t.activeWalletDau} value={data.kpis.activeWalletDau} goal={data.goals.dau} hint={t.activeWalletDauHint} />
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <span className="text-sm text-white/60">{t.visitorDau}</span>
              <div className="mt-2 text-3xl font-bold tabular-nums">{data.kpis.visitorDau.toLocaleString()}</div>
              <p className="mt-3 text-xs text-white/40">{t.visitorDauHint}</p>
            </div>
          </section>

          <section className="mt-6">
            <TrendChart series={data.series} t={t} />
          </section>

          <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="mb-4 text-sm font-semibold text-white/70">{t.funnelTitle}</h2>
              <div className="space-y-2.5">
                <FunnelRow label={t.funnelVisitors} value={data.funnel.visitors30d} base={data.funnel.visitors30d} />
                <FunnelRow label={t.funnelIdentified} value={data.funnel.identified30d} base={data.funnel.visitors30d} />
                <FunnelRow label={t.funnelWalletsCreated} value={data.funnel.walletsCreated30d} base={data.funnel.visitors30d} />
                <FunnelRow label={t.funnelStakers} value={data.funnel.stakers30d} base={data.funnel.visitors30d} />
              </div>
            </div>
            <ListCard
              title={t.referrerTitle}
              emptyText={t.noData}
              rows={data.topReferrers.map((r) => ({ label: r.referrer, count: r.count }))}
            />
          </section>

          <section className="mt-6">
            <ListCard
              title={t.topPathsTitle}
              emptyText={t.noData}
              rows={data.topPaths.map((r) => ({ label: r.path, count: r.count }))}
            />
          </section>
        </>
      )}
    </main>
  );
}
