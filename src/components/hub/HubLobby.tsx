/* eslint-disable @next/next/no-img-element */
"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { formatUnits } from "viem";
import Header from "@/components/layout/Header";
import HubFooter from "./HubFooter";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { publicClient as client } from "@/lib/chain";
import { CONTRACTS } from "@/constants/contracts";
import ReceiveModal from "@/components/dashboard/ReceiveModal";
import { useScreenTransition } from "@/components/transitions/TransitionProvider";
import HubBackground from "./HubBackground";
import {
  MIN_TON_AI_ACCESS,
  loadIssuedKey,
  getKeyUsage,
  type KeyUsage,
} from "@/lib/aiAccess";

const erc20Abi = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const accStakedAccountAbi = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "accStakedAccount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "pendingUnstakedAccount",
    outputs: [{ name: "wtonAmount", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

type CardBadge = { kind: "live" | "new" | "hot" | "soon"; text: string };
type Card = {
  key: string;
  title: string;
  sub: string;
  img: string;
  imgStyle?: CSSProperties;
  badge?: CardBadge;
  feat?: boolean;
  spotlight?: boolean;
  locked?: boolean;
  style: CSSProperties;
  href?: string;
  external?: boolean;
  onClick?: () => void;
};

// Chrome Web Store listing for the Toki browser extension.
// TODO: replace with the published listing URL once the extension is live.
const TOKI_EXTENSION_URL = "https://chromewebstore.google.com/";

/**
 * "Toki Lobby" hub home (replaces /dashboard) — anime gacha-lobby layout.
 * Full-bleed ambient video, a centered-left full-body Toki with a dialogue box,
 * and a right-side MENU collage of slanted clip-path tiles (each a service).
 * Real on-chain balances drive the top chip + greeting; AI Access keeps its
 * native in-app key issuance. Reflows to a stacked column under `lg`.
 */
export default function HubLobby({ preview = false }: { preview?: boolean } = {}) {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const router = useRouter();
  const { t } = useTranslation();
  const { navigate } = useScreenTransition();

  const [showReceive, setShowReceive] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [aiUsage, setAiUsage] = useState<KeyUsage | null>(null);
  const [ton, setTon] = useState<number | null>(null);
  const [staked, setStaked] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [noticeIdx, setNoticeIdx] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadIssuedKey();
    setHasKey(!!stored);
    if (stored) {
      getKeyUsage(stored.key)
        .then(setAiUsage)
        .catch(() => {});
    }
  }, []);

  // Rotate the top-left notice/event banner.
  useEffect(() => {
    const id = window.setInterval(
      () => setNoticeIdx((i) => (i + 1) % 3),
      4200
    );
    return () => window.clearInterval(id);
  }, []);

  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
  const externalWallet = wallets.find((w) => w.walletClientType !== "privy");
  const hasLinkedExternalWallet = user?.linkedAccounts?.some(
    (a) => a.type === "wallet"
  );
  const primaryWallet =
    (hasLinkedExternalWallet && externalWallet) || embeddedWallet;
  const balanceAddress = primaryWallet?.address;

  useEffect(() => {
    if (!preview && ready && !authenticated) router.push("/");
  }, [preview, ready, authenticated, router]);

  const fetchBalances = useCallback(async () => {
    if (!balanceAddress) return;
    setLoading(true);
    try {
      const addr = balanceAddress as `0x${string}`;
      const results = await client.multicall({
        contracts: [
          {
            address: CONTRACTS.TON as `0x${string}`,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [addr],
          },
          {
            address: CONTRACTS.DEPOSIT_MANAGER_PROXY as `0x${string}`,
            abi: accStakedAccountAbi,
            functionName: "accStakedAccount",
            args: [addr],
          },
          {
            address: CONTRACTS.DEPOSIT_MANAGER_PROXY as `0x${string}`,
            abi: accStakedAccountAbi,
            functionName: "pendingUnstakedAccount",
            args: [addr],
          },
        ],
      });
      const tonBal =
        results[0].status === "success" ? (results[0].result as bigint) : BigInt(0);
      const stakedBal =
        results[1].status === "success" ? (results[1].result as bigint) : BigInt(0);
      const pendingBal =
        results[2].status === "success" ? (results[2].result as bigint) : BigInt(0);
      const netStaked = stakedBal > pendingBal ? stakedBal - pendingBal : BigInt(0);
      setTon(Number(formatUnits(tonBal, 18)));
      setStaked(Number(formatUnits(netStaked, 27)));
    } catch (e) {
      console.error("Failed to fetch hub balances:", e);
    }
    setLoading(false);
  }, [balanceAddress]);

  useEffect(() => {
    if (balanceAddress) fetchBalances();
  }, [balanceAddress, fetchBalances]);

  if (!preview && (!ready || !authenticated)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">{t.dashboard.loading}</div>
      </div>
    );
  }

  const addr = balanceAddress || "";
  const shortAddr = addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";
  const googleAccount = user?.linkedAccounts?.find(
    (a) => a.type === "google_oauth"
  );
  const emailAccount = user?.linkedAccounts?.find((a) => a.type === "email");
  const displayName =
    (googleAccount as { name?: string })?.name ||
    (emailAccount as { address?: string })?.address ||
    shortAddr ||
    "User";

  const tonNum = ton ?? 0;
  const stakedNum = staked ?? 0;
  const total = tonNum + stakedNum;
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { maximumFractionDigits: 2 });

  // Rotating notice/event banner content (tied to real features).
  const notices = [t.hub.noticeLottery, t.hub.noticePrivate, t.hub.noticeAi];

  // "Your journey" progress — derived from real on-chain/account state.
  const journey = [
    { done: true, label: t.hub.journeyWallet },
    { done: tonNum > 0, label: t.hub.journeyTon },
    { done: stakedNum > 0, label: t.hub.journeyStake },
    { done: hasKey, label: t.hub.journeyAi },
  ];
  const journeyDoneCount = journey.filter((s) => s.done).length;
  const journeyNext = journey.find((s) => !s.done);
  const journeyPct = Math.round((journeyDoneCount / journey.length) * 100);
  const aiUsagePct =
    aiUsage?.maxBudget != null && aiUsage.maxBudget > 0
      ? Math.min(100, Math.round((aiUsage.spend / aiUsage.maxBudget) * 100))
      : null;
  const aiUsageReset = aiUsage?.resetAt
    ? new Date(aiUsage.resetAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  // Lightweight transient toast for coming-soon menus.
  const ping = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1800);
  };

  // Greeting reflects staking state (Duolingo emotion-to-state mapping).
  let dialogue = t.hub.greetingNew.replace("{name}", displayName);
  if (stakedNum > 0) {
    dialogue = t.hub.greetingStaked.replace("{name}", displayName);
  } else if (tonNum > 0) {
    dialogue = t.hub.greetingHasTon.replace("{name}", displayName);
  }

  // ── Right-side MENU collage cards ──────────────────────────────────────────
  const eligible = stakedNum >= MIN_TON_AI_ACCESS;
  const needed = Math.max(0, MIN_TON_AI_ACCESS - stakedNum);
  // Nothing staked yet → spotlight the Staking tile as the obvious first step.
  const noStake = stakedNum <= 0;

  // AI Access always opens the dedicated /agent page, which owns every state
  // (stake-gated quest → key issuance → "chat with Toki"). The tile just mirrors
  // the current state in its badge/subtitle; "locked" only dims the art.
  const aiCard: Card = {
    key: "ai",
    title: t.hub.aiAccessTitle,
    img: "/characters/menu-ai.png",
    href: "/agent",
    locked: !hasKey && !eligible,
    sub: hasKey
      ? aiUsagePct != null
        ? t.hub.aiUsage.replace("{pct}", String(aiUsagePct))
        : t.hub.aiAccessChatReady
      : eligible
        ? t.hub.aiAccessBadge
        : loading
          ? t.hub.aiAccessChecking
          : `+${fmt(needed)} TON`,
    badge:
      hasKey || eligible
        ? { kind: "live", text: "AI" }
        : { kind: "new", text: "LOCK" },
    style: {
      left: "30%",
      top: "48%",
      width: "31.45%",
      height: "29.6%",
      clipPath: "polygon(4.9% 0,100% 0,95.4% 91.9%,0 100%)",
    },
  };

  const cards: Card[] = [
    {
      key: "wallet",
      title: t.hub.myWallet,
      sub: t.hub.cardWalletSub,
      img: "/toki-bag-full.png",
      href: "/wallet",
      style: { left: "0", top: "0", width: "34%", height: "48%", clipPath: "polygon(0 0,100% 0,92.7% 100%,0 100%)" },
    },
    {
      key: "private",
      title: t.hub.appPrivateTransfer,
      sub: t.hub.cardPrivateSub,
      img: "/characters/toki-menu-private.png",
      // in development — block navigation, show a coming-soon toast instead
      onClick: () => ping(`${t.hub.appPrivateTransfer} — ${t.hub.comingSoonToast}`),
      badge: { kind: "soon", text: "SOON" },
      style: { left: "31.53%", top: "0", width: "32.47%", height: "48%", clipPath: "polygon(7.6% 0,100% 0,92.1% 100%,0 100%)" },
    },
    {
      key: "staking",
      title: t.hub.appStaking,
      sub: t.hub.cardStakingSub,
      img: "/characters/toki-menu-staking.png",
      imgStyle: { objectFit: "contain", objectPosition: "center bottom", transform: "scale(1.6)", transformOrigin: "center bottom" },
      href: "/staking",
      feat: true,
      spotlight: noStake,
      badge: noStake ? { kind: "hot", text: t.hub.startHere } : { kind: "live", text: "LIVE" },
      style: { left: "60%", top: "0", width: "40%", height: "75.2%", clipPath: "polygon(10% 0,100% 0,100% 95.7%,0 100%)" },
    },
    {
      key: "lottery",
      title: t.hub.cardLottery,
      sub: t.hub.cardLotterySub,
      img: "/characters/toki-menu-lottery.png",
      href: "/lottery",
      badge: { kind: "hot", text: t.hub.badgeLive },
      style: { left: "0", top: "48%", width: "31.53%", height: "32%", clipPath: "polygon(0 0,100% 0,95.1% 92.5%,0 100%)" },
    },
    aiCard,
    {
      key: "extension",
      title: t.hub.cardExtension,
      sub: t.hub.cardExtensionSub,
      img: "/toki-logo.png",
      imgStyle: { objectFit: "contain" },
      href: TOKI_EXTENSION_URL,
      external: true,
      badge: { kind: "new", text: "NEW" },
      style: { left: "0", top: "72%", width: "100%", height: "28%", clipPath: "polygon(0 28.6%,100% 0,100% 100%,0 100%)" },
    },
  ];

  const renderPiece = (c: Card) => {
    const cls = `piece${c.feat ? " feat" : ""}${c.spotlight ? " spotlight" : ""}${c.locked ? " locked" : ""}`;
    const inner = (
      <>
        <img className="art" src={c.img} alt="" style={c.imgStyle} />
        <div className="scrim" />
        {c.badge && <span className={`badge ${c.badge.kind}`}>{c.badge.text}</span>}
        <div className="lbl">
          <b>{c.title}</b>
          <em>{c.sub}</em>
        </div>
      </>
    );
    if (c.onClick) {
      return (
        <button key={c.key} type="button" className={cls} style={c.style} onClick={c.onClick}>
          {inner}
        </button>
      );
    }
    if (c.external) {
      return (
        <a key={c.key} className={cls} style={c.style} href={c.href} target="_blank" rel="noopener noreferrer">
          {inner}
        </a>
      );
    }
    return (
      <Link
        key={c.key}
        className={cls}
        style={c.style}
        href={c.href ?? "#"}
        onClick={(e) => {
          // Let modifier-clicks open a new tab; otherwise play the menu's
          // signature game transition instead of an instant route swap.
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          e.preventDefault();
          navigate(c.href ?? "/", c.key);
        }}
      >
        {inner}
      </Link>
    );
  };

  return (
    <div className="relative min-h-screen bg-grid flex flex-col overflow-hidden">
      <Header />

      {showReceive && addr && (
        <ReceiveModal address={addr} onClose={() => setShowReceive(false)} />
      )}
      <main className="relative flex-1 overflow-x-hidden overflow-y-auto lg:overflow-hidden">
        <HubBackground />

        <div className="tk-lobby">
          <style>{lobbyCss}</style>

          {/* Left column: rotating notice + journey progress + balance + meta menus */}
          <div className="hud-left">
            {/* Rotating notice / event banner */}
            <div className="notice">
              <span className="ndot" />
              <p key={noticeIdx}>{notices[noticeIdx]}</p>
              <span className="ndots">
                {notices.map((_, i) => (
                  <i key={i} className={i === noticeIdx ? "on" : ""} />
                ))}
              </span>
            </div>

            {/* "Your journey" progress */}
            <div className="prog">
              <div className="prow">
                <b>{t.hub.journeyTitle}</b>
                <span>
                  {journeyDoneCount}/{journey.length}
                </span>
              </div>
              <div className="pbar">
                <i style={{ width: `${journeyPct}%` }} />
              </div>
              <div className="pnext">
                {journeyNext
                  ? `${t.hub.journeyNext} · ${journeyNext.label}`
                  : t.hub.journeyDone}
              </div>
            </div>

            {/* Balance chip */}
            <div className="chip">
              <div className="text-[10px] uppercase tracking-wide text-gray-300">
                {t.hub.totalAssets}
              </div>
              <div className="text-xl font-bold text-white leading-tight">
                {loading ? "…" : fmt(total)}{" "}
                <span className="text-sm font-normal text-accent-cyan">TON</span>
              </div>
              <div className="text-[10px] text-gray-300 mt-0.5">
                {t.hub.staked}{" "}
                <span className="text-accent-gold">{fmt(stakedNum)}</span>
                {" · "}
                {t.hub.idle}{" "}
                <span className="text-accent-cyan">{fmt(tonNum)}</span>
              </div>
              <div className="flex gap-2 mt-1.5">
                <button
                  onClick={() => setShowReceive(true)}
                  className="px-2.5 py-1 rounded-lg bg-accent-cyan/15 border border-accent-cyan/30 text-[11px] font-medium text-accent-cyan hover:bg-accent-cyan/25 transition-colors"
                >
                  {t.hub.receive}
                </button>
                <Link
                  href="/wallet"
                  className="px-2.5 py-1 rounded-lg bg-white/10 text-[11px] font-medium text-gray-200 hover:bg-white/15 transition-colors"
                >
                  {t.hub.openWallet} →
                </Link>
              </div>
            </div>

            {/* AI Access usage — daily budget */}
            {hasKey && aiUsagePct != null && aiUsage?.maxBudget != null && (
              <div className="chip">
                <div className="aiu-head">
                  <span className="text-[10px] uppercase tracking-wide text-gray-300">
                    {t.hub.aiUsageTitle}
                  </span>
                  <span className="text-[11px] font-bold text-white">{aiUsagePct}%</span>
                </div>
                <div className="aiu-bar">
                  <i style={{ width: `${Math.max(2, aiUsagePct)}%` }} />
                </div>
                <div className="text-[10px] text-gray-300 mt-1">
                  {`$${aiUsage.spend.toFixed(3)} / $${aiUsage.maxBudget.toFixed(2)}${aiUsageReset ? " · " + t.hub.aiUsageReset.replace("{time}", aiUsageReset) : ""}`}
                </div>
              </div>
            )}

            {/* Meta menu tabs (coming soon) */}
            <button
              type="button"
              className="ltab"
              onClick={() => ping(`${t.hub.navQuests} — ${t.hub.comingSoonToast}`)}
            >
              <span className="lt-ic">🗒️</span>
              <span className="lt-tx">
                <b>{t.hub.navQuests}</b>
                <em>{t.hub.badgeSoon}</em>
              </span>
              <span className="lt-dot" />
            </button>
            <button
              type="button"
              className="ltab"
              onClick={() => ping(`${t.hub.navDaily} — ${t.hub.comingSoonToast}`)}
            >
              <span className="lt-ic">📅</span>
              <span className="lt-tx">
                <b>{t.hub.navDaily}</b>
                <em>{t.hub.badgeSoon}</em>
              </span>
              <span className="lt-dot" />
            </button>
          </div>

          {toast && <div className="tk-toast">{toast}</div>}

          {/* Centered-left full-body Toki */}
          <img className="char" src="/characters/toki-fullbody-upper.png" alt="Toki" />

          {/* Dialogue under the character */}
          <div className="dlg">
            <span className="nm">Toki</span>
            <p>{dialogue}</p>
          </div>

          {/* Right-side MENU collage */}
          <div className="menu">
            <div className="menuTag">MENU</div>
            <div className="collage">{cards.map(renderPiece)}</div>
          </div>
        </div>
      </main>

      <HubFooter />
    </div>
  );
}

