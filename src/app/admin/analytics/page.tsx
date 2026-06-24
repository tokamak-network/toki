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

function TrendChart({ series }: { series: SeriesPoint[] }) {
  const max = Math.max(1, ...series.map((p) => p.visitors));
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="mb-4 text-sm font-semibold text-white/70">
        최근 30일 일별 방문자 / 활성지갑
      </h2>
      <div className="flex h-40 items-end gap-1">
        {series.map((p) => {
          const h = Math.round((p.visitors / max) * 100);
          const wh = Math.round((p.activeWallets / max) * 100);
          return (
            <div
              key={p.date}
              className="group relative flex flex-1 flex-col items-center justify-end"
              title={`${p.date}\n방문자 ${p.visitors} · 활성지갑 ${p.activeWallets} · 페이지뷰 ${p.pageviews}`}
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
          <span className="inline-block h-2 w-2 rounded-sm bg-cyan-400/70" /> 방문자(세션)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm bg-fuchsia-400/70" /> 활성지갑
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
}: {
  title: string;
  rows: { label: string; count: number }[];
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="mb-3 text-sm font-semibold text-white/70">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-white/30">아직 데이터 없음</p>
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
  const [token, setToken] = useState("");
  const [input, setInput] = useState("");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(TOKEN_KEY);
      if (saved) setToken(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const load = useCallback(async (tok: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/analytics", {
        headers: { "x-admin-token": tok },
      });
      if (res.status === 401) {
        setError("토큰이 올바르지 않습니다.");
        setData(null);
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || `요청 실패 (${res.status})`);
        setData(null);
        return;
      }
      setData(await res.json());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) load(token);
  }, [token, load]);

  const submit = () => {
    const t = input.trim();
    if (!t) return;
    try {
      localStorage.setItem(TOKEN_KEY, t);
    } catch {
      /* ignore */
    }
    setToken(t);
  };

  // Token gate
  if (!token || (error && !data)) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 text-white">
        <h1 className="text-2xl font-bold">Toki Analytics</h1>
        <p className="mt-1 text-sm text-white/50">관리자 토큰을 입력하세요.</p>
        <input
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="ADMIN_DASHBOARD_TOKEN"
          className="mt-4 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-cyan-400"
        />
        {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
        <button
          onClick={submit}
          className="mt-3 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-400"
        >
          들어가기
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 text-white">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Toki Analytics</h1>
          <p className="text-sm text-white/50">toki.tokamak.network · 목표 대비 현황</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/40">
          {data && <span>업데이트 {new Date(data.updatedAt).toLocaleString("ko-KR")}</span>}
          <button onClick={() => load(token)} className="rounded-md border border-white/15 px-3 py-1.5 hover:bg-white/5">
            {loading ? "불러오는 중…" : "새로고침"}
          </button>
        </div>
      </div>

      {data?.capped && (
        <p className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
          30일 이벤트가 6만 건을 넘어 일부가 집계에서 잘렸습니다. 정확도가 필요하면 SQL 집계로 전환하세요.
        </p>
      )}

      {data && (
        <>
          <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <GoalCard label="월간 방문자 (MAU)" value={data.kpis.mau} goal={data.goals.mau} hint="최근 30일 고유 세션" />
            <GoalCard label="지갑 생성 (누적)" value={data.kpis.walletCreatedTotal} goal={data.goals.wallets} hint="전체 기간" />
            <GoalCard label="활성지갑 DAU" value={data.kpis.activeWalletDau} goal={data.goals.dau} hint="오늘(KST) 활동 지갑" />
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <span className="text-sm text-white/60">방문자 DAU (참고)</span>
              <div className="mt-2 text-3xl font-bold tabular-nums">{data.kpis.visitorDau.toLocaleString()}</div>
              <p className="mt-3 text-xs text-white/40">오늘(KST) 고유 방문 세션</p>
            </div>
          </section>

          <section className="mt-6">
            <TrendChart series={data.series} />
          </section>

          <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="mb-4 text-sm font-semibold text-white/70">전환 퍼널 (최근 30일)</h2>
              <div className="space-y-2.5">
                <FunnelRow label="방문자" value={data.funnel.visitors30d} base={data.funnel.visitors30d} />
                <FunnelRow label="지갑 보유" value={data.funnel.identified30d} base={data.funnel.visitors30d} />
                <FunnelRow label="지갑 생성" value={data.funnel.walletsCreated30d} base={data.funnel.visitors30d} />
                <FunnelRow label="스테이킹" value={data.funnel.stakers30d} base={data.funnel.visitors30d} />
              </div>
            </div>
            <ListCard
              title="유입 경로 (Referrer)"
              rows={data.topReferrers.map((r) => ({ label: r.referrer, count: r.count }))}
            />
          </section>

          <section className="mt-6">
            <ListCard
              title="인기 페이지"
              rows={data.topPaths.map((r) => ({ label: r.path, count: r.count }))}
            />
          </section>
        </>
      )}
    </main>
  );
}
