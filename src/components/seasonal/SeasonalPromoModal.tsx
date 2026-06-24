/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { useScreenTransition } from "@/components/transitions/TransitionProvider";
import { getStartTransition } from "@/components/transitions/registry";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { currentSeason } from "@/config/season";

/**
 * First-visit-per-season promo popup. Surfaces the current campaign poster +
 * the headline feature (AI Membership) over the landing, then routes to the
 * staking flow. Reskin via src/config/season.ts + the `seasonalPromo` locale block.
 *
 * Show logic:
 *  - hidden permanently this season once dismissed via the checkbox or after the
 *    user clicks the CTA (`currentSeason.dismissKey` in localStorage)
 *  - otherwise shown once per browser session ("Maybe later"/× set a session flag)
 */
export default function SeasonalPromoModal() {
  const { t } = useTranslation();
  const p = t.seasonalPromo;
  const { ready, authenticated } = usePrivy();
  const { open: openAuthChoice } = useAuthModal();
  const { navigate } = useScreenTransition();

  const [open, setOpen] = useState(false);
  const [dontShow, setDontShow] = useState(false);
  const sessionKey = `${currentSeason.dismissKey}:session`;

  useEffect(() => {
    let suppressed = false;
    try {
      suppressed =
        !!localStorage.getItem(currentSeason.dismissKey) ||
        !!sessionStorage.getItem(sessionKey);
    } catch {
      suppressed = true; // storage blocked → don't nag
    }
    if (suppressed) return;
    const id = window.setTimeout(() => setOpen(true), 600); // let the landing paint first
    return () => window.clearTimeout(id);
  }, [sessionKey]);

  // Scroll-lock + Escape-to-close while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dontShow]);

  const close = () => {
    try {
      sessionStorage.setItem(sessionKey, "1");
      if (dontShow) localStorage.setItem(currentSeason.dismissKey, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  const start = () => {
    try {
      localStorage.setItem(currentSeason.dismissKey, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
    if (!ready) return;
    if (authenticated) navigate("/dashboard", undefined, getStartTransition());
    else openAuthChoice();
  };

  if (!open) return null;

  return (
    <div
      className="tkpromo-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={p.title}
      onClick={close}
    >
      <style>{css}</style>
      <div className="tkpromo-card" onClick={(e) => e.stopPropagation()}>
        <button className="tkpromo-x" aria-label={t.authChoice.close} onClick={close}>
          ×
        </button>

        <div className="tkpromo-poster-cell">
          <img className="tkpromo-poster" src={currentSeason.poster} alt={p.posterAlt} />
          <span className="tkpromo-sticker">{p.newSeason}</span>
        </div>

        <div className="tkpromo-body">
          <span className="tkpromo-tag">
            <span className="dot" />
            {p.tag}
          </span>
          <h2 className="tkpromo-title">{p.title}</h2>

          <ul className="tkpromo-feats">
            <li>
              <span className="ic ic1">✓</span>
              <span>
                {p.feat1.lead}
                <b>{p.feat1.strong}</b>
                {p.feat1.tail}
              </span>
            </li>
            <li>
              <span className="ic ic2">∞</span>
              <span>
                {p.feat2.lead}
                <b>{p.feat2.strong}</b>
                {p.feat2.tail}
              </span>
            </li>
            <li>
              <span className="ic ic3">★</span>
              <span>
                {p.feat3.lead}
                <b>{p.feat3.strong}</b>
                {p.feat3.tail}
              </span>
            </li>
          </ul>

          <div className="tkpromo-ctarow">
            <button className="tkpromo-cta" onClick={start}>
              {p.cta} <span className="arr">→</span>
            </button>
            <button className="tkpromo-ghost" onClick={close}>
              {p.later}
            </button>
          </div>

          <div className="tkpromo-foot">
            <label className="tkpromo-seen">
              <input
                type="checkbox"
                checked={dontShow}
                onChange={(e) => setDontShow(e.target.checked)}
              />
              <span className="box" aria-hidden="true">
                {dontShow ? "✓" : ""}
              </span>
              {p.dontShow}
            </label>
            <span className="tkpromo-mark">TOKAMAK NETWORK</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const css = `
.tkpromo-overlay{position:fixed;inset:0;z-index:120;display:flex;align-items:center;justify-content:center;padding:18px;
  background:rgba(10,30,42,.5);backdrop-filter:blur(7px) saturate(1.05);-webkit-backdrop-filter:blur(7px) saturate(1.05);
  animation:tkpromoFade .25s ease both}
@keyframes tkpromoFade{from{opacity:0}to{opacity:1}}
@keyframes tkpromoPop{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}
@keyframes tkpromoUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}

.tkpromo-card{position:relative;width:836px;max-width:100%;display:grid;grid-template-columns:300px 1fr;overflow:hidden;
  background:linear-gradient(180deg,#fffaf3,#fff1e2);border:2px solid #ffe6cf;border-radius:28px;
  box-shadow:0 34px 90px rgba(15,40,25,.5);animation:tkpromoPop .32s cubic-bezier(.2,.9,.3,1.2) both;
  font-family:"Fredoka",-apple-system,sans-serif}

.tkpromo-x{position:absolute;top:14px;right:16px;z-index:5;width:34px;height:34px;border-radius:50%;border:0;cursor:pointer;
  background:rgba(255,255,255,.7);color:#7c93a0;font-size:20px;line-height:1;display:grid;place-items:center;
  box-shadow:0 4px 12px rgba(0,0,0,.12);transition:transform .18s,background .15s}
.tkpromo-x:hover{transform:rotate(90deg);background:#fff;color:#0c3d57}

.tkpromo-poster-cell{position:relative;padding:26px 0 26px 26px;display:grid;place-items:center;
  background:radial-gradient(120% 90% at 30% 20%,#eafaff,#d6f0fb 70%)}
.tkpromo-poster{width:248px;max-width:100%;display:block;border-radius:14px;outline:5px solid #fff;outline-offset:-1px;
  box-shadow:0 18px 40px rgba(12,40,60,.45);transform:rotate(-3deg);transition:transform .25s ease}
.tkpromo-poster-cell:hover .tkpromo-poster{transform:rotate(0) scale(1.02)}
.tkpromo-sticker{position:absolute;left:8px;bottom:18px;font-family:"Baloo 2";font-weight:800;font-size:12px;letter-spacing:.06em;
  color:#fff;background:#ff7a59;padding:6px 13px;border-radius:999px;transform:rotate(-7deg);box-shadow:0 8px 18px rgba(255,122,89,.4)}

.tkpromo-body{padding:34px 34px 26px;display:flex;flex-direction:column;min-width:0}
.tkpromo-tag{display:inline-flex;align-items:center;gap:7px;align-self:flex-start;font-family:"Baloo 2";font-weight:800;
  font-size:11.5px;letter-spacing:.12em;color:#04323c;background:linear-gradient(90deg,#22d3ee,#7be8f5);
  padding:5px 12px;border-radius:999px;box-shadow:0 6px 16px rgba(34,211,238,.35)}
.tkpromo-tag .dot{width:6px;height:6px;border-radius:50%;background:#ff7a59;box-shadow:0 0 0 3px rgba(255,122,89,.25)}
.tkpromo-title{font-family:"Baloo 2";font-weight:800;color:#0c3d57;line-height:1.04;letter-spacing:-.01em;
  font-size:clamp(30px,2.6vw,40px);margin:16px 0 22px}
.tkpromo-feats{list-style:none;display:flex;flex-direction:column;gap:10px;margin:0 0 24px;padding:0}
.tkpromo-feats li{display:flex;align-items:flex-start;gap:11px;font-family:"Fredoka";font-weight:500;color:#234e60;
  line-height:1.35;font-size:14.5px}
.tkpromo-feats .ic{flex:none;width:26px;height:26px;border-radius:9px;display:grid;place-items:center;
  font-family:"Baloo 2";font-weight:800;font-size:14px;color:#fff;margin-top:1px}
.tkpromo-feats .ic1{background:linear-gradient(135deg,#22d3ee,#06b6d4)}
.tkpromo-feats .ic2{background:linear-gradient(135deg,#ff7a59,#ff5e7a)}
.tkpromo-feats .ic3{background:linear-gradient(135deg,#ffc24b,#f59e0b)}
.tkpromo-feats b{color:#0c3d57;font-family:"Fredoka";font-weight:700}
.tkpromo-ctarow{display:flex;align-items:center;gap:14px}
.tkpromo-cta{display:inline-flex;align-items:center;justify-content:center;gap:9px;flex:1;cursor:pointer;border:0;
  font-family:"Baloo 2";font-weight:800;color:#04303a;font-size:19px;padding:15px 20px;
  background:linear-gradient(135deg,#9bf0fb,#22d3ee 45%,#13bfe0);border-radius:16px;
  box-shadow:0 12px 26px rgba(20,180,210,.42),inset 0 1px 0 rgba(255,255,255,.7);transition:transform .16s,box-shadow .16s}
.tkpromo-cta .arr{font-family:"Baloo 2";font-weight:800;transition:transform .2s}
.tkpromo-cta:hover{transform:translateY(-2px);box-shadow:0 18px 34px rgba(20,180,210,.5),inset 0 1px 0 rgba(255,255,255,.7)}
.tkpromo-cta:hover .arr{transform:translateX(4px)}
.tkpromo-ghost{cursor:pointer;border:0;background:transparent;font-family:"Fredoka";font-weight:600;color:#5b7f93;
  font-size:14px;padding:14px 6px;white-space:nowrap;transition:color .15s}
.tkpromo-ghost:hover{color:#0c3d57}
.tkpromo-foot{margin-top:18px;padding-top:15px;border-top:1.5px dashed #f0dcc6;display:flex;align-items:center;justify-content:space-between;gap:12px}
.tkpromo-seen{display:inline-flex;align-items:center;gap:8px;cursor:pointer;font-family:"Fredoka";font-weight:500;font-size:12.5px;color:#9bb4c0;transition:color .15s}
.tkpromo-seen:hover{color:#5b7f93}
.tkpromo-seen input{position:absolute;opacity:0;width:0;height:0}
.tkpromo-seen .box{width:16px;height:16px;border-radius:5px;border:2px solid #cbd9e0;background:#fff;display:grid;place-items:center;
  font-size:11px;color:#22d3ee;font-family:"Baloo 2";font-weight:800;line-height:1}
.tkpromo-seen input:focus-visible + .box{outline:2px solid #22d3ee;outline-offset:2px}
.tkpromo-mark{font-family:"Baloo 2";font-weight:700;font-size:11px;letter-spacing:.14em;color:#bcd0d9;white-space:nowrap}

@media (max-width:720px){
  .tkpromo-overlay{align-items:flex-end;padding:0}
  .tkpromo-card{grid-template-columns:1fr;width:100%;border-radius:30px 30px 0 0;
    animation:tkpromoUp .34s cubic-bezier(.2,.9,.3,1.2) both;max-height:94vh;overflow:auto}
  .tkpromo-poster-cell{padding:24px 20px 4px;background:transparent}
  .tkpromo-poster{width:150px}
  .tkpromo-sticker{display:none}
  .tkpromo-body{padding:6px 20px 24px;align-items:center;text-align:center}
  .tkpromo-tag{align-self:center}
  .tkpromo-title{text-align:center;font-size:29px;margin:6px 0 16px}
  .tkpromo-feats{align-self:stretch}
  .tkpromo-ctarow{flex-direction:column;width:100%;gap:6px}
  .tkpromo-cta{width:100%;flex:none;font-size:18px}
  .tkpromo-ghost{order:2;padding:8px 6px}
  .tkpromo-foot{width:100%}
}
`;
