/* eslint-disable @next/next/no-img-element */
"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { useScreenTransition } from "@/components/transitions/TransitionProvider";
import { getStartTransition } from "@/components/transitions/registry";

// One pass of the ticker. Rendered twice inside each <span class="seq"> so a
// single seq always exceeds the poster width — then translateX(-50%) on the
// flex track (two seqs) wraps with no visible gap (nowrap keeps it on one line).
const TICKER_SEQ = "STAKING · WALLET · PRIVATE · AI ACCESS · LOTTERY · ";

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
          <div className="wedge w1"><img src="/characters/toki-staking.png" alt="" /><div className="ov ov1" /><div className="dk" /></div>
          <div className="wedge w2"><img src="/characters/toki-wallet.png" alt="" /><div className="ov ov2" /><div className="dk" /></div>
          <div className="wedge w3"><img src="/characters/toki-private.png" alt="" /><div className="ov ov3" /><div className="dk" /></div>
          <div className="wedge w4"><img src="/characters/toki-ai.png" alt="" /><div className="ov ov4" /><div className="dk" /></div>
          <div className="wedge w5"><img src="/characters/toki-lottery.png" alt="" /><div className="ov ov5" /><div className="dk" /></div>
          {/* labels live on a top layer so no neighbouring wedge can paint over them */}
          <div className="labels">
            <span className="lab l1">Staking</span>
            <span className="lab l2">Wallet</span>
            <span className="lab l3">Private</span>
            <span className="lab l4">AI Access</span>
            <span className="lab l5">Lottery</span>
          </div>
        </div>

        <div className="script">Stake &amp; Play<small>start on-chain</small></div>

        <div className="ticker">
          <div className="track">
            <span className="seq">{TICKER_SEQ.repeat(2)}</span>
            <span className="seq" aria-hidden="true">{TICKER_SEQ.repeat(2)}</span>
          </div>
        </div>

        <button type="button" className="sale" onClick={start}>NOW LIVE</button>
      </div>
    </section>
  );
}

const css = `
.tk-squad{background:radial-gradient(135% 80% at 50% 0%,rgba(255,140,75,.20),transparent 52%),radial-gradient(90% 55% at 84% 6%,rgba(255,205,140,.13),transparent 55%),radial-gradient(120% 70% at 50% 100%,rgba(34,211,238,.10),transparent 60%),linear-gradient(180deg,#1a0f0b 0%,#140d16 42%,#08070f 100%);padding:clamp(40px,6vw,72px) 16px;display:flex;justify-content:center}
.tk-squad .poster{position:relative;width:min(720px,100%);aspect-ratio:3/4.1;overflow:hidden;background:#080a16;box-shadow:0 30px 80px rgba(0,0,0,.6),0 0 80px rgba(255,150,80,.12);border:1px solid rgba(255,255,255,.06)}
.tk-squad .top{position:absolute;left:0;right:0;top:18px;text-align:center;z-index:5;font-family:"Anton";font-size:min(9vw,64px);color:transparent;-webkit-text-stroke:1.5px rgba(255,255,255,.5);letter-spacing:.02em}
.tk-squad .top b{color:#fff;-webkit-text-stroke:0}
.tk-squad .stage{position:absolute;left:0;right:0;top:74px;bottom:190px;z-index:2}
.tk-squad .wedge{position:absolute;top:0;bottom:0;width:26%;overflow:hidden}
.tk-squad .wedge img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 16%}
.tk-squad .wedge .ov{position:absolute;inset:0;mix-blend-mode:screen;opacity:.28}
.tk-squad .wedge .dk{position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,6,14,0) 45%,rgba(5,6,14,.82))}
.tk-squad .labels{position:absolute;inset:0;z-index:5;pointer-events:none}
.tk-squad .lab{position:absolute;bottom:14px;white-space:nowrap;font-family:"Permanent Marker",cursive;font-size:clamp(13px,1.5vw,18px);letter-spacing:0;color:#fff;text-shadow:0 0 12px rgba(255,77,109,.6),0 2px 6px #000;transform:translateX(-50%) rotate(-3deg)}
.tk-squad .l1{left:14%}
.tk-squad .l2{left:34%}
.tk-squad .l3{left:51%}
.tk-squad .l4{left:71%}
.tk-squad .l5{left:87%}
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
.tk-squad .ticker{position:absolute;left:0;right:0;bottom:104px;z-index:6;overflow:hidden;white-space:nowrap;border-top:1px solid rgba(34,211,238,.3);border-bottom:1px solid rgba(34,211,238,.3);padding:9px 0;background:rgba(9,11,22,.55)}
.tk-squad .ticker .track{display:flex;width:max-content;animation:tkmarq 22s linear infinite;will-change:transform}
.tk-squad .ticker .seq{flex:0 0 auto;white-space:nowrap;font-family:"Anton";font-size:20px;color:#22d3ee;letter-spacing:.12em}
@keyframes tkmarq{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.tk-squad .sale{position:absolute;left:0;right:0;bottom:34px;z-index:6;border:0;background:transparent;cursor:pointer;font-family:"Permanent Marker",cursive;font-size:min(56px,12vw);color:#ff4d6d;letter-spacing:.01em;text-shadow:0 0 22px rgba(255,77,109,.7),3px 3px 0 rgba(0,0,0,.4);transform:rotate(-4deg);transition:transform .15s}
.tk-squad .sale:hover{transform:rotate(-4deg) scale(1.05)}
@media (prefers-reduced-motion:reduce){.tk-squad .ticker .track{animation:none}}
`;
