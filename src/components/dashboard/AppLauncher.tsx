"use client";

import Link from "next/link";
import { useTranslation } from "@/components/providers/LanguageProvider";

type App = {
  id: "staking" | "private-transfer" | "games" | "explore";
  icon: string;
  route: string | null; // null = disabled (no page yet)
  status: "live" | "soon";
};

// First-party hub apps (ecosystem gateway). External services live in /explore.
const APPS: App[] = [
  { id: "staking", icon: "💠", route: "/staking", status: "live" },
  { id: "private-transfer", icon: "🕶️", route: "/private-transfer", status: "soon" },
  { id: "games", icon: "🎮", route: null, status: "soon" },
  { id: "explore", icon: "🧭", route: "/explore", status: "live" },
];

export default function AppLauncher() {
  const { t } = useTranslation();

  const labels: Record<App["id"], { name: string; desc: string }> = {
    staking: { name: t.hub.appStaking, desc: t.hub.appStakingDesc },
    "private-transfer": { name: t.hub.appPrivateTransfer, desc: t.hub.appPrivateTransferDesc },
    games: { name: t.hub.appGames, desc: t.hub.appGamesDesc },
    explore: { name: t.hub.appExplore, desc: t.hub.appExploreDesc },
  };

  return (
    <section className="mb-6">
      <h2 className="text-lg font-semibold mb-3">{t.hub.whatToDo}</h2>
      <div className="grid grid-cols-2 gap-3">
        {APPS.map((app) => {
          const l = labels[app.id];
          const live = app.status === "live";
          const inner = (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{app.icon}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    live ? "bg-accent-cyan/15 text-accent-cyan" : "bg-white/10 text-gray-400"
                  }`}
                >
                  {live ? t.hub.badgeLive : t.hub.badgeSoon}
                </span>
              </div>
              <div className="text-sm font-semibold text-white">{l.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">{l.desc}</div>
            </>
          );
          const base = "p-4 rounded-xl border transition-all";
          return app.route ? (
            <Link
              key={app.id}
              href={app.route}
              className={`${base} bg-gradient-to-br from-accent-blue/10 to-accent-cyan/10 border-accent-cyan/20 hover:border-accent-cyan/40 hover:scale-[1.02]`}
            >
              {inner}
            </Link>
          ) : (
            <div
              key={app.id}
              aria-disabled
              className={`${base} bg-white/[0.03] border-white/10 opacity-60 cursor-not-allowed`}
            >
              {inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}
