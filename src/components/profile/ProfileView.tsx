"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { toPng } from "html-to-image";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useGoDashboard } from "@/components/transitions/TransitionProvider";
import { useAchievement } from "@/components/providers/AchievementProvider";
import { useStakedTon } from "@/hooks/useStakedTon";
import { buildProfileSummary, shortenAddress } from "@/lib/profileCard";
import type { RankResult } from "@/lib/leaderboard";
import type { AchievementStorage } from "@/lib/achievements";
import { ACHIEVEMENTS, EMPTY_STORAGE } from "@/lib/achievements";
import ProfileCard from "./ProfileCard";

// Mock storage so /profile-preview renders the full card without login (QA only).
const PREVIEW_STORAGE: AchievementStorage = {
  ...EMPTY_STORAGE,
  score: 1840,
  level: 3,
  unlocked: ACHIEVEMENTS.slice(0, 12).map((a) => a.id),
};

export default function ProfileView({ preview = false }: { preview?: boolean }) {
  const { ready, authenticated, user, getAccessToken } = usePrivy();
  const { locale, t } = useTranslation();
  const goDashboard = useGoDashboard();
  const { storage } = useAchievement();
  const { stakedTon, idleTon, address: chainAddr } = useStakedTon();

  const cardRef = useRef<HTMLDivElement>(null);
  const [rank, setRank] = useState<RankResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const activeStorage = preview ? PREVIEW_STORAGE : storage;
  const summary = useMemo(() => buildProfileSummary(activeStorage), [activeStorage]);

  // Identity (mirrors HubLobby resolution).
  const googleAccount = user?.linkedAccounts?.find((a) => a.type === "google_oauth");
  const emailAccount = user?.linkedAccounts?.find((a) => a.type === "email");
  const address = preview ? "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b" : chainAddr;
  const shortAddr = shortenAddress(address);
  const displayName = preview
    ? "Toki_User"
    : (googleAccount as { name?: string })?.name ||
      (emailAccount as { address?: string })?.address ||
      shortAddr ||
      "Toki";

  const ping = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1800);
  }, []);

  // Sync score → leaderboard and read back the rank (best-effort; hidden if null).
  useEffect(() => {
    if (preview) {
      setRank({ rank: 312, total: 4000, percentile: 8 });
      return;
    }
    if (!ready || !authenticated) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        const res = await fetch("/api/profile", {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
          body: JSON.stringify({
            score: summary.score,
            level: summary.level,
            tier: summary.tier.tier,
            address,
            displayName,
          }),
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled && data?.rank) setRank(data as RankResult);
      } catch {
        // leaderboard unconfigured — card renders without rank
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [preview, ready, authenticated, getAccessToken, summary.score, summary.level, summary.tier.tier, address, displayName]);

  const saveImage = useCallback(async () => {
    if (!cardRef.current || busy) return;
    setBusy(true);
    ping(t.profile.saving);
    try {
      await (document.fonts?.ready ?? Promise.resolve());
      const url = await toPng(cardRef.current, {
        pixelRatio: 2.5,
        cacheBust: true,
        backgroundColor: "#0a0f1c",
      });
      const a = document.createElement("a");
      a.download = `toki-passport-${summary.tier.tier.toLowerCase().replace(/\s+/g, "-")}.png`;
      a.href = url;
      a.click();
      ping(t.profile.saved);
    } catch {
      ping(t.profile.saveErr);
    } finally {
      setBusy(false);
    }
  }, [busy, summary.tier.tier, t.profile, ping]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      ping(t.profile.copied);
    } catch {
      ping(t.profile.copyErr);
    }
  }, [t.profile, ping]);

  if (!preview && (!ready || !authenticated)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070b14]">
        <div className="text-gray-400">{t.dashboard.loading}</div>
      </div>
    );
  }

  const fmtTon = (n: number | null) =>
    n == null ? "—" : n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  const total = (stakedTon ?? 0) + (idleTon ?? 0);

  return (
    <div className="pv-root">
      <div className="pv-wrap">
        <header className="pv-hd">
          <Link href="/dashboard" onClick={goDashboard} className="pv-back">
            ‹ {t.profile.back}
          </Link>
          <span className="pv-title">{t.profile.title}</span>
        </header>

        <p className="pv-hint">{t.profile.shareHint}</p>

        <ProfileCard
          ref={cardRef}
          summary={summary}
          displayName={displayName}
          address={shortAddr}
          rank={rank}
          locale={locale}
        />

        <div className="pv-actions">
          <button className="pv-btn save" onClick={saveImage} disabled={busy}>
            {busy ? t.profile.saving : t.profile.saveImage}
          </button>
          <button className="pv-btn link" onClick={copyLink}>
            {t.profile.copyLink}
          </button>
        </div>

        {/* private — owner-only wallet summary, never on the shared card */}
        <section className="pv-priv">
          <div className="pv-privhd">
            <span>{t.profile.privateTitle}</span>
            <span className="pv-lock">🔒 {t.profile.privateTag}</span>
          </div>
          <div className="pv-stats">
            <div className="pv-stat">
              <span className="k">{t.profile.staked}</span>
              <span className="v">
                {fmtTon(stakedTon)} <small>TON</small>
              </span>
            </div>
            <div className="pv-stat">
              <span className="k">{t.profile.idle}</span>
              <span className="v">
                {fmtTon(idleTon)} <small>TON</small>
              </span>
            </div>
            <div className="pv-stat">
              <span className="k">{t.profile.total}</span>
              <span className="v">
                {fmtTon(total)} <small>TON</small>
              </span>
            </div>
          </div>
          <Link href="/wallet" className="pv-walletlink">
            {t.profile.openWallet} ›
          </Link>
        </section>
      </div>

      {toast ? <div className="pv-toast">{toast}</div> : null}

      <style jsx>{`
        .pv-root {
          min-height: 100vh;
          min-height: 100dvh;
          color: #eaf6fb;
          background: linear-gradient(180deg, rgba(7, 11, 20, 0.82), rgba(7, 11, 20, 0.97)),
            url("/backgrounds/hub-bg.jpg");
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          /* top clears the fixed global Header (h-16 = 64px) */
          padding: 86px 16px 64px;
        }
        .pv-wrap {
          max-width: 460px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
        }
        .pv-hd {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }
        .pv-back {
          font-size: 12.5px;
          color: #cfe0f2;
          background: rgba(8, 24, 38, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 999px;
          padding: 7px 13px;
          font-weight: 600;
          text-decoration: none;
          transition: background 0.2s ease;
        }
        .pv-back:hover {
          background: rgba(8, 24, 38, 0.8);
        }
        .pv-title {
          font-family: "Baloo 2", sans-serif;
          font-weight: 800;
          letter-spacing: 0.14em;
          font-size: 14px;
          color: #fff;
        }
        .pv-hint {
          font-size: 12px;
          line-height: 1.5;
          color: #9fb4cc;
          margin: 0 2px 14px;
        }
        .pv-actions {
          display: flex;
          gap: 9px;
          margin-top: 14px;
        }
        .pv-btn {
          flex: 1;
          font-family: "Baloo 2", sans-serif;
          font-weight: 700;
          font-size: 13.5px;
          border: 0;
          border-radius: 14px;
          padding: 13px;
          cursor: pointer;
          transition: transform 0.15s ease, filter 0.15s ease;
        }
        .pv-btn:hover {
          transform: translateY(-1px);
          filter: brightness(1.06);
        }
        .pv-btn:disabled {
          opacity: 0.6;
          cursor: default;
          transform: none;
        }
        .pv-btn.save {
          color: #04141d;
          background: linear-gradient(135deg, #f59e0b, #f5b301);
        }
        .pv-btn.link {
          color: #cfe0f2;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
        }
        .pv-priv {
          margin-top: 18px;
          background: rgba(8, 24, 38, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 18px;
          padding: 15px 16px;
        }
        .pv-privhd {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12.5px;
          font-weight: 700;
          color: #cfe0f2;
          margin-bottom: 12px;
        }
        .pv-lock {
          font-size: 10px;
          color: #8fb0c8;
          font-weight: 600;
        }
        .pv-stats {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
        }
        .pv-stat {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .pv-stat .k {
          font-size: 9.5px;
          letter-spacing: 0.06em;
          color: #8fb0c8;
          text-transform: uppercase;
        }
        .pv-stat .v {
          font-family: "Baloo 2", sans-serif;
          font-weight: 800;
          font-size: 16px;
          color: #fff;
        }
        .pv-stat .v small {
          font-size: 9px;
          color: #aebfd2;
          font-weight: 600;
        }
        .pv-walletlink {
          display: inline-block;
          margin-top: 12px;
          font-size: 12.5px;
          font-weight: 600;
          color: #22d3ee;
          text-decoration: none;
        }
        .pv-walletlink:hover {
          text-decoration: underline;
        }
        .pv-toast {
          position: fixed;
          left: 50%;
          bottom: 30px;
          transform: translateX(-50%);
          background: rgba(8, 24, 38, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.16);
          color: #eaf6fb;
          font-size: 13px;
          font-weight: 600;
          padding: 11px 20px;
          border-radius: 999px;
          z-index: 50;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  );
}
