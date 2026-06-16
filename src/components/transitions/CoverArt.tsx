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

/** Inner content for a cover of the given transition key (null = empty cover). */
export function coverChildren(k: TransKey): React.ReactNode {
  if (k === "spread") return <CardShutterArt />;
  if (k === "squad") return <SquadWedgeArt />;
  return null;
}
