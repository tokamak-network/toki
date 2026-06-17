/* eslint-disable @next/next/no-img-element */
// Inner artwork rendered inside a transition cover for specific keys.
// Kept here (not inline) so TransitionProvider and the /transitions catalog tile
// render the exact same thing. Styling lives in COVER_CSS (.csa*), so it ships
// wherever that stylesheet is injected.
import type { TransKey } from "./registry";

// Card shutter (spread): a fanned "hand" of the real Toki tier cards. The cards
// are character portraits, so we frame them as cards in CSS (rounded + tier
// border) and fan them with per-card rotation/translate. Temporary art using
// existing assets until a purpose-built card panel exists.
const FAN: { src: string; tint: string; tf: string; z: number; hero?: boolean }[] = [
  { src: "/toki-card-bronze.png", tint: "#c8803a", tf: "translate(-50%,-50%) translateX(-130%) rotate(-15deg)", z: 3 },
  { src: "/toki-card-silver.png", tint: "#cfd3da", tf: "translate(-50%,-50%) translateX(-65%) rotate(-7.5deg)", z: 4 },
  { src: "/toki-card-gold.png", tint: "#f5b301", tf: "translate(-50%,-56%) scale(1.16)", z: 9, hero: true },
  { src: "/toki-card-platinum.png", tint: "#dfe7f0", tf: "translate(-50%,-50%) translateX(65%) rotate(7.5deg)", z: 4 },
  { src: "/toki-card-black.png", tint: "#5b5b66", tf: "translate(-50%,-50%) translateX(130%) rotate(15deg)", z: 3 },
];

export function CardShutterArt() {
  return (
    <div className="csa">
      {FAN.map((c) => (
        <div
          key={c.src}
          className={`csa-card${c.hero ? " csa-hero" : ""}`}
          style={
            { "--t": c.tint, transform: c.tf, zIndex: c.z } as React.CSSProperties
          }
        >
          <img src={c.src} alt="" />
        </div>
      ))}
    </div>
  );
}

// Squad wedge (squad): five angled character panels that stagger-swipe in to
// cover the screen, then clear it — a motion version of poster-squad.html. Used
// for the landing "시작하기" → hub entry. Geometry/colors live in COVER_CSS
// (.sc-squad .sw1…5); here we just place the sprites.
const SQUAD: { cls: string; img: string }[] = [
  { cls: "sw1", img: "/characters/toki-proud.png" },
  { cls: "sw2", img: "/characters/toki-welcome.png" },
  { cls: "sw3", img: "/characters/toki-wink.png" },
  { cls: "sw4", img: "/characters/toki-thinking.png" },
  { cls: "sw5", img: "/characters/toki-cheer.png" },
];

export function SquadWedgeArt() {
  return (
    <div className="sqw">
      {SQUAD.map((w) => (
        <div key={w.cls} className={`wdg ${w.cls}`}>
          <img src={w.img} alt="" />
          <span className="wov" />
          <span className="wdk" />
        </div>
      ))}
    </div>
  );
}

// Manga assemble (manga): a cyan "manga cover" poster builds itself — five Toki
// character panels (each a different outfit / gaze / composition), the big
// vertical 토키 title, the side labels, and a token-symbol footer each fly in
// from a different direction and snap into the poster grid, then scatter back out
// to reveal the new screen. Cyan-clean port of public/poster-allmight-toki.html.
// Geometry/timing live in COVER_CSS (.sc-manga .ma*).
const MANGA: { cls: string; img: string; lab: string }[] = [
  { cls: "mp1", img: "/characters/toki-beach-sarong.png", lab: "01 STAKING" },
  { cls: "mp2", img: "/characters/toki-wallet.png", lab: "02 WALLET" },
  { cls: "mp3", img: "/characters/toki-ai.png", lab: "04 AI" },
  { cls: "mp4", img: "/characters/toki-private.png", lab: "03 PRIVATE" },
  { cls: "mp5", img: "/characters/toki-surf-portrait.png", lab: "05 LOTTERY" },
];

export function MangaAssembleArt() {
  return (
    <div className="maw">
      <div className="ma-rband" />
      <div className="ma-title">토키</div>
      <div className="ma-vsub">TOKI</div>
      <div className="ma-ltxt">TOKAMAK NETWORK</div>
      <div className="ma-ltxt2">MINI-WALLET &amp; HUB</div>
      <div className="ma-panels">
        {MANGA.map((p) => (
          <div key={p.cls} className={`ma-pan ${p.cls}`}>
            <img src={p.img} alt="" />
            <span className="ma-scr" />
            <span className="ma-lab">{p.lab}</span>
          </div>
        ))}
      </div>
      <div className="ma-footer">
        <img className="ma-tok" src="/toki-logo.png" alt="" />
        <span className="ma-ft">
          <b>APP HUB</b>
          <small>STAKING · MINI-WALLET · ECOSYSTEM</small>
        </span>
        <img className="ma-tok" src="/toki-logo.png" alt="" />
      </div>
    </div>
  );
}

/** Inner content for a cover of the given transition key (null = empty cover). */
export function coverChildren(k: TransKey): React.ReactNode {
  if (k === "spread") return <CardShutterArt />;
  if (k === "squad") return <SquadWedgeArt />;
  if (k === "manga") return <MangaAssembleArt />;
  return null;
}
