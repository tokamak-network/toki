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

type Phase = "out" | "in";
type Ctx = { navigate: (href: string, menuKey?: string) => void };

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
    (href: string, menuKey?: string) => {
      if (busyRef.current) return;
      if (reducedRef.current) {
        router.push(href);
        return;
      }
      const k: TransKey = (menuKey && MENU_TRANS[menuKey]) || "fade";
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
        <div className={`screen-cover sc-${key} sc-${phase}`} aria-hidden="true" />
      )}
    </TransitionCtx.Provider>
  );
}

const COVER_CSS = `
.screen-cover{position:fixed;inset:0;z-index:9999;pointer-events:none;will-change:transform,opacity,clip-path}
.screen-cover.sc-out{pointer-events:auto}

/* default fade */
.sc-fade{background:#05080e}
.sc-fade.sc-out{animation:scFadeIn .2s ease forwards}
.sc-fade.sc-in{animation:scFadeOut .24s ease forwards}
@keyframes scFadeIn{from{opacity:0}to{opacity:1}}
@keyframes scFadeOut{from{opacity:1}to{opacity:0}}

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

/* spread — card shutter (collection) */
.sc-spread{background:repeating-linear-gradient(90deg,rgba(245,158,11,.85) 0 14.28%,rgba(245,158,11,.55) 14.28% 28.56%)}
.sc-spread.sc-out{animation:scSpreadIn .34s cubic-bezier(.16,1,.3,1) forwards}
.sc-spread.sc-in{animation:scSpreadOut .44s cubic-bezier(.5,0,.75,0) forwards}
@keyframes scSpreadIn{from{transform:translateY(-100%)}to{transform:translateY(0)}}
@keyframes scSpreadOut{from{transform:translateY(0)}to{transform:translateY(100%)}}

/* map — grid wipe (explore) */
.sc-map{background:linear-gradient(rgba(96,165,250,.16) 1px,transparent 1px) 0 0/40px 40px,linear-gradient(90deg,rgba(96,165,250,.16) 1px,transparent 1px) 0 0/40px 40px,rgba(6,12,22,.95)}
.sc-map.sc-out{animation:scMapIn .36s cubic-bezier(.16,1,.3,1) forwards}
.sc-map.sc-in{animation:scMapOut .42s cubic-bezier(.5,0,.75,0) forwards}
@keyframes scMapIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}
@keyframes scMapOut{from{transform:translateX(0)}to{transform:translateX(100%)}}

@media (prefers-reduced-motion: reduce){.screen-cover{display:none!important}}
`;
