"use client";

import { useState } from "react";
import CardPackOpening from "./CardPackOpening";
import CollectionShowcase from "./CollectionShowcase";
import FloatingCardWall from "./FloatingCardWall";
import CardWallGacha from "./CardWallGacha";
import GachaThenWall from "./GachaThenWall";
import GachaIntoWall from "./GachaIntoWall";

const VARIANTS = [
  { id: "A", label: "Gacha Teaser", component: CardPackOpening },
  { id: "B", label: "Collection Grid", component: CollectionShowcase },
  { id: "C", label: "Card Wall", component: FloatingCardWall },
  { id: "C+A", label: "Wall + Gacha", component: CardWallGacha },
  { id: "A→C", label: "Gacha → Wall", component: GachaThenWall },
  { id: "A⟶C", label: "Gacha into Wall", component: GachaIntoWall },
] as const;

export default function CardSectionSwitcher() {
  const [active, setActive] = useState(0);
  const ActiveComponent = VARIANTS[active].component;

  return (
    <div className="relative">
      {/* Variant switcher - fixed top-right */}
      <div className="absolute top-4 right-4 z-30 flex gap-1 p-1 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
        {VARIANTS.map((v, i) => (
          <button
            key={v.id}
            onClick={() => setActive(i)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              active === i
                ? "bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {v.id}: {v.label}
          </button>
        ))}
      </div>

      <ActiveComponent />
    </div>
  );
}
