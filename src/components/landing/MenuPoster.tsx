/* eslint-disable @next/next/no-img-element */
"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { useScreenTransition } from "@/components/transitions/TransitionProvider";
import { getStartTransition } from "@/components/transitions/registry";
import { useTranslation } from "@/components/providers/LanguageProvider";

/**
 * Summer "menu poster" — the bridge section between the hero and the squad
 * poster. A bright beach editorial layout: big STAKE typography, the summer
 * Toki mascot, and five clickable feature panels. 1:1 port of the
 * poster-menu-summer prototype.
 * NOTE: copy is hardcoded (Korean) for this WIP section; localize when locked.
 */
export default function MenuPoster() {
  const { ready, authenticated } = usePrivy();
  const { open: openAuthChoice } = useAuthModal();
  const { navigate } = useScreenTransition();
  const { t } = useTranslation();
  const m = t.menuPoster;

  const start = () => {
    if (!ready) return;
    if (authenticated) navigate("/dashboard", undefined, getStartTransition());
    else openAuthChoice();
  };

  return (
    <section className="tk-menu">
      <style>{css}</style>
      <div className="poster">
        <div className="sun" />

        {/* big background type */}
        <div className="bgtype"><b>TO</b><i>KI</i></div>

        {/* standing summer hero */}
        <img className="hero" src="/characters/toki-beach.png" alt="Toki" />

        {/* top brand */}
        <div className="brand">
          <span className="ast">✱</span>
          <div className="bk">
            <b>TOKI</b>
            <span>{m.tagline}</span>
          </div>
        </div>

        {/* menu panels */}
        <div className="menus">
          <button type="button" className="panel live" onClick={start}>
            <span className="face"><span className="tag">01</span><img src="/characters/toki-summer-stripe.png" alt="" /></span>
            <span className="body">
              <span className="accent">✱</span>
              <span className="no">NO.01</span>
              <span className="ko">{m.staking.title}</span>
              <span className="en">STAKING</span>
              <span className="desc">{m.staking.desc}</span>
              <span className="pill">LIVE</span>
            </span>
          </button>

          <button type="button" className="panel c" onClick={start}>
            <span className="face"><span className="tag">02</span><img src="/characters/toki-summer-tank.png" alt="" /></span>
            <span className="body">
              <span className="accent">✱</span>
              <span className="no">NO.02</span>
              <span className="ko">{m.wallet.title}</span>
              <span className="en">WALLET</span>
              <span className="desc">{m.wallet.desc}</span>
            </span>
          </button>

          <button type="button" className="panel new" onClick={start}>
            <span className="face"><span className="tag">03</span><img src="/characters/toki-summer-offshoulder.png" alt="" /></span>
            <span className="body">
              <span className="accent">✱</span>
              <span className="no">NO.03</span>
              <span className="ko">{m.private.title}</span>
              <span className="en">PRIVATE TRANSFER</span>
              <span className="desc">{m.private.desc}</span>
              <span className="pill">NEW</span>
            </span>
          </button>

          <button type="button" className="panel c" onClick={start}>
            <span className="face"><span className="tag">04</span><img src="/characters/toki-summer-dress.png" alt="" /></span>
            <span className="body">
              <span className="accent">✱</span>
              <span className="no">NO.04</span>
              <span className="ko">{m.ai.title}</span>
              <span className="en">AI ACCESS</span>
              <span className="desc">{m.ai.desc}</span>
            </span>
          </button>

          <button type="button" className="panel" onClick={start}>
            <span className="face"><span className="tag">05</span><img src="/characters/toki-summer-beach.png" alt="" /></span>
            <span className="body">
              <span className="accent">✱</span>
              <span className="no">NO.05</span>
              <span className="ko">{m.lottery.title}</span>
              <span className="en">LOTTERY</span>
              <span className="desc">{m.lottery.desc}</span>
            </span>
          </button>
        </div>

        {/* editorial accents */}
        <div className="side">TOKI IS THE MAIN MASCOT OF THE TOKAMAK NETWORK ECOSYSTEM.</div>
        <div className="footmark"><img className="tokmark" src="/toki-logo.png" alt="" />TOKAMAK NETWORK</div>

        {/* fade the menu bottom into the squad section's top tone for a seamless seam */}
        <div className="botfade" />
      </div>
    </section>
  );
}

