/* eslint-disable @next/next/no-img-element */
"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createWalletClient, custom, formatUnits, parseUnits } from "viem";
import ReceiveModal from "@/components/dashboard/ReceiveModal";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { chain, publicClient as client } from "@/lib/chain";
import { CONTRACTS, WTON_DECIMALS } from "@/constants/contracts";
import { wtonTokenAbi } from "@/lib/abi";

// ─── Constants ───────────────────────────────────────────────────────

const erc20Abi = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

type Venue = { name: string; url: string; hint?: string };

// Tokamak Network trades under the ticker "TOKAMAK" on exchanges (NOT "TON" —
// that's Toncoin, an unrelated token). Each URL deep-links straight to the
// TOKAMAK market so the right pair is pre-selected (trade_url's confirmed via
// CoinGecko coins/tokamak-network/tickers, which maps each to tokamak-network).
// Both lists are ordered by 24h market size (CoinGecko converted USD volume),
// largest first.
const CEX_KOREAN: Venue[] = [
  { name: "Upbit", url: "https://upbit.com/exchange?code=CRIX.UPBIT.KRW-TOKAMAK", hint: "KRW" },
  { name: "Bithumb", url: "https://www.bithumb.com/react/trade/order/TOKAMAK-KRW", hint: "KRW" },
  { name: "Coinone", url: "https://coinone.co.kr/exchange/trade/tokamak/krw", hint: "KRW" },
  { name: "GOPAX", url: "https://www.gopax.co.kr/exchange?market=TOKAMAK-KRW", hint: "KRW" },
];
const CEX_GLOBAL: Venue[] = [
  { name: "WEEX", url: "https://www.weex.com/spot/TOKAMAK-USDT", hint: "USDT" },
  { name: "XT.COM", url: "https://www.xt.com/en/trade/tokamak_usdt", hint: "USDT" },
  { name: "Upbit Indonesia", url: "https://id.upbit.com/exchange?code=CRIX.UPBIT.IDR-TOKAMAK", hint: "IDR" },
  { name: "DigiFinex", url: "https://www.digifinex.com/en-ww/trade/USDT/TOKAMAK", hint: "USDT" },
  { name: "Poloniex", url: "https://poloniex.com/trade/TOKAMAK_USDT?type=spot", hint: "USDT" },
];
const WTON_GUIDE = "https://docs.tokamak.network/home/information/ton-wton";

