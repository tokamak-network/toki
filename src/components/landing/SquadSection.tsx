/* eslint-disable @next/next/no-img-element */
"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { useScreenTransition } from "@/components/transitions/TransitionProvider";
import { getStartTransition } from "@/components/transitions/registry";

/**
 * "TOKI SQUAD" feature section below the hero — a 1:1 port of the
 * poster-squad prototype (portrait 3:4.1 poster centered in the section).
 * Wedge images are placeholder sprites; swap for the per-feature cuts later.
 * NOTE: copy is hardcoded for this WIP poster section; localize when locked.
 */
export default function SquadSection() {
  const { ready, authenticated } = usePrivy();
  const { open: openAuthChoice } = useAuthModal();
  const { navigate } = useScreenTransition();

  const start = () => {
    if (!ready) return;
    // Entering the hub → play the chosen entry transition (default: squad).
    if (authenticated) navigate("/dashboard", undefined, getStartTransition());
    else openAuthChoice();
  };

  return (
    <section className="tk-squad">
      <style>{css}</style>
      <div className="poster">
        <div className="top">TOKI <b>SQUAD</b></div>

        <div className="stage">
          <div className="wedge w1"><img src="/characters/toki-staking.png" alt="" /><div className="ov ov1" /><div className="dk" /><div className="lab">Staking</div></div>
          <div className="wedge w2"><img src="/characters/toki-wallet.png" alt="" /><div className="ov ov2" /><div className="dk" /><div className="lab">Wallet</div></div>
          <div className="wedge w3"><img src="/characters/toki-private.png" alt="" /><div className="ov ov3" /><div className="dk" /><div className="lab">Private</div></div>
          <div className="wedge w4"><img src="/characters/toki-ai.png" alt="" /><div className="ov ov4" /><div className="dk" /><div className="lab">AI Access</div></div>
          <div className="wedge w5"><img src="/characters/toki-lottery.png" alt="" /><div className="ov ov5" /><div className="dk" /><div className="lab">Lottery</div></div>
        </div>

        <div className="script">Stake &amp; Play<small>start on-chain</small></div>

        <div className="ticker"><span className="track">STAKING&nbsp;·&nbsp;WALLET&nbsp;·&nbsp;PRIVATE&nbsp;·&nbsp;AI ACCESS&nbsp;·&nbsp;LOTTERY&nbsp;·&nbsp;STAKING&nbsp;·&nbsp;WALLET&nbsp;·&nbsp;PRIVATE&nbsp;·&nbsp;AI ACCESS&nbsp;·&nbsp;LOTTERY&nbsp;·&nbsp;</span></div>

        <button type="button" className="sale" onClick={start}>NOW LIVE</button>
      </div>
    </section>
  );
}

