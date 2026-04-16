"use client";

import Image from "next/image";
import { useTranslation } from "@/components/providers/LanguageProvider";
import EventPoster from "@/components/event/EventPoster";

export default function EventPage() {
  const { t } = useTranslation();
  const e = t.eventPage;

  const LINKS = [
    {
      id: "lottery",
      title: e.lottery,
      subtitle: e.lotteryDesc,
      href: "/lottery",
      iconSrc: "/toki-lottery.png",
      color: "from-pink-500 to-pink-700",
      borderColor: "border-pink-400/30",
      external: false,
    },
    {
      id: "naver-map",
      title: e.naverMap,
      subtitle: e.mapDesc,
      href: "https://naver.me/5wWe6XdA",
      iconSrc: "/naver-map-icon.png",
      color: "from-green-500 to-green-700",
      borderColor: "border-green-400/30",
      external: true,
    },
    {
      id: "kakao-map",
      title: e.kakaoMap,
      subtitle: e.mapDesc,
      href: "https://place.map.kakao.com/718492093",
      iconSrc: "/kakao-map-icon.png",
      color: "from-yellow-400 to-amber-500",
      borderColor: "border-yellow-400/30",
      external: true,
    },
    {
      id: "toki-main",
      title: e.tokiMain,
      subtitle: e.tokiMainDesc,
      href: "/",
      iconSrc: "/toki-main-wave.png",
      color: "",
      borderColor: "border-cyan-400/30",
      external: false,
    },
  ];

  return (
    <main
      className="relative min-h-screen overflow-hidden flex flex-col items-center pt-14"
      style={{
        background:
          "linear-gradient(180deg, #fff5f7 0%, #ffe4ec 30%, #ffd6e0 50%, #fce8ef 70%, #f5e6f0 100%)",
      }}
    >
      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm bg-white/30 border-b border-pink-200/15">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <Image
              src="/toki-icon.png"
              alt="Toki"
              width={28}
              height={28}
              className="w-7 h-7 rounded-full"
            />
            <Image
              src="/toki-title-logo.png"
              alt="Toki"
              width={100}
              height={40}
              className="w-[50px] h-auto"
            />
          </a>
          <nav className="flex items-center gap-2 text-xs font-medium">
            <a href="/lottery" className="px-3 py-1.5 rounded-lg bg-pink-500/10 text-pink-600 hover:bg-pink-500/20 active:scale-95 transition-all">
              {e.headerLottery}
            </a>
            <a href="/" className="px-3 py-1.5 rounded-lg bg-pink-500/10 text-pink-600 hover:bg-pink-500/20 active:scale-95 transition-all">
              {e.headerMain}
            </a>
          </nav>
        </div>
      </header>

      {/* ── Floating cherry-blossom orbs ──────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="animate-orb-float-1 absolute rounded-full blur-3xl opacity-40"
          style={{
            width: "400px",
            height: "400px",
            top: "-100px",
            left: "-80px",
            background: "radial-gradient(circle, #fbcfe8 0%, transparent 70%)",
          }}
        />
        <div
          className="animate-orb-float-2 absolute rounded-full blur-3xl opacity-30"
          style={{
            width: "350px",
            height: "350px",
            bottom: "-60px",
            right: "-60px",
            background: "radial-gradient(circle, #f9a8d4 0%, transparent 70%)",
          }}
        />
        <div
          className="animate-orb-float-3 absolute rounded-full blur-2xl opacity-25"
          style={{
            width: "260px",
            height: "260px",
            top: "45%",
            left: "55%",
            background: "radial-gradient(circle, #c4b5fd 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ── Petal particles ───────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-[1]">
        <span className="animate-particle-drift-1 absolute block rounded-full" style={{ width: "7px", height: "5px", top: "12%", left: "10%", background: "#f9a8d4", boxShadow: "0 0 6px 2px rgba(249,168,212,0.5)", opacity: 0.8 }} />
        <span className="animate-particle-drift-5 absolute block rounded-full" style={{ width: "6px", height: "4px", top: "68%", left: "8%", background: "#f472b6", boxShadow: "0 0 6px 2px rgba(244,114,182,0.4)", opacity: 0.6 }} />
        <span className="animate-particle-drift-2 absolute block rounded-full" style={{ width: "4px", height: "3px", top: "78%", left: "72%", background: "#fbcfe8", boxShadow: "0 0 4px 1px rgba(251,207,232,0.4)", opacity: 0.7 }} />
        <span className="animate-particle-drift-3 absolute block rounded-full" style={{ width: "7px", height: "5px", top: "85%", left: "40%", background: "#f472b6", boxShadow: "0 0 7px 2px rgba(244,114,182,0.4)", opacity: 0.6, animationDelay: "3.5s" }} />
        <span className="animate-particle-drift-4 absolute block rounded-full" style={{ width: "9px", height: "6px", top: "5%", left: "75%", background: "#fbcfe8", boxShadow: "0 0 8px 3px rgba(251,207,232,0.5)", opacity: 0.8, animationDelay: "1s" }} />
        <span className="animate-particle-drift-6 absolute block rounded-full" style={{ width: "8px", height: "5px", top: "30%", left: "85%", background: "#f9a8d4", boxShadow: "0 0 7px 2px rgba(249,168,212,0.4)", opacity: 0.6, animationDelay: "2.5s" }} />
        <span className="animate-particle-drift-1 absolute block rounded-full" style={{ width: "10px", height: "7px", top: "55%", left: "90%", background: "#fda4af", boxShadow: "0 0 9px 3px rgba(253,164,175,0.4)", opacity: 0.5, animationDelay: "4s" }} />
        <span className="animate-particle-drift-3 absolute block rounded-full" style={{ width: "6px", height: "4px", top: "40%", left: "20%", background: "#ddd6fe", boxShadow: "0 0 5px 2px rgba(221,214,254,0.4)", opacity: 0.5, animationDelay: "5s" }} />
      </div>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md md:max-w-lg flex flex-col items-center px-5 pt-10 pb-10">

        {/* Branding */}
        <div className="flex items-center gap-1.5 mb-1 whitespace-nowrap">
          <Image
            src="/toki-logo.png"
            alt="Tokamak Network"
            width={24}
            height={24}
            className="rounded-full"
          />
          <span className="text-pink-800/60 text-[14px] font-bold tracking-[1.5px] uppercase">
            Tokamak Network
          </span>
          <span className="text-emerald-400/50 font-serif italic text-[14px]">×</span>
          <span className="text-emerald-500/70 font-bold text-[14px] tracking-[1.5px] uppercase">
            THE GREEN
          </span>
        </div>

        <div className="mb-8" />

        {/* Event poster */}
        <EventPoster />

        {/* Title */}
        <div className="text-center mb-6 animate-fade-in">
          <h1
            className="text-3xl md:text-4xl font-black tracking-tight mb-1"
            style={{
              background: "linear-gradient(90deg, #ec4899 0%, #f472b6 30%, #a855f7 60%, #ec4899 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "shimmer 4s ease-in-out infinite",
            }}
          >
            TOKI LOTTERY
          </h1>
          <p className="text-xs text-pink-400/70 tracking-widest uppercase font-medium">
            {e.tagline}
          </p>
        </div>

        {/* Link Buttons */}
        <div className="w-full flex flex-col gap-3 mb-8">
          {LINKS.map((link) => (
            <a
              key={link.id}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              className={`
                group relative overflow-hidden rounded-xl border ${link.borderColor}
                p-4 flex items-center gap-4
                transition-all duration-200
                hover:scale-[1.02] active:scale-[0.98]
              `}
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(252,231,243,0.4) 100%)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 2px 12px rgba(244,114,182,0.1), inset 0 1px 0 rgba(255,255,255,0.5)",
              }}
            >
              <div
                className={`
                  w-11 h-11 rounded-lg bg-gradient-to-br ${link.color}
                  flex items-center justify-center shrink-0
                  shadow-md overflow-hidden
                `}
              >
                <Image
                  src={link.iconSrc}
                  alt={link.title}
                  width={44}
                  height={44}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-gray-800 font-bold text-sm">
                  {link.title}
                </div>
                <div className="text-gray-500/70 text-xs mt-0.5">
                  {link.subtitle}
                </div>
              </div>
              {link.external && (
                <svg
                  className="w-4 h-4 text-gray-400/50 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              )}
            </a>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-1.5">
          <Image
            src="/toki-logo.png"
            alt="Tokamak Network"
            width={14}
            height={14}
            className="opacity-40"
          />
          <p className="text-[10px] text-pink-400/50 tracking-wider uppercase font-medium">
            {e.poweredBy}
          </p>
        </div>
      </div>
    </main>
  );
}