// Pay-with options for the Uniswap deep-link ("ETH" = native sentinel).
const PAY_TOKENS = [
  { sym: "ETH", id: "ETH" },
  { sym: "USDC", id: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
  { sym: "USDT", id: "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
] as const;
const UNISWAP_WTON = "0xc4A11aaf6ea915Ed7Ac194161d2fC9384F15bff2";
function buildUniswapUrl(inputId: string, amount: string): string {
  const p = new URLSearchParams({
    inputCurrency: inputId,
    outputCurrency: UNISWAP_WTON,
    chain: "mainnet",
    field: "input",
  });
  if (amount && Number(amount) > 0) p.set("value", amount);
  return `https://app.uniswap.org/swap?${p.toString()}`;
}
const EXPLORER = chain.blockExplorers?.default?.url ?? "https://etherscan.io";

// ─── VN scaffolding (cloned from the staking page) ───────────────────

type Mood = "welcome" | "explain" | "excited" | "wink";
const MOOD_IMAGES: Record<Mood, string> = {
  welcome: "/characters/toki-welcome.png",
  explain: "/characters/toki-explain.png",
  excited: "/characters/toki-excited.png",
  wink: "/characters/toki-wink.png",
};
const MOOD_GLOW: Record<Mood, string> = {
  welcome: "rgba(74, 144, 217, 0.35)",
  explain: "rgba(96, 165, 250, 0.35)",
  excited: "rgba(245, 158, 11, 0.45)",
  wink: "rgba(236, 72, 153, 0.35)",
};

function useTypewriter(text: string, speed = 30) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  const skip = useCallback(() => {
    setDisplayed(text);
    setDone(true);
  }, [text]);
  return { displayed, done, skip };
}

function TokiCharacter({ mood }: { mood: Mood }) {
  const imageSrc = MOOD_IMAGES[mood];
  const [prevSrc, setPrevSrc] = useState(imageSrc);
  const [transitioning, setTransitioning] = useState(false);
  useEffect(() => {
    if (imageSrc !== prevSrc) {
      setTransitioning(true);
      const timer = setTimeout(() => {
        setPrevSrc(imageSrc);
        setTransitioning(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [imageSrc, prevSrc]);
  const glowColor = MOOD_GLOW[mood];
  return (
    <div className="flex justify-center z-10">
      <div className="relative w-64 sm:w-80 md:w-96 lg:w-[28rem] aspect-[3/4] overflow-visible">
        <div
          className="absolute inset-[15%] bottom-0 rounded-full blur-3xl -z-10 animate-glow-pulse transition-colors duration-700 opacity-40"
          style={{ backgroundColor: glowColor }}
        />
        <Image
          src={transitioning ? prevSrc : imageSrc}
          alt="Toki"
          width={512}
          height={512}
          className={`relative z-10 drop-shadow-2xl transition-opacity duration-200 w-full h-full object-contain object-bottom ${
            transitioning ? "opacity-0" : "opacity-100"
          }`}
          priority
        />
      </div>
    </div>
  );
}

function DialogueBar({ text, mood }: { text: string; mood: Mood }) {
  const { displayed, done, skip } = useTypewriter(text, 28);
  return (
    <div className="cursor-pointer select-none w-full" onClick={() => !done && skip()}>
      <div className="bg-black/70 backdrop-blur-xl border-t border-white/10 rounded-t-2xl px-6 py-5 sm:px-8 sm:py-6 h-[160px] sm:h-[176px] flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-cyan/10 border border-accent-cyan/30">
            <span className="text-accent-cyan font-bold text-sm tracking-wide">Toki</span>
            <span className="text-xs text-accent-cyan/60">{mood}</span>
          </div>
        </div>
        <p className="text-gray-100 text-base sm:text-lg leading-relaxed flex-1">
          {displayed}
          {!done && (
            <span className="inline-block w-0.5 h-5 bg-accent-cyan ml-0.5 animate-pulse align-middle" />
          )}
        </p>
      </div>
    </div>
  );
}

/** A single exchange row → opens in a new tab. */
function VenueRow({ name, url, hint }: Venue) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2 py-3 text-center transition-colors hover:border-accent-cyan/40 hover:bg-white/[0.08]"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-cyan/12 text-sm font-bold text-accent-cyan">
        {name.slice(0, 1)}
      </span>
      <span className="text-xs font-semibold text-white leading-tight">{name}</span>
      {hint && <span className="text-[10px] text-gray-400">{hint}</span>}
    </a>
  );
}

type Route = "cex" | "dex";

// ─── Main ────────────────────────────────────────────────────────────

/**
 * "Get TON" — reuses the staking page's visual-novel frame (full-bleed scene,
 * left Toki character, bottom dialogue bar, right max-w-sm panel). Only the panel
 * content changes: a 2-route menu (CEX / DEX). Hovering a route makes Toki explain
 * it; clicking opens that route's actions (exchange links, or swap-deep-link +
 * native WTON→TON unwrap).
 */
export default function GetTonView() {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const { t } = useTranslation();

  const [ton, setTon] = useState<number | null>(null);
  const [wton, setWton] = useState<bigint>(BigInt(0));
  const [loading, setLoading] = useState(true);
  const [showReceive, setShowReceive] = useState(false);
  const [copied, setCopied] = useState(false);

  const [hoverRoute, setHoverRoute] = useState<Route | null>(null);
  const [activeRoute, setActiveRoute] = useState<Route | null>(null);

  // DEX forms
  const [payToken, setPayToken] = useState<string>(PAY_TOKENS[0].id);
  const [payAmount, setPayAmount] = useState("");
  const [unwrapAmount, setUnwrapAmount] = useState("");
  const [unwrapState, setUnwrapState] = useState<"idle" | "signing" | "pending" | "success" | "error">("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
  const externalWallet = wallets.find((w) => w.walletClientType !== "privy");
  const hasLinkedExternalWallet = user?.linkedAccounts?.some((a) => a.type === "wallet");
  const primaryWallet = (hasLinkedExternalWallet && externalWallet) || embeddedWallet;
  const addr = primaryWallet?.address ?? "";

  const fetchBalance = useCallback(async () => {
    if (!addr) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const a = addr as `0x${string}`;
      const [tonRes, wtonRes] = await client.multicall({
        contracts: [
          { address: CONTRACTS.TON as `0x${string}`, abi: erc20Abi, functionName: "balanceOf", args: [a] },
          { address: CONTRACTS.WTON as `0x${string}`, abi: wtonTokenAbi, functionName: "balanceOf", args: [a] },
        ],
      });
      setTon(Number(formatUnits(tonRes.status === "success" ? (tonRes.result as bigint) : BigInt(0), 18)));
      setWton(wtonRes.status === "success" ? (wtonRes.result as bigint) : BigInt(0));
    } catch (e) {
      console.error("Failed to fetch balances:", e);
    }
    setLoading(false);
  }, [addr]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const tonNum = ton ?? 0;
  const wtonNum = Number(formatUnits(wton, WTON_DECIMALS));
  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

  // Toki reacts to the focused route (hover, or the open overlay).
  const focus = activeRoute ?? hoverRoute;
  const mood: Mood = focus === "cex" ? "explain" : focus === "dex" ? "excited" : "welcome";
  const dialogue = focus === "cex" ? t.getTon.dlgCex : focus === "dex" ? t.getTon.dlgDex : t.getTon.dlgBase;

  // Unwrap math (RAY, 27 dp).
  let unwrapRay = BigInt(0);
  try {
    if (unwrapAmount && Number(unwrapAmount) > 0) unwrapRay = parseUnits(unwrapAmount, WTON_DECIMALS);
  } catch {
    /* invalid input */
  }
  const unwrapInsufficient = unwrapRay > wton;
  const unwrapValid = unwrapRay > BigInt(0) && unwrapRay <= wton;
  const busy = unwrapState === "signing" || unwrapState === "pending";

  const copyContract = async () => {
    try {
      await navigator.clipboard.writeText(CONTRACTS.TON);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  const handleUnwrap = async () => {
    if (!primaryWallet || !addr || !unwrapValid) return;
    setUnwrapState("signing");
    setTxHash(null);
    try {
      const provider = await primaryWallet.getEthereumProvider();
      const walletClient = createWalletClient({ chain, transport: custom(provider), account: addr as `0x${string}` });
      const hash = await walletClient.writeContract({
        address: CONTRACTS.WTON as `0x${string}`,
        abi: wtonTokenAbi,
        functionName: "swapToTON",
        args: [unwrapRay],
        chain,
      });
      setTxHash(hash);
      setUnwrapState("pending");
      await client.waitForTransactionReceipt({ hash });
      setUnwrapState("success");
      setUnwrapAmount("");
      fetchBalance();
    } catch (e) {
      console.error("Unwrap failed:", e);
      setUnwrapState("error");
    }
  };

  const closeOverlay = () => {
    setActiveRoute(null);
    setUnwrapState("idle");
  };

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/backgrounds/staking-dawn.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

      {/* Back to hub */}
      <Link
        href="/dashboard"
        className="absolute left-4 top-20 z-30 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-gray-300 backdrop-blur-md transition-colors hover:text-accent-cyan"
      >
        ← {t.getTon.back}
      </Link>

      {showReceive && addr && <ReceiveModal address={addr} onClose={() => setShowReceive(false)} />}

      {/* Middle area: Character left + Menu panel right */}
      <div className="absolute inset-x-0 top-16 bottom-[176px] z-10 flex items-center justify-center">
        <div className="max-w-3xl w-full mx-auto flex items-end h-full">
          {/* Left: Toki Character (hidden on mobile) */}
          <div className="hidden md:flex w-[40%] items-end justify-center">
            <TokiCharacter mood={mood} />
          </div>

          {/* Right: GET TON menu panel */}
          <div className="w-full md:w-[60%] flex items-end justify-center pb-4 px-4 md:px-0">
            <div className="w-full max-w-sm animate-slide-up">
              <div className="bg-black/50 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-[0_0_40px_rgba(0,0,0,0.3)]">
                {/* balance + receive */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-gray-400">{t.getTon.balanceLabel}</div>
                    <div className="text-xl font-bold text-white leading-tight">
                      {loading ? "…" : fmt(tonNum)} <span className="text-sm font-normal text-accent-cyan">TON</span>
                    </div>
                  </div>
                  {addr && (
                    <button
                      onClick={() => setShowReceive(true)}
                      className="rounded-lg border border-accent-cyan/30 bg-accent-cyan/15 px-3 py-1.5 text-xs font-medium text-accent-cyan transition-colors hover:bg-accent-cyan/25"
                    >
                      {t.getTon.receive}
                    </button>
                  )}
                </div>

                <div className="text-[11px] font-bold tracking-[0.3em] text-gray-400 mb-3">GET TON</div>

                {/* menu cards */}
                <button
                  type="button"
                  onMouseEnter={() => setHoverRoute("cex")}
                  onMouseLeave={() => setHoverRoute(null)}
                  onClick={() => setActiveRoute("cex")}
                  className="group mb-2.5 flex w-full items-center gap-3 rounded-xl border border-white/12 bg-white/[0.04] p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-accent-amber/50 hover:bg-white/[0.07]"
                >
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-amber-400/15 text-2xl">🏦</span>
                  <span className="flex-1 min-w-0">
                    <span className="mb-1 inline-block rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-extrabold tracking-wide text-[#05080f]">
                      CEX · {t.getTon.cexTag}
                    </span>
                    <span className="block text-[15px] font-bold text-white">{t.getTon.cexTitle}</span>
                    <span className="block text-[11px] text-gray-400">{t.getTon.cexCardSub}</span>
                  </span>
                  <span className="flex-none text-gray-500 transition-colors group-hover:text-accent-amber">›</span>
                </button>

                <button
                  type="button"
                  onMouseEnter={() => setHoverRoute("dex")}
                  onMouseLeave={() => setHoverRoute(null)}
                  onClick={() => setActiveRoute("dex")}
                  className="group flex w-full items-center gap-3 rounded-xl border border-white/12 bg-white/[0.04] p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-accent-cyan/50 hover:bg-white/[0.07]"
                >
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-accent-cyan/15 text-2xl">🔄</span>
                  <span className="flex-1 min-w-0">
                    <span className="mb-1 inline-block rounded-full bg-accent-cyan px-2 py-0.5 text-[9px] font-extrabold tracking-wide text-[#05080f]">
                      {t.getTon.dexTag}
                    </span>
                    <span className="block text-[15px] font-bold text-white">{t.getTon.dexTitle}</span>
                    <span className="block text-[11px] text-gray-400">{t.getTon.dexCardSub}</span>
                  </span>
                  <span className="flex-none text-gray-500 transition-colors group-hover:text-accent-cyan">›</span>
                </button>

                {/* contract */}
                <button
                  onClick={copyContract}
                  className="mt-3 flex w-full items-center justify-between rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-left"
                >
                  <span className="min-w-0">
                    <span className="block text-[9px] uppercase tracking-wide text-gray-500">{t.getTon.contractLabel}</span>
                    <span className="block truncate font-mono text-[11px] text-gray-400">{CONTRACTS.TON}</span>
                  </span>
                  <span className="flex-none text-[11px] font-medium text-accent-cyan">
                    {copied ? t.getTon.copied : t.getTon.copy}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Dialogue bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="max-w-3xl mx-auto">
          <DialogueBar text={dialogue} mood={mood} />
        </div>
      </div>

      {/* ── Route overlay ─────────────────────────────────────────────── */}
      {activeRoute && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={closeOverlay}
        >
          <div
            className="relative w-full max-w-md max-h-[86vh] overflow-y-auto rounded-2xl border border-accent-cyan/30 bg-[#0a131f]/98 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeOverlay}
              aria-label="close"
              className="absolute right-4 top-4 text-xl leading-none text-gray-500 hover:text-gray-300"
            >
              ×
            </button>

            {activeRoute === "cex" ? (
              <>
                <h3 className="mb-1 text-lg font-bold text-white">{t.getTon.cexTitle}</h3>
                <p className="mb-3 text-sm text-gray-400">{t.getTon.cexDesc}</p>
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-accent-amber/25 bg-accent-amber/10 px-3 py-2 text-[12px] leading-relaxed text-amber-200/90">
                  <span className="mt-px flex-none">⚠️</span>
                  <span>{t.getTon.cexTickerNote}</span>
                </div>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">{t.getTon.cexKorean}</div>
                <div className="grid grid-cols-3 gap-2">
                  {CEX_KOREAN.map((v) => <VenueRow key={v.name} {...v} />)}
                </div>
                <div className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wide text-gray-500">{t.getTon.cexGlobal}</div>
                <div className="grid grid-cols-3 gap-2">
                  {CEX_GLOBAL.map((v) => <VenueRow key={v.name} {...v} />)}
                </div>
                <p className="mt-4 text-[12px] leading-relaxed text-gray-500">{t.getTon.cexWithdrawHint}</p>
              </>
            ) : (
              <>
                <h3 className="mb-1 text-lg font-bold text-white">{t.getTon.dexTitle}</h3>
                <p className="mb-3 text-sm text-gray-400">{t.getTon.dexDesc}</p>
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-accent-amber/25 bg-accent-amber/10 px-3 py-2 text-[12px] leading-relaxed text-amber-200/90">
                  <span className="mt-px flex-none">⚠️</span>
                  <span>
                    {t.getTon.dexWarn}{" "}
                    <a href={WTON_GUIDE} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent-cyan underline-offset-2 hover:underline">
                      {t.getTon.dexWtonGuide} ↗
                    </a>
                  </span>
                </div>

                {/* B — swap to WTON */}
                <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-sm font-bold text-white">{t.getTon.swapBoxTitle}</div>
                  <p className="mb-3 mt-0.5 text-[12px] text-gray-400">{t.getTon.swapBoxDesc}</p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <label className="flex-1">
                      <span className="mb-1 block text-[11px] text-gray-500">{t.getTon.swapPayWith}</span>
                      <select
                        value={payToken}
                        onChange={(e) => setPayToken(e.target.value)}
                        className="w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-white outline-none focus:border-accent-cyan/40"
                      >
                        {PAY_TOKENS.map((tk) => (
                          <option key={tk.sym} value={tk.id} className="bg-[#111a2e]">{tk.sym}</option>
                        ))}
                      </select>
                    </label>
                    <label className="flex-1">
                      <span className="mb-1 block text-[11px] text-gray-500">{t.getTon.swapAmount}</span>
                      <input
                        inputMode="decimal"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                        placeholder="0.0"
                        className="w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-accent-cyan/40"
                      />
                    </label>
                    <a
                      href={buildUniswapUrl(payToken, payAmount)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-none rounded-lg bg-accent-cyan px-4 py-2 text-center text-sm font-semibold text-[#04141d] transition hover:brightness-110"
                    >
                      {t.getTon.swapOpenUniswap} ↗
                    </a>
                  </div>
                  <div className="mt-2 text-right text-[11px] text-gray-500">→ WTON</div>
                </div>

                {/* C — unwrap WTON → TON */}
                <div className="rounded-xl border border-accent-cyan/20 bg-accent-cyan/[0.04] p-4">
                  <div className="text-sm font-bold text-white">{t.getTon.unwrapTitle}</div>
                  <p className="mb-3 mt-0.5 text-[12px] text-gray-400">{t.getTon.unwrapDesc}</p>
                  <div className="mb-2 flex items-baseline justify-between text-[11px]">
                    <span className="text-gray-500">{t.getTon.unwrapBalance}</span>
                    <span className="font-mono text-gray-300">{loading ? "…" : fmt(wtonNum)} WTON</span>
                  </div>
                  <div className="relative">
                    <input
                      inputMode="decimal"
                      value={unwrapAmount}
                      onChange={(e) => {
                        setUnwrapAmount(e.target.value.replace(/[^0-9.]/g, ""));
                        if (unwrapState !== "idle") setUnwrapState("idle");
                      }}
                      placeholder="0.0"
                      className="w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 pr-14 text-sm text-white placeholder-gray-600 outline-none focus:border-accent-cyan/40"
                    />
                    <button
                      type="button"
                      onClick={() => setUnwrapAmount(formatUnits(wton, WTON_DECIMALS))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-accent-cyan hover:bg-white/15"
                    >
                      {t.getTon.unwrapMax}
                    </button>
                  </div>
                  <div className="mb-3 mt-2 flex items-baseline justify-between text-[12px]">
                    <span className="text-gray-500">{t.getTon.unwrapYouGet}</span>
                    <span className="font-mono text-accent-cyan">
                      ≈ {unwrapAmount && Number(unwrapAmount) > 0 ? fmt(Number(unwrapAmount)) : "0"} TON
                    </span>
                  </div>
                  {!addr ? (
                    <div className="rounded-lg bg-white/5 px-3 py-2.5 text-center text-[12px] text-gray-400">{t.getTon.unwrapConnect}</div>
                  ) : (
                    <button
                      onClick={handleUnwrap}
                      disabled={!unwrapValid || busy}
                      className="w-full rounded-lg bg-accent-cyan px-4 py-2.5 text-sm font-semibold text-[#04141d] transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {unwrapState === "signing"
                        ? t.getTon.unwrapSigning
                        : unwrapState === "pending"
                          ? t.getTon.unwrapPending
                          : unwrapInsufficient
                            ? t.getTon.unwrapInsufficient
                            : t.getTon.unwrapCta}
                    </button>
                  )}
                  {unwrapState === "success" && (
                    <div className="mt-2 text-center text-[12px] text-emerald-400">{t.getTon.unwrapSuccess}</div>
                  )}
                  {unwrapState === "error" && (
                    <div className="mt-2 text-center text-[12px] text-red-400">{t.getTon.unwrapError}</div>
                  )}
                  {txHash && (
                    <a
                      href={`${EXPLORER}/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block text-center text-[11px] text-accent-sky hover:underline"
                    >
                      {t.getTon.viewTx} ↗
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