const css = `
.tk-squad{background:#05060c;padding:clamp(40px,6vw,72px) 16px;display:flex;justify-content:center}
.tk-squad .poster{position:relative;width:min(720px,100%);aspect-ratio:3/4.1;overflow:hidden;background:#080a16;box-shadow:0 30px 80px rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.06)}
.tk-squad .top{position:absolute;left:0;right:0;top:18px;text-align:center;z-index:5;font-family:"Anton";font-size:min(9vw,64px);color:transparent;-webkit-text-stroke:1.5px rgba(255,255,255,.5);letter-spacing:.02em}
.tk-squad .top b{color:#fff;-webkit-text-stroke:0}
.tk-squad .stage{position:absolute;left:0;right:0;top:74px;bottom:190px;z-index:2}
.tk-squad .wedge{position:absolute;top:0;bottom:0;width:26%;overflow:hidden}
.tk-squad .wedge img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 16%}
.tk-squad .wedge .ov{position:absolute;inset:0;mix-blend-mode:screen;opacity:.28}
.tk-squad .wedge .dk{position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,6,14,0) 45%,rgba(5,6,14,.82))}
.tk-squad .wedge .lab{position:absolute;left:0;right:0;bottom:14px;text-align:center;z-index:3;font-family:"Permanent Marker",cursive;font-size:clamp(15px,1.7vw,20px);letter-spacing:0;color:#fff;text-shadow:0 0 12px rgba(255,77,109,.6),0 2px 6px #000;transform:rotate(-3deg)}
.tk-squad .w1{left:1%;clip-path:polygon(0 0,72% 0,100% 100%,28% 100%);background:#1b1030}
.tk-squad .w2{left:21%;clip-path:polygon(0 0,80% 0,72% 100%,0 100%);background:#102036}
.tk-squad .w3{left:38%;clip-path:polygon(8% 0,92% 0,100% 100%,0 100%);background:#0b2630;z-index:3}
.tk-squad .w4{left:58%;clip-path:polygon(20% 0,100% 0,100% 100%,28% 100%);background:#241033}
.tk-squad .w5{left:74%;clip-path:polygon(28% 0,100% 0,72% 100%,0 100%);background:#0e1838}
.tk-squad .ov1{background:linear-gradient(180deg,#a855f7,#3b1d6e)}
.tk-squad .ov2{background:linear-gradient(180deg,#22d3ee,#0e5566)}
.tk-squad .ov3{background:linear-gradient(180deg,#34e1c4,#0c5a4e)}
.tk-squad .ov4{background:linear-gradient(180deg,#c084fc,#5b2a86)}
.tk-squad .ov5{background:linear-gradient(180deg,#60a5fa,#1e3a8a)}
.tk-squad .script{position:absolute;left:0;right:0;top:46%;text-align:center;z-index:6;font-family:"Permanent Marker",cursive;font-size:min(13vw,86px);color:#ff4d6d;transform:rotate(-7deg);text-shadow:0 0 18px rgba(255,77,109,.6),3px 3px 0 rgba(0,0,0,.4);line-height:.8;pointer-events:none}
.tk-squad .script small{display:block;font-size:.5em;color:#22d3ee;transform:rotate(3deg);margin-top:-6px}
.tk-squad .info{position:absolute;left:30px;right:30px;bottom:62px;z-index:6;background:rgba(9,11,22,.8);backdrop-filter:blur(12px);border:1px solid rgba(34,211,238,.5);border-radius:10px;padding:12px 18px 13px;box-shadow:0 0 50px rgba(34,211,238,.16),inset 0 1px 0 rgba(255,255,255,.06)}
.tk-squad .info .h{display:flex;align-items:baseline;gap:9px;font-family:"Anton";font-size:20px;color:#fff;letter-spacing:.02em}
.tk-squad .info .h em{font-family:"Archivo";font-weight:800;font-style:normal;font-size:10px;letter-spacing:.2em;color:#22d3ee}
.tk-squad .info .squad{font-family:"Archivo";font-weight:800;color:#7fe3f2;font-size:10px;margin-top:2px;letter-spacing:.18em}
.tk-squad .svc{display:grid;grid-template-columns:1fr 1fr;column-gap:20px;margin-top:9px}
.tk-squad .row{display:flex;align-items:center;gap:9px;padding:5px 0}
.tk-squad .row .no{font-family:"Anton";font-size:23px;line-height:.78;color:var(--c);min-width:28px}
.tk-squad .row .en{font-family:"Archivo";font-weight:800;font-size:12.5px;letter-spacing:.05em;color:#fff}
.tk-squad .row .kr{font-family:"Noto Sans KR",sans-serif;font-weight:500;font-size:11px;color:#aab6d8;margin-left:auto}
.tk-squad .c1{--c:#b06bff}.tk-squad .c2{--c:#22d3ee}.tk-squad .c3{--c:#34e1c4}.tk-squad .c4{--c:#c084fc}.tk-squad .c5{--c:#60a5fa}
.tk-squad .meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px;border-top:1px solid rgba(34,211,238,.2);padding-top:9px}
.tk-squad .meta span{font-family:"Archivo";font-weight:700;font-size:10px;letter-spacing:.04em;color:#cdd6e6;padding:3px 9px;border:1px solid rgba(34,211,238,.35);border-radius:4px}
.tk-squad .meta span b{color:#22d3ee}
.tk-squad .ticker{position:absolute;left:0;right:0;bottom:104px;z-index:6;overflow:hidden;white-space:nowrap;border-top:1px solid rgba(34,211,238,.3);border-bottom:1px solid rgba(34,211,238,.3);padding:9px 0;background:rgba(9,11,22,.55)}
.tk-squad .ticker .track{display:inline-block;font-family:"Anton";font-size:20px;color:#22d3ee;letter-spacing:.12em;animation:tkmarq 16s linear infinite}
@keyframes tkmarq{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.tk-squad .sale{position:absolute;left:0;right:0;bottom:34px;z-index:6;border:0;background:transparent;cursor:pointer;font-family:"Permanent Marker",cursive;font-size:min(56px,12vw);color:#ff4d6d;letter-spacing:.01em;text-shadow:0 0 22px rgba(255,77,109,.7),3px 3px 0 rgba(0,0,0,.4);transform:rotate(-4deg);transition:transform .15s}
.tk-squad .sale:hover{transform:rotate(-4deg) scale(1.05)}
`;
