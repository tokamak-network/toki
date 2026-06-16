/* eslint-disable @next/next/no-img-element */
"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { useScreenTransition } from "@/components/transitions/TransitionProvider";
import { getStartTransition } from "@/components/transitions/registry";

/**
 * Landing hero — cozy "movie poster" title screen over an ambient beach video.
 * Character lives inside the video (right); the bubble TOKI wordmark + copy are
 * HTML overlays on the left. "시작하기" → Privy login (guest) or /dashboard (returning).
 */
export default function VideoHero() {
  const { ready, authenticated } = usePrivy();
  const { t } = useTranslation();
  const { open: openAuthChoice } = useAuthModal();
  const { navigate } = useScreenTransition();

  const handleStart = () => {
    if (!ready) return;
    // Returning user → hub, with the signature transition chosen in /transitions.
    if (authenticated) navigate("/dashboard", undefined, getStartTransition());
    else openAuthChoice();
  };

  return (
    <main className="tk-vhero">
      <style>{css}</style>

      <video
        className="bgvid"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/backgrounds/toki-beach-sunset.jpg"
      >
        <source src="/backgrounds/toki-beach-sunset.webm" type="video/webm" />
        <source src="/backgrounds/toki-beach-sunset.mp4" type="video/mp4" />
      </video>
      {/* reduced-motion fallback (CSS shows this, hides the video) */}
      <img className="bgfallback" src="/backgrounds/toki-beach-sunset.jpg" alt="" />
      <div className="scrim" />

      <div className="scene">
        <div className="tagline">
          <div className="k">{t.hero.vTagline}</div>
          <div className="s">{t.hero.vSub}</div>
        </div>

        <div className="title" aria-label="TOKI">
          <span>T</span><span>O</span><span>K</span><span>I</span>
        </div>

        <div className="cta">
          <button type="button" className="btn" onClick={handleStart}>
            <span className="ar">▶</span>
            {t.hero.vStart}
          </button>
          <div className="hint">{t.hero.vHint}</div>
        </div>

        <div className="credit">{t.hero.vCredit}</div>
      </div>
    </main>
  );
}

const css = `
.tk-vhero{position:relative;height:100vh;width:100%;overflow:hidden;background:#05070d}
.tk-vhero .bgvid,.tk-vhero .bgfallback{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:70% center;z-index:0}
.tk-vhero .bgfallback{display:none}
.tk-vhero .scrim{position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(90deg,rgba(18,9,4,.5) 0%,rgba(18,9,4,.18) 34%,rgba(18,9,4,0) 58%)}
.tk-vhero .scene{position:absolute;top:64px;left:0;right:0;bottom:0;z-index:2}
.tk-vhero .tagline{position:absolute;left:5vw;top:17%}
.tk-vhero .tagline .k{font-family:"Jua","Apple SD Gothic Neo",sans-serif;font-size:clamp(22px,3.2vw,44px);color:#fff;text-shadow:0 2px 0 rgba(150,80,40,.5),0 6px 22px rgba(0,0,0,.55)}
.tk-vhero .tagline .s{margin-top:6px;font-family:"Fredoka",sans-serif;font-weight:600;font-size:clamp(12px,1.3vw,18px);letter-spacing:.04em;color:#ffe9cf;text-shadow:0 1px 6px rgba(0,0,0,.5)}
.tk-vhero .title{position:absolute;left:4vw;top:50%;transform:translateY(-52%);white-space:nowrap;user-select:none;font-family:"Baloo 2",system-ui,sans-serif;font-weight:800;line-height:.84;letter-spacing:.012em;font-size:min(20vw,300px);color:#fff8ef;-webkit-text-stroke:5px #fff8ef;paint-order:stroke fill;filter:drop-shadow(0 4px 0 rgba(150,80,40,.5)) drop-shadow(0 14px 22px rgba(20,8,2,.42)) drop-shadow(0 0 30px rgba(255,180,120,.45))}
.tk-vhero .title span{display:inline-block}
.tk-vhero .title span:nth-child(1){transform:rotate(-5deg) translateY(-1.5%)}
.tk-vhero .title span:nth-child(2){transform:rotate(3deg) translateY(3%)}
.tk-vhero .title span:nth-child(3){transform:rotate(-3deg) translateY(-2.5%)}
.tk-vhero .title span:nth-child(4){transform:rotate(5deg) translateY(2.5%)}
.tk-vhero .cta{position:absolute;left:5.5vw;bottom:16vh;z-index:3;display:flex;flex-direction:column;gap:10px;align-items:flex-start}
.tk-vhero .btn{font-family:"Baloo 2",sans-serif;font-weight:800;font-size:clamp(18px,2vw,26px);letter-spacing:.02em;color:#5a2b12;border:0;cursor:pointer;background:linear-gradient(180deg,#fff1d6,#ffd089);border-radius:999px;padding:14px 44px;box-shadow:0 12px 30px rgba(255,150,80,.45),inset 0 2px 0 rgba(255,255,255,.8),0 0 0 4px rgba(255,255,255,.22);animation:tkpulse 2.3s ease-in-out infinite}
.tk-vhero .btn .ar{margin-right:8px}
@keyframes tkpulse{0%,100%{transform:scale(1)}50%{transform:scale(1.045)}}
.tk-vhero .cta .hint{font-family:"Fredoka",sans-serif;font-size:13px;letter-spacing:.04em;color:#ffe2c2;text-shadow:0 1px 5px rgba(0,0,0,.6)}
.tk-vhero .credit{position:absolute;left:5.5vw;bottom:5vh;z-index:3;font-family:"Fredoka",sans-serif;font-weight:600;font-size:clamp(10px,1vw,13px);letter-spacing:.06em;color:#e7d8c6;text-shadow:0 1px 5px rgba(0,0,0,.6)}
@media (max-width:720px){
  .tk-vhero .bgvid,.tk-vhero .bgfallback{object-position:68% center}
  .tk-vhero .title{left:5vw;top:38%;font-size:34vw}
  .tk-vhero .tagline{top:12%;left:5vw}
  .tk-vhero .cta{bottom:13vh;left:5vw}
  .tk-vhero .credit{left:5vw}
}
@media (prefers-reduced-motion: reduce){
  .tk-vhero .bgvid{display:none}
  .tk-vhero .bgfallback{display:block}
  .tk-vhero .btn{animation:none}
}
`;
