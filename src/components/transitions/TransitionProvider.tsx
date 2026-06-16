"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { MENU_TRANS, TRANSITIONS, type TransKey } from "./registry";
import { coverChildren } from "./CoverArt";

type Phase = "out" | "in";
type Ctx = {
  navigate: (href: string, menuKey?: string, transKey?: TransKey) => void;
};

const TransitionCtx = createContext<Ctx>({ navigate: () => {} });
export const useScreenTransition = () => useContext(TransitionCtx);

/**
 * Mobile-game style screen transitions. Clicking a hub menu plays that menu's
 * signature cover (rocket warp / iris / glitch / …) which masks the route swap,
 * then reveals the new screen. No heavy deps — pure CSS cover + router.push,
 * a faithful port of public/hud-game-transitions.html. Respects reduced-motion.
 */
export default function TransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [key, setKey] = useState<TransKey | null>(null);
  const [phase, setPhase] = useState<Phase | null>(null);
  const pendingRef = useRef<string | null>(null);
  const busyRef = useRef(false);
  const reducedRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    reducedRef.current =
      typeof window !== "undefined" &&
      !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const timers = timersRef.current;
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  const reset = useCallback(() => {
    setPhase(null);
    setKey(null);
    pendingRef.current = null;
    busyRef.current = false;
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  const navigate = useCallback(
    (href: string, menuKey?: string, transKey?: TransKey) => {
      if (busyRef.current) return;
      if (reducedRef.current) {
        router.push(href);
        return;
      }
      // Explicit transKey wins (e.g. the landing CTA); otherwise map the menu key.
      const k: TransKey = transKey ?? ((menuKey && MENU_TRANS[menuKey]) || "fade");
      busyRef.current = true;
      pendingRef.current = href;
      setKey(k);
      setPhase("out");
      // Push once the cover has fully covered the screen…
      timersRef.current.push(
        window.setTimeout(() => router.push(href), TRANSITIONS[k].inMs),
      );
      // …and a watchdog so we never get stuck if the route never commits.
      timersRef.current.push(
        window.setTimeout(reset, TRANSITIONS[k].inMs + 6000),
      );
    },
    [router, reset],
  );

  // Reveal once the pending route has actually committed.
  useEffect(() => {
    if (phase === "out" && pendingRef.current && pathname === pendingRef.current) {
      pendingRef.current = null;
      const k = key ?? "fade";
      setPhase("in");
      timersRef.current.push(window.setTimeout(reset, TRANSITIONS[k].outMs));
    }
  }, [pathname, phase, key, reset]);

  return (
    <TransitionCtx.Provider value={{ navigate }}>
      <style>{COVER_CSS}</style>
      {children}
      {key && phase && (
        <div className={`screen-cover sc-${key} sc-${phase}`} aria-hidden="true">
          {coverChildren(key)}
        </div>
      )}
    </TransitionCtx.Provider>
  );
}

// Exported so the /transitions catalog can replay the exact same covers.
export const COVER_CSS = `
.screen-cover{position:fixed;inset:0;z-index:9999;pointer-events:none;will-change:transform,opacity,clip-path}
.screen-cover.sc-out{pointer-events:auto}

/* default fade — half speed (2× duration) to mask page-load latency.
   Richer than a flat dip: vignette + slight zoom, and a breathing brand glow
   that pulses for as long as the cover is held (reads as an intentional
   loading screen, not a black flash). */
.sc-fade{background:radial-gradient(120% 90% at 50% 46%,rgba(13,20,32,.9),#04070d 72%)}
.sc-fade::before{content:"";position:absolute;left:50%;top:50%;width:140px;height:140px;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,rgba(34,211,238,.32),rgba(34,211,238,0) 68%);opacity:0;filter:blur(2px)}
.sc-fade.sc-out{animation:scFadeIn .4s ease forwards}
.sc-fade.sc-out::before{animation:scFadeGlow 1.1s ease-in-out .12s infinite}
.sc-fade.sc-in{animation:scFadeOut .48s ease forwards}
@keyframes scFadeIn{from{opacity:0;transform:scale(1.05)}to{opacity:1;transform:scale(1)}}
@keyframes scFadeOut{from{opacity:1}to{opacity:0}}
@keyframes scFadeGlow{0%,100%{opacity:.2;transform:translate(-50%,-50%) scale(.8)}50%{opacity:.75;transform:translate(-50%,-50%) scale(1.18)}}

/* launch — cyan warp (staking) */
.sc-launch{background:linear-gradient(0deg,rgba(34,211,238,0),rgba(34,211,238,.28) 42%,rgba(5,12,20,.97))}
.sc-launch.sc-out{animation:scLaunchIn .3s cubic-bezier(.5,0,.75,0) forwards}
.sc-launch.sc-in{animation:scLaunchOut .44s cubic-bezier(.16,1,.3,1) forwards}
@keyframes scLaunchIn{from{opacity:0;transform:translateY(42%) scaleY(.55)}to{opacity:1;transform:none}}
@keyframes scLaunchOut{from{opacity:1;transform:none}to{opacity:0;transform:translateY(-48%)}}

/* zoom — gold open (wallet) */
.sc-zoom{background:radial-gradient(60% 52% at 50% 52%,rgba(245,158,11,.5),rgba(8,10,16,.96) 70%)}
.sc-zoom.sc-out{animation:scZoomIn .28s ease-out forwards}
.sc-zoom.sc-in{animation:scZoomOut .38s ease forwards}
@keyframes scZoomIn{from{opacity:0;transform:scale(1.4)}to{opacity:1;transform:scale(1)}}
@keyframes scZoomOut{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.85)}}

/* iris — stealth (private transfer) */
.sc-iris{background:#05070d}
.sc-iris.sc-out{animation:scIrisIn .42s cubic-bezier(.5,0,.75,0) forwards}
.sc-iris.sc-in{animation:scIrisOut .5s cubic-bezier(.16,1,.3,1) forwards}
@keyframes scIrisIn{from{clip-path:circle(0% at 50% 50%)}to{clip-path:circle(150% at 50% 50%)}}
@keyframes scIrisOut{from{clip-path:circle(150% at 50% 50%)}to{clip-path:circle(0% at 50% 50%)}}

/* flip — card (lottery) */
.sc-flip{background:radial-gradient(120% 70% at 50% 50%,rgba(245,158,11,.38),rgba(6,10,18,.97) 65%)}
.sc-flip.sc-out{animation:scFlipIn .3s ease-in forwards}
.sc-flip.sc-in{animation:scFlipOut .42s cubic-bezier(.16,1,.3,1) forwards}
@keyframes scFlipIn{from{opacity:.2;transform:perspective(1400px) rotateY(-90deg)}to{opacity:1;transform:perspective(1400px) rotateY(0)}}
@keyframes scFlipOut{from{opacity:1;transform:perspective(1400px) rotateY(0)}to{opacity:0;transform:perspective(1400px) rotateY(90deg)}}

/* glitch — digital dissolve (AI access) */
.sc-glitch{background:repeating-linear-gradient(0deg,rgba(34,211,238,.16) 0 1px,transparent 1px 3px),rgba(5,10,16,.92)}
.sc-glitch.sc-out{animation:scGlitchIn .3s steps(3,end) forwards}
.sc-glitch.sc-in{animation:scGlitchOut .38s steps(3,end) forwards}
@keyframes scGlitchIn{0%{opacity:0;clip-path:inset(45% 0 45% 0)}50%{opacity:1;clip-path:inset(8% 0 22% 0);transform:translateX(-8px)}100%{opacity:1;clip-path:inset(0 0 0 0);transform:none}}
@keyframes scGlitchOut{0%{opacity:1;clip-path:inset(0 0 0 0)}50%{opacity:1;clip-path:inset(30% 0 20% 0);transform:translateX(8px)}100%{opacity:0;clip-path:inset(50% 0 50% 0)}}

/* spread — card shutter (collection). Real Toki tier cards fan out as a "hand"
   (rendered by CoverArt) and drop in as the shutter, over a dark base that masks
   fully. The cards are character portraits framed as cards here in CSS. */
.sc-spread{background:radial-gradient(70% 60% at 50% 50%,#13243f,#06101e 72%)}
.sc-spread.sc-out{animation:scSpreadIn .34s cubic-bezier(.16,1,.3,1) forwards}
.sc-spread.sc-in{animation:scSpreadOut .44s cubic-bezier(.5,0,.75,0) forwards}
.csa{position:absolute;inset:0;pointer-events:none}
.csa-card{position:absolute;left:50%;top:50%;height:60%;aspect-ratio:3/4;border-radius:14px;overflow:hidden;border:3px solid var(--t);background:#0b0f18;box-shadow:0 16px 38px rgba(0,0,0,.55)}
.csa-card img{width:100%;height:100%;object-fit:cover;object-position:50% 14%;display:block}
.csa-card.csa-hero{border-width:4px;box-shadow:0 0 22px rgba(245,179,1,.5),0 18px 44px rgba(0,0,0,.6)}
@keyframes scSpreadIn{from{transform:translateY(-100%)}to{transform:translateY(0)}}
@keyframes scSpreadOut{from{transform:translateY(0)}to{transform:translateY(100%)}}

/* map — grid wipe (explore) */
.sc-map{background:linear-gradient(rgba(96,165,250,.16) 1px,transparent 1px) 0 0/40px 40px,linear-gradient(90deg,rgba(96,165,250,.16) 1px,transparent 1px) 0 0/40px 40px,rgba(6,12,22,.95)}
.sc-map.sc-out{animation:scMapIn .36s cubic-bezier(.16,1,.3,1) forwards}
.sc-map.sc-in{animation:scMapOut .42s cubic-bezier(.5,0,.75,0) forwards}
@keyframes scMapIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}
@keyframes scMapOut{from{transform:translateX(0)}to{transform:translateX(100%)}}

/* curtain — split doors (two halves meet, then part) */
.sc-curtain{background:transparent}
.sc-curtain::before,.sc-curtain::after{content:"";position:absolute;top:0;bottom:0;width:51%}
.sc-curtain::before{left:0;background:linear-gradient(90deg,#070b14,#0e1726 84%,rgba(127,233,255,.55))}
.sc-curtain::after{right:0;background:linear-gradient(270deg,#070b14,#0e1726 84%,rgba(127,233,255,.55))}
.sc-curtain.sc-out::before{animation:scCurtLin .36s cubic-bezier(.7,0,.84,0) forwards}
.sc-curtain.sc-out::after{animation:scCurtRin .36s cubic-bezier(.7,0,.84,0) forwards}
.sc-curtain.sc-in::before{animation:scCurtLout .46s cubic-bezier(.16,1,.3,1) forwards}
.sc-curtain.sc-in::after{animation:scCurtRout .46s cubic-bezier(.16,1,.3,1) forwards}
@keyframes scCurtLin{from{transform:translateX(-100%)}to{transform:translateX(0)}}
@keyframes scCurtRin{from{transform:translateX(100%)}to{transform:translateX(0)}}
@keyframes scCurtLout{from{transform:translateX(0)}to{transform:translateX(-100%)}}
@keyframes scCurtRout{from{transform:translateX(0)}to{transform:translateX(100%)}}

/* diamond — rhombus iris from center */
.sc-diamond{background:radial-gradient(58% 58% at 50% 50%,rgba(129,140,248,.42),rgba(6,10,18,.97) 72%)}
.sc-diamond.sc-out{animation:scDiaIn .38s cubic-bezier(.5,0,.75,0) forwards}
.sc-diamond.sc-in{animation:scDiaOut .46s cubic-bezier(.16,1,.3,1) forwards}
@keyframes scDiaIn{from{clip-path:polygon(50% 50%,50% 50%,50% 50%,50% 50%)}to{clip-path:polygon(50% -65%,165% 50%,50% 165%,-65% 50%)}}
@keyframes scDiaOut{from{clip-path:polygon(50% -65%,165% 50%,50% 165%,-65% 50%)}to{clip-path:polygon(50% 50%,50% 50%,50% 50%,50% 50%)}}

/* swipe — solid panel push from the right with a bright leading edge */
.sc-swipe{background:linear-gradient(90deg,rgba(34,211,238,.6),#06101e 16%)}
.sc-swipe.sc-out{animation:scSwipeIn .32s cubic-bezier(.7,0,.3,1) forwards}
.sc-swipe.sc-in{animation:scSwipeOut .4s cubic-bezier(.7,0,.3,1) forwards}
@keyframes scSwipeIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
@keyframes scSwipeOut{from{transform:translateX(0)}to{transform:translateX(-100%)}}

/* flash — light burst */
.sc-flash{background:radial-gradient(circle at 50% 50%,#eafcff,rgba(34,211,238,.6) 30%,rgba(6,12,20,.97) 70%)}
.sc-flash.sc-out{animation:scFlashIn .26s ease-out forwards}
.sc-flash.sc-in{animation:scFlashOut .34s ease-in forwards}
@keyframes scFlashIn{0%{opacity:0;transform:scale(.2)}60%{opacity:1}100%{opacity:1;transform:scale(1)}}
@keyframes scFlashOut{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(1.6)}}

/* squad — five angled Toki character wedges stagger-swipe in, then clear
   (motion port of poster-squad.html; art rendered by CoverArt). Dark base masks
   the gaps between the diagonal wedges. */
.sc-squad{background:#070a14}
.sc-squad.sc-out{animation:scSqBg .32s ease both}
.sc-squad.sc-in{animation:scSqBgOut .92s ease both}
@keyframes scSqBg{from{opacity:0}to{opacity:1}}
@keyframes scSqBgOut{from{opacity:1}to{opacity:0}}
.sqw{position:absolute;inset:0}
.sqw .wdg{position:absolute;top:0;bottom:0;width:27%;overflow:hidden}
.sqw .wdg img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 14%}
.sqw .wov{position:absolute;inset:0;mix-blend-mode:screen;opacity:.55}
.sqw .wdk{position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,6,14,.05),rgba(5,6,14,.82))}
.sw1{left:0%;clip-path:polygon(0 0,72% 0,100% 100%,28% 100%);background:#1b1030}
.sw2{left:20%;clip-path:polygon(0 0,80% 0,72% 100%,0 100%);background:#102036}
.sw3{left:37%;clip-path:polygon(8% 0,92% 0,100% 100%,0 100%);background:#0b2630}
.sw4{left:57%;clip-path:polygon(20% 0,100% 0,100% 100%,28% 100%);background:#241033}
.sw5{left:73%;clip-path:polygon(28% 0,100% 0,72% 100%,0 100%);background:#0e1838}
.sw1 .wov{background:linear-gradient(180deg,#a855f7,#3b1d6e)}
.sw2 .wov{background:linear-gradient(180deg,#22d3ee,#0e5566)}
.sw3 .wov{background:linear-gradient(180deg,#34e1c4,#0c5a4e)}
.sw4 .wov{background:linear-gradient(180deg,#c084fc,#5b2a86)}
.sw5 .wov{background:linear-gradient(180deg,#60a5fa,#1e3a8a)}
.sc-squad.sc-out .sw1{animation:scSqTop .68s cubic-bezier(.5,0,.3,1) 0s both}
.sc-squad.sc-out .sw2{animation:scSqBot .68s cubic-bezier(.5,0,.3,1) .12s both}
.sc-squad.sc-out .sw3{animation:scSqTop .68s cubic-bezier(.5,0,.3,1) .24s both}
.sc-squad.sc-out .sw4{animation:scSqBot .68s cubic-bezier(.5,0,.3,1) .36s both}
.sc-squad.sc-out .sw5{animation:scSqTop .68s cubic-bezier(.5,0,.3,1) .48s both}
.sc-squad.sc-in .sw1{animation:scSqTopOut .6s cubic-bezier(.5,0,.75,0) .28s both}
.sc-squad.sc-in .sw2{animation:scSqBotOut .6s cubic-bezier(.5,0,.75,0) .16s both}
.sc-squad.sc-in .sw3{animation:scSqTopOut .6s cubic-bezier(.5,0,.75,0) 0s both}
.sc-squad.sc-in .sw4{animation:scSqBotOut .6s cubic-bezier(.5,0,.75,0) .16s both}
.sc-squad.sc-in .sw5{animation:scSqTopOut .6s cubic-bezier(.5,0,.75,0) .28s both}
@keyframes scSqTop{from{transform:translateY(-118%)}to{transform:translateY(0)}}
@keyframes scSqBot{from{transform:translateY(118%)}to{transform:translateY(0)}}
@keyframes scSqTopOut{from{transform:translateY(0)}to{transform:translateY(-118%)}}
@keyframes scSqBotOut{from{transform:translateY(0)}to{transform:translateY(118%)}}

@media (prefers-reduced-motion: reduce){.screen-cover{display:none!important}}
`;