const css = `
.tk-menu{--paper:#ffffff;--ink:#0c3d57;--muted:#5b7f93;--line:#0ea5e9;--cyan:#22d3ee;--coral:#ff7a59;--sun:#ffc24b;--foam:#eaf8ff;background:#06212e;color:var(--ink);font-family:"Fredoka",-apple-system,sans-serif}
.tk-menu .poster{position:relative;min-height:100vh;width:100%;overflow:hidden;background:linear-gradient(180deg,#9fe3ff 0%,#c9edff 30%,#eaf4ec 54%,#fde6c4 78%,#a9dfe6 100%);padding:34px clamp(18px,4vw,64px)}
.tk-menu .sun{position:absolute;right:-6vw;top:-6vw;z-index:0;width:46vw;height:46vw;border-radius:50%;pointer-events:none;background:radial-gradient(circle,rgba(255,214,120,.55) 0%,rgba(255,214,120,.18) 38%,transparent 64%)}
.tk-menu .poster::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.05;z-index:0;background:repeating-linear-gradient(0deg,transparent 0 38px,#0ea5e9 38px 39px)}
.tk-menu .botfade{position:absolute;left:0;right:0;bottom:0;height:18%;z-index:7;pointer-events:none;background:linear-gradient(180deg,rgba(169,223,230,0) 0%,rgba(169,223,230,.5) 50%,#a9dfe6 100%)}
.tk-menu .bgtype{position:absolute;right:1vw;top:50%;transform:translateY(-50%);z-index:1;writing-mode:vertical-rl;text-orientation:upright;font-family:"Baloo 2",sans-serif;font-weight:800;font-size:min(11vh,105px);line-height:1;letter-spacing:.02em;user-select:none;white-space:nowrap;filter:drop-shadow(0 6px 0 rgba(14,120,170,.16))}
.tk-menu .bgtype b{color:var(--cyan)}.tk-menu .bgtype i{color:var(--coral);font-style:normal}
.tk-menu .hero{position:absolute;left:57%;right:auto;bottom:0;height:96%;width:auto;z-index:4;filter:drop-shadow(-10px 16px 22px rgba(20,90,130,.30))}
.tk-menu .brand{position:relative;z-index:6;display:flex;align-items:flex-start;gap:14px;max-width:58%}
.tk-menu .brand .ast{font-family:"Baloo 2";font-weight:800;font-size:34px;line-height:.8;color:var(--coral)}
.tk-menu .brand .bk b{font-family:"Baloo 2";font-weight:800;font-size:30px;letter-spacing:.04em;display:block;line-height:.9;color:var(--ink)}
.tk-menu .brand .bk span{font-family:"Fredoka";font-size:11.5px;letter-spacing:.01em;color:var(--muted);max-width:250px;display:block;margin-top:6px}
.tk-menu .menus{position:relative;z-index:5;margin-top:24px;margin-left:clamp(8px,3vw,48px);display:flex;flex-direction:column;gap:13px;max-width:min(55%,640px)}
.tk-menu .panel{position:relative;display:grid;grid-template-columns:94px 1fr;gap:0;background:var(--paper);border:2px solid var(--line);border-radius:14px;overflow:hidden;box-shadow:6px 6px 0 rgba(14,120,170,.45);cursor:pointer;text-align:left;font-family:inherit;color:inherit;appearance:none;-webkit-appearance:none;padding:0;transition:transform .16s,box-shadow .16s}
.tk-menu .panel:hover{transform:translate(-3px,-3px);box-shadow:11px 11px 0 var(--cyan)}
.tk-menu .panel.c:hover{box-shadow:11px 11px 0 var(--coral)}
.tk-menu .panel .face{position:relative;border-right:2px solid var(--line);overflow:hidden;background:var(--foam)}
.tk-menu .panel .face img{position:absolute;inset:6px;object-fit:cover;object-position:center 14%;border-radius:10px}
.tk-menu .panel .face .tag{position:absolute;left:3px;top:3px;z-index:2;font-family:"Baloo 2";font-weight:800;font-size:9px;letter-spacing:.06em;color:#eaf8ff;background:var(--ink);padding:1px 5px;border-radius:7px}
.tk-menu .panel .body{padding:12px 14px;display:flex;flex-direction:column;justify-content:center;position:relative}
.tk-menu .panel .no{font-family:"Baloo 2";font-weight:700;font-size:12px;letter-spacing:.16em;color:#8fb0c1}
.tk-menu .panel .ko{font-family:"Jua",sans-serif;font-size:clamp(20px,2.4vw,29px);line-height:1;color:var(--ink);margin-top:2px}
.tk-menu .panel .en{font-family:"Baloo 2";font-weight:700;font-size:11px;letter-spacing:.2em;color:#8fb0c1;margin-top:3px}
.tk-menu .panel .desc{font-family:"Fredoka";font-size:11.5px;color:var(--muted);margin-top:7px}
.tk-menu .panel .accent{position:absolute;right:12px;top:10px;font-family:"Baloo 2";font-weight:800;color:var(--cyan);font-size:20px;line-height:.7}
.tk-menu .panel.c .accent{color:var(--coral)}
.tk-menu .panel .pill{position:absolute;right:12px;bottom:11px;font-family:"Baloo 2";font-weight:800;font-size:10px;letter-spacing:.1em;padding:2px 8px;border-radius:999px;color:#fff}
.tk-menu .panel.live .pill{background:var(--cyan);color:#04141d}
.tk-menu .panel.new .pill{background:var(--coral);color:#3a1404}
.tk-menu .side{position:absolute;left:14px;top:40%;z-index:6;writing-mode:vertical-rl;font-family:"Baloo 2";font-weight:700;font-size:12px;letter-spacing:.3em;color:#8fb0c1}
.tk-menu .footmark{position:absolute;right:18px;bottom:18px;z-index:8;display:flex;align-items:center;gap:6px;font-family:"Baloo 2";font-weight:800;font-size:12px;letter-spacing:.18em;color:var(--ink);opacity:.72}
.tk-menu .footmark .tokmark{width:16px;height:16px;object-fit:contain;flex:none}
@media (max-width:720px){
  .tk-menu .poster{min-height:auto;display:flex;flex-direction:column;padding:24px 16px 40px}
  .tk-menu .brand{order:1;max-width:100%}
  .tk-menu .hero{order:2;position:relative;left:auto;bottom:auto;height:auto;width:min(62%,240px);align-self:center;margin-top:10px;filter:drop-shadow(-6px 10px 16px rgba(20,90,130,.3))}
  .tk-menu .menus{order:3;max-width:100%;margin-top:14px;margin-left:0}
  .tk-menu .bgtype{font-size:26vw;opacity:.4;right:-3vw}
  .tk-menu .side{display:none}
}
`;
