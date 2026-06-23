"use client";

import { forwardRef } from "react";
import type { ProfileSummary } from "@/lib/profileCard";
import type { RankResult } from "@/lib/leaderboard";
import type { Locale } from "@/locales";

export interface ProfileCardProps {
  summary: ProfileSummary;
  displayName: string;
  address?: string;
  rank?: RankResult | null;
  locale?: Locale;
}

// The shareable "Toki Passport" — score, tier, and an achievement-mastery heatmap.
// Public-safe: no balances. Tier reskins the whole card via CSS custom props.
// forwardRef exposes the card node so the page can rasterize it to PNG.
const ProfileCard = forwardRef<HTMLDivElement, ProfileCardProps>(function ProfileCard(
  { summary, displayName, address, rank, locale = "en" },
  ref,
) {
  const { score, level, tier, skin, progress, achievements, cells, byCategory } = summary;
  const stars = "★★★★★".slice(0, tier.stars) + "☆☆☆☆☆".slice(0, 5 - tier.stars);
  const fmt = (n: number) => n.toLocaleString("en-US");

  return (
    <div
      ref={ref}
      className="tk-pass"
      style={
        {
          "--tier": skin.accent,
          "--tier2": skin.accent2,
          "--glow": skin.glow,
          "--ring": skin.ring,
        } as React.CSSProperties
      }
    >
      <div className="tk-grid" />
      <div className="tk-holo" />
      <div className="tk-inner">
        {/* top */}
        <div className="tk-top">
          <span className="tk-brand">
            <span className="tk-d" />
            TOKI PASSPORT
          </span>
          <span className="tk-chip">
            {tier.tier} <span className="tk-st">{stars}</span>
          </span>
        </div>

        {/* identity */}
        <div className="tk-id">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="tk-av" src={tier.charImage} alt={tier.tier} />
          <div className="tk-idmeta">
            <div className="tk-nm">{displayName}</div>
            {address ? <div className="tk-ad">{address}</div> : null}
          </div>
        </div>

        {/* hero */}
        <div className="tk-hero">
          <div className="tk-heroL">
            <div className="tk-num">{fmt(score)}</div>
            <div className="tk-lbl">TOKI SCORE</div>
          </div>
          {rank?.rank ? (
            <div className="tk-rank">
              RANK
              <b>#{fmt(rank.rank)}</b>
              {rank.percentile != null ? <span>TOP {rank.percentile}%</span> : null}
            </div>
          ) : null}
        </div>
        <div className="tk-tier">
          {tier.tier} · {tier.name.toUpperCase()} · LV.{level}{" "}
          <span className="tk-stars">{"★".repeat(tier.stars)}</span>
        </div>

        {/* progress */}
        <div className="tk-prog">
          <div className="tk-progtop">
            <span>{progress.isMax ? "MAX TIER" : "NEXT TIER"}</span>
            {progress.isMax ? (
              <span><b>{fmt(score)}</b> pts</span>
            ) : (
              <span>
                <b>{fmt(progress.remaining)}</b> pts → {fmt(progress.next)}
              </span>
            )}
          </div>
          <div className="tk-bar">
            <i style={{ width: `${progress.isMax ? 100 : progress.percent}%` }} />
          </div>
        </div>

        {/* heatmap — achievement mastery mosaic */}
        <div className="tk-heat">
          <div className="tk-heathd">
            <span>ACHIEVEMENTS</span>
            <b>
              {achievements.unlocked}/{achievements.total}
            </b>
          </div>
          <div className="tk-cells">
            {cells.map((c) => (
              <span
                key={c.id}
                className={`tk-cell${c.unlocked ? " on" : ""}`}
                title={locale === "ko" ? c.titleKo : c.titleEn}
                style={
                  {
                    "--c": c.color,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
          <div className="tk-legend">
            {byCategory.map((b) => (
              <span key={b.category} className="tk-leg" style={{ "--c": b.color } as React.CSSProperties}>
                <i />
                {b.unlocked}/{b.total}
              </span>
            ))}
          </div>
        </div>

        {/* footer */}
        <div className="tk-foot">
          <span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/toki-logo.png" alt="Toki" />
            toki.tokamak.network
          </span>
          <span>ethereum mainnet</span>
        </div>
      </div>

      <style jsx>{`
        .tk-pass {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 5;
          border-radius: 26px;
          overflow: hidden;
          color: #eaf6fb;
          font-family: "Fredoka", system-ui, sans-serif;
          background: radial-gradient(120% 80% at 80% 0%, var(--glow), transparent 55%),
            radial-gradient(90% 70% at 0% 100%, rgba(34, 211, 238, 0.1), transparent 55%),
            linear-gradient(165deg, #11192b, #0a0f1c 70%);
          border: 1px solid var(--ring);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.04),
            0 0 40px var(--glow);
        }
        .tk-holo {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          mix-blend-mode: screen;
          opacity: 0.5;
          background: linear-gradient(
            115deg,
            transparent 30%,
            rgba(255, 255, 255, 0.14) 45%,
            rgba(127, 233, 255, 0.12) 50%,
            var(--glow) 55%,
            transparent 70%
          );
        }
        .tk-grid {
          position: absolute;
          inset: 0;
          z-index: 0;
          opacity: 0.5;
          background-image: linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
          background-size: 34px 34px;
        }
        .tk-inner {
          position: relative;
          z-index: 2;
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 20px 20px 16px;
        }
        .tk-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .tk-brand {
          display: flex;
          align-items: center;
          gap: 7px;
          font-family: "Baloo 2", sans-serif;
          font-weight: 800;
          font-size: 11px;
          letter-spacing: 0.18em;
          color: #cfe0f2;
        }
        .tk-d {
          width: 14px;
          height: 14px;
          border-radius: 4px;
          background: linear-gradient(135deg, var(--tier), #22d3ee);
          transform: rotate(45deg);
        }
        .tk-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: "Anton", sans-serif;
          font-size: 13px;
          letter-spacing: 0.06em;
          color: #1a1205;
          background: linear-gradient(135deg, var(--tier2), var(--tier));
          padding: 5px 11px;
          border-radius: 999px;
          box-shadow: 0 4px 14px var(--glow);
        }
        .tk-st {
          letter-spacing: -1px;
          font-size: 11px;
        }
        .tk-id {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-top: 15px;
        }
        .tk-av {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          object-fit: cover;
          object-position: center top;
          border: 1.5px solid var(--ring);
          background: #0c1116;
          flex: none;
        }
        .tk-nm {
          font-family: "Baloo 2", sans-serif;
          font-weight: 800;
          font-size: 18px;
          color: #fff;
          line-height: 1.1;
          word-break: break-all;
        }
        .tk-ad {
          font-family: ui-monospace, monospace;
          font-size: 11px;
          color: #8fb0c8;
          margin-top: 2px;
        }
        .tk-hero {
          position: relative;
          margin-top: 16px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 10px;
        }
        .tk-num {
          font-family: "Anton", sans-serif;
          font-size: clamp(52px, 16vw, 72px);
          line-height: 0.86;
          color: #fff;
          letter-spacing: -0.01em;
          text-shadow: 0 4px 26px var(--glow);
        }
        .tk-lbl {
          font-size: 10.5px;
          letter-spacing: 0.24em;
          color: var(--tier2);
          font-weight: 700;
          margin-top: 4px;
        }
        .tk-rank {
          text-align: right;
          font-size: 10px;
          letter-spacing: 0.12em;
          color: #aebfd2;
          line-height: 1.3;
        }
        .tk-rank b {
          display: block;
          font-family: "Anton", sans-serif;
          font-size: 22px;
          color: var(--tier2);
          letter-spacing: 0.02em;
        }
        .tk-rank span {
          display: block;
          font-size: 9px;
          color: var(--tier);
          font-weight: 700;
        }
        .tk-tier {
          margin-top: 10px;
          font-family: "Anton", sans-serif;
          font-size: 15px;
          letter-spacing: 0.05em;
          color: #dfe9f4;
        }
        .tk-stars {
          color: var(--tier);
          letter-spacing: 1px;
        }
        .tk-prog {
          margin-top: 11px;
        }
        .tk-progtop {
          display: flex;
          justify-content: space-between;
          font-size: 10.5px;
          color: #bcd0e6;
          margin-bottom: 5px;
          font-weight: 600;
          letter-spacing: 0.04em;
        }
        .tk-progtop b {
          color: var(--tier2);
        }
        .tk-bar {
          height: 8px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .tk-bar i {
          display: block;
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, var(--tier), #22d3ee);
          box-shadow: 0 0 12px var(--glow);
        }
        .tk-heat {
          margin-top: auto;
          padding-top: 14px;
        }
        .tk-heathd {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-size: 9.5px;
          letter-spacing: 0.14em;
          color: #8fb0c8;
          margin-bottom: 7px;
        }
        .tk-heathd b {
          font-family: "Baloo 2", sans-serif;
          font-size: 14px;
          color: #fff;
          letter-spacing: 0;
        }
        .tk-cells {
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          gap: 5px;
        }
        .tk-cell {
          aspect-ratio: 1 / 1;
          border-radius: 5px;
          background: color-mix(in srgb, var(--c) 12%, transparent);
          border: 1px solid color-mix(in srgb, var(--c) 22%, transparent);
        }
        .tk-cell.on {
          background: var(--c);
          border-color: var(--c);
          box-shadow: 0 0 9px color-mix(in srgb, var(--c) 70%, transparent);
        }
        .tk-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 9px;
          font-size: 9.5px;
          color: #9fb4cc;
          font-weight: 600;
        }
        .tk-leg {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .tk-leg i {
          width: 7px;
          height: 7px;
          border-radius: 2px;
          background: var(--c);
          box-shadow: 0 0 6px color-mix(in srgb, var(--c) 60%, transparent);
        }
        .tk-foot {
          margin-top: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 9.5px;
          color: #7e93a8;
        }
        .tk-foot img {
          width: 16px;
          height: 16px;
          object-fit: contain;
          background: #fff;
          border-radius: 50%;
          padding: 2px;
          vertical-align: middle;
          margin-right: 5px;
        }
      `}</style>
    </div>
  );
});

export default ProfileCard;
