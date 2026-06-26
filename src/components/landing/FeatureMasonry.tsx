/* eslint-disable @next/next/no-img-element */
"use client";

import type { CSSProperties } from "react";
import { useTranslation } from "@/components/providers/LanguageProvider";

type Badge = { kind: "live" | "new" | "hot" | "soon"; text: string };
type Shape = "rounded" | "roundedXL" | "asym" | "asym2" | "cutTR" | "cutBL" | "circle";
type Tile = {
  img: string;
  label: string;
  span: string; // grid span classes
  shape: Shape;
  badge?: Badge;
  pos?: string;
  rotate?: number;
  labelCenter?: boolean;
};

// Varied silhouettes so the grid reads as an irregular mosaic, not uniform boxes.
const SHAPE: Record<Shape, CSSProperties> = {
  rounded: { borderRadius: 20 },
  roundedXL: { borderRadius: 40 },
  asym: { borderRadius: "44px 14px 44px 14px" },
  asym2: { borderRadius: "14px 46px 14px 46px" },
  cutTR: { clipPath: "polygon(0 0, 84% 0, 100% 22%, 100% 100%, 0 100%)" },
  cutBL: { clipPath: "polygon(0 0, 100% 0, 100% 100%, 16% 100%, 0 78%)" },
  circle: { borderRadius: "50%" },
};

export default function FeatureMasonry() {
  const { t } = useTranslation();

  const badgeColor: Record<Badge["kind"], string> = {
    live: "#22d3ee",
    new: "#a78bfa",
    hot: "#f59e0b",
    soon: "#94a3b8",
  };

  const tiles: Tile[] = [
    { img: "/toki-rocket.png", label: t.hub.appStaking, span: "col-span-2 row-span-2", shape: "cutTR", badge: { kind: "live", text: "LIVE" }, pos: "center top" },
    { img: "/characters/toki-peeking.png", label: t.hub.appPrivateTransfer, span: "row-span-2", shape: "roundedXL", badge: { kind: "new", text: "NEW" }, pos: "center top" },
    { img: "/toki-bag-full.png", label: t.hub.myWallet, span: "", shape: "circle", labelCenter: true },
    { img: "/characters/toki-thinking.png", label: t.hub.aiAccessTitle, span: "", shape: "cutBL", pos: "center top" },
    { img: "/toki-lottery.png", label: t.hub.cardLottery, span: "col-span-2", shape: "asym", badge: { kind: "hot", text: t.hub.badgeLive }, rotate: -1.5 },
    { img: "/toki-card-gold-v2.png", label: t.hub.navCollection, span: "", shape: "asym2", pos: "center 30%" },
    { img: "/backgrounds/explore.png", label: t.hub.appExplore, span: "col-span-2", shape: "rounded", rotate: 1.5 },
    { img: "/characters/toki-cheer.png", label: t.hub.navQuests, span: "", shape: "cutTR", badge: { kind: "soon", text: t.hub.badgeSoon }, pos: "center top" },
  ];

  return (
    <section
      className="relative px-4 py-20 sm:py-28"
      style={{ background: "linear-gradient(180deg,#12100c 0%, #0b0907 100%)" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div
            className="text-[12px] font-bold tracking-[0.32em] uppercase"
            style={{ color: "#f0b46a", fontFamily: "Baloo 2, sans-serif" }}
          >
            {t.features.eyebrow}
          </div>
          <h2 className="mt-2 text-3xl sm:text-5xl" style={{ fontFamily: "Jua, sans-serif", color: "#fff8ef" }}>
            {t.features.title}
          </h2>
          <p className="mt-3 text-sm sm:text-base" style={{ color: "#b7a99a", fontFamily: "Fredoka, sans-serif" }}>
            {t.features.lead}
          </p>
        </div>

        {/* irregular mosaic: varied spans (sizes) + varied silhouettes (shapes) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 grid-flow-row-dense gap-3 auto-rows-[120px] sm:auto-rows-[150px]">
          {tiles.map((tile, i) => (
            <div
              key={i}
              className={`group relative overflow-hidden cursor-pointer ${tile.span}`}
              style={{
                ...SHAPE[tile.shape],
                transform: tile.rotate ? `rotate(${tile.rotate}deg)` : undefined,
                boxShadow: "0 14px 30px rgba(0,0,0,0.4)",
              }}
            >
              <img
                src={tile.img}
                alt=""
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                style={{ objectPosition: tile.pos || "center" }}
              />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(180deg, rgba(8,6,4,0.04) 38%, rgba(8,6,4,0.86))" }}
              />
              {tile.badge && (
                <span
                  className="absolute top-3 right-3 z-10 text-[10px] font-extrabold px-2 py-0.5 rounded-full"
                  style={{
                    background: badgeColor[tile.badge.kind],
                    color: tile.badge.kind === "new" ? "#fff" : "#04141d",
                    fontFamily: "Baloo 2, sans-serif",
                  }}
                >
                  {tile.badge.text}
                </span>
              )}
              <div
                className={`absolute z-10 ${tile.labelCenter ? "inset-x-0 bottom-4 text-center" : "left-3 right-3 bottom-3"}`}
              >
                <span
                  className="text-base sm:text-lg leading-tight"
                  style={{
                    fontFamily: "Jua, sans-serif",
                    color: "#fff",
                    textShadow: "0 2px 8px rgba(0,0,0,0.8)",
                  }}
                >
                  {tile.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full border border-white/20 text-white/90 hover:bg-white/10 transition-colors"
            style={{ fontFamily: "Baloo 2, sans-serif" }}
          >
            + {t.features.loadMore}
          </button>
        </div>
      </div>
    </section>
  );
}