const lobbyCss = `
.tk-lobby{position:absolute;top:64px;left:0;right:0;bottom:0;z-index:10}
/* Upper-body close-up (waist-up) sprite — size by width so the wider crop never
   overflows / overlaps the right-side MENU, bottom-anchored so the waist sits at
   the viewport bottom. (Full-body variant used height:97%.) */
.tk-lobby .char{position:absolute;left:34%;bottom:-22px;transform:translateX(-50%);width:clamp(300px,34vw,580px);height:auto;max-height:96%;z-index:6;pointer-events:none;user-select:none;animation:tkFloat 5.5s ease-in-out infinite}
@keyframes tkFloat{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-1.1%)}}
.tk-lobby .dlg{position:absolute;left:34%;bottom:26px;transform:translateX(-50%);z-index:22;width:min(600px,44vw);background:rgba(6,18,30,.76);backdrop-filter:blur(16px);border:1px solid rgba(34,211,238,.32);border-radius:20px;padding:17px 28px;box-shadow:0 16px 48px rgba(0,0,0,.55)}
.tk-lobby .dlg .nm{display:inline-block;font-size:13px;font-weight:800;color:#22d3ee;background:rgba(34,211,238,.12);border:1px solid rgba(34,211,238,.35);border-radius:999px;padding:3px 13px;margin-bottom:9px}
.tk-lobby .dlg p{margin:0;font-size:17px;line-height:1.6;color:#f1f5f9}
.tk-lobby .hud-left{position:absolute;left:18px;top:14px;z-index:20;width:236px;display:flex;flex-direction:column;gap:10px}
.tk-lobby .aiu-head{display:flex;align-items:center;justify-content:space-between}
.tk-lobby .aiu-bar{height:6px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden;margin-top:5px}
.tk-lobby .aiu-bar i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#22d3ee,#f59e0b)}
.tk-lobby .notice{position:relative;display:flex;align-items:center;gap:8px;background:rgba(8,24,38,.62);backdrop-filter:blur(10px);border:1px solid rgba(34,211,238,.28);border-left:3px solid #22d3ee;border-radius:12px;padding:9px 12px;box-shadow:0 8px 24px rgba(0,0,0,.4);overflow:hidden}
.tk-lobby .notice .ndot{flex:none;width:7px;height:7px;border-radius:50%;background:#22d3ee;box-shadow:0 0 8px #22d3ee;animation:tkPulse 1.6s ease-in-out infinite}
@keyframes tkPulse{0%,100%{opacity:.4}50%{opacity:1}}
.tk-lobby .notice p{margin:0;flex:1;font-size:11.5px;line-height:1.35;color:#eaf6fb;padding-right:18px;animation:tkFade .5s ease}
@keyframes tkFade{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}
.tk-lobby .notice .ndots{position:absolute;right:9px;bottom:6px;display:flex;gap:3px}
.tk-lobby .notice .ndots i{width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,.3)}
.tk-lobby .notice .ndots i.on{background:#22d3ee}
.tk-lobby .prog{background:rgba(8,24,38,.62);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:10px 12px;box-shadow:0 8px 24px rgba(0,0,0,.4)}
.tk-lobby .prog .prow{display:flex;justify-content:space-between;align-items:baseline}
.tk-lobby .prog .prow b{font-size:12px;font-weight:800;color:#fff}
.tk-lobby .prog .prow span{font-size:11px;font-weight:700;color:#22d3ee}
.tk-lobby .prog .pbar{margin:7px 0 5px;height:7px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden}
.tk-lobby .prog .pbar i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#22d3ee,#f59e0b);transition:width .5s ease}
.tk-lobby .prog .pnext{font-size:10px;color:#9fd9e8}
.tk-lobby .chip{background:rgba(8,16,24,.62);backdrop-filter:blur(10px);border:1px solid rgba(34,211,238,.22);border-radius:14px;padding:11px 14px;box-shadow:0 8px 28px rgba(0,0,0,.4)}
.tk-lobby .ltab{display:flex;align-items:center;gap:10px;width:100%;text-align:left;cursor:pointer;background:linear-gradient(100deg,rgba(8,30,48,.82),rgba(8,30,48,.42));border:1px solid rgba(34,211,238,.22);border-left:3px solid #22d3ee;border-radius:10px;padding:9px 12px;color:#eaf6fb;font:inherit;transform:perspective(820px) rotateY(13deg);transform-origin:left center;box-shadow:10px 10px 26px rgba(0,0,0,.4);transition:transform .2s,filter .2s}
.tk-lobby .ltab:hover{transform:perspective(820px) rotateY(7deg) translateX(3px);filter:brightness(1.12)}
.tk-lobby .ltab .lt-ic{font-size:18px;flex:none}
.tk-lobby .ltab .lt-tx{flex:1;line-height:1.2}
.tk-lobby .ltab .lt-tx b{display:block;font-size:13px;font-weight:800}
.tk-lobby .ltab .lt-tx em{font-style:normal;font-size:10px;color:#9fd9e8}
.tk-lobby .ltab .lt-dot{flex:none;width:8px;height:8px;border-radius:50%;background:#ef4444;box-shadow:0 0 7px rgba(239,68,68,.7)}
.tk-lobby .tk-toast{position:fixed;left:50%;bottom:96px;transform:translateX(-50%);z-index:60;background:rgba(6,18,30,.92);border:1px solid rgba(34,211,238,.4);color:#eaf6fb;font-size:13px;font-weight:600;padding:10px 18px;border-radius:999px;box-shadow:0 12px 40px rgba(0,0,0,.5);animation:tkFade .25s ease}
.tk-lobby .menu{position:absolute;right:1.8vw;top:50%;z-index:18;width:46vw;height:74vh;transform:translateY(-50%) perspective(1700px) rotateY(-13deg);transform-origin:right center;background:rgba(255,255,255,.24);backdrop-filter:blur(9px);border:2px solid rgba(255,255,255,.55);border-radius:20px;padding:10px;box-shadow:0 22px 60px rgba(0,0,0,.42)}
.tk-lobby .menuTag{position:absolute;top:12px;left:20px;z-index:5;font-size:clamp(13px,1.2vw,20px);font-weight:900;letter-spacing:5px;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.6)}
.tk-lobby .collage{position:relative;width:100%;height:100%}
.tk-lobby .piece{position:absolute;overflow:hidden;cursor:pointer;display:block;text-decoration:none;color:inherit;border:0;background:none;padding:0;text-align:left;font:inherit;appearance:none;transform:scale(.984);transition:transform .2s,filter .2s}
.tk-lobby .piece .art{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center top}
.tk-lobby .piece .scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(4,12,20,.02) 32%,rgba(4,12,20,.9))}
.tk-lobby .piece .lbl{position:absolute;left:clamp(10px,0.9vw,16px);bottom:clamp(10px,1.3vh,18px);z-index:2}
.tk-lobby .piece .lbl b{display:block;font-size:clamp(14px,1.4vw,26px);font-weight:800;color:#fff;text-shadow:0 1px 6px rgba(0,0,0,.95)}
.tk-lobby .piece .lbl em{font-style:normal;font-size:clamp(10px,0.9vw,15px);color:#cfeef7;text-shadow:0 1px 5px rgba(0,0,0,.95)}
.tk-lobby .piece .badge{position:absolute;top:10px;right:14px;z-index:2;font-size:clamp(9px,0.78vw,12px);font-weight:800;padding:3px 9px;border-radius:999px;color:#04141d}
.tk-lobby .piece .badge.live{background:#22d3ee}
.tk-lobby .piece .badge.new{background:#a78bfa;color:#fff}
.tk-lobby .piece .badge.hot{background:#f59e0b}
.tk-lobby .piece .badge.soon{background:#ffc24b;color:#3a2a04}
.tk-lobby .piece:hover{transform:scale(1.012);filter:brightness(1.08);z-index:4}
.tk-lobby .piece.locked{filter:grayscale(.45) brightness(.78)}
.tk-lobby .piece.feat .lbl b{font-size:clamp(20px,2.2vw,40px)}
.tk-lobby .piece.feat .lbl em{font-size:clamp(12px,1.1vw,18px)}
.tk-lobby .piece.spotlight{z-index:5;animation:tkSpot 1.7s ease-in-out infinite}
@keyframes tkSpot{0%,100%{filter:drop-shadow(0 0 6px rgba(34,211,238,.5))}50%{filter:drop-shadow(0 0 20px rgba(34,211,238,.95))}}
@media (prefers-reduced-motion:reduce){.tk-lobby .piece.spotlight{animation:none;filter:drop-shadow(0 0 12px rgba(34,211,238,.7))}}
@media (max-width:1023px){
  .tk-lobby{position:static;top:auto;left:auto;right:auto;bottom:auto;display:flex;flex-direction:column;align-items:center;gap:14px;height:auto;padding:76px 12px 28px}
  .tk-lobby .hud-left{position:static;width:100%;max-width:520px;margin:0 auto}
  .tk-lobby .ltab{transform:none}
  .tk-lobby .ltab:hover{transform:translateX(3px)}
  .tk-lobby .char{position:relative;left:auto;bottom:auto;transform:none;height:auto;width:auto;max-height:40vh;animation:none}
  .tk-lobby .dlg{position:relative;left:auto;bottom:auto;transform:none;width:100%;max-width:560px}
  .tk-lobby .menu{position:relative;right:auto;top:auto;transform:none;width:100%;max-width:560px;height:auto;aspect-ratio:1/1}
}
`;
