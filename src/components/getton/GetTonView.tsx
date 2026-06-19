/* eslint-disable @next/next/no-img-element */
"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createWalletClient, custom, formatUnits, parseUnits } from "viem";
import Header from "@/components/layout/Header";
import HubFooter from "@/components/hub/HubFooter";
import ReceiveModal from "@/components/dashboard/ReceiveModal";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { chain, publicClient as client } from "@/lib/chain";
import { CONTRACTS, WTON_DECIMALS } from "@/constants/contracts";
import { wtonTokenAbi } from "@/lib/abi";

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

// Where to buy TON (listed under the TOKAMAK ticker). Korean desks first — that's
// where most of our target users already hold fiat. Source: Tokamak "Get TON" doc.
const CEX_KOREAN: Venue[] = [
  { name: "Upbit", url: "https://upbit.com/exchange?code=CRIX.UPBIT.KRW-TON", hint: "KRW" },
  { name: "Bithumb", url: "https://www.bithumb.com/react/trade/order/TOKAMAK-KRW", hint: "KRW" },
  { name: "Coinone", url: "https://coinone.co.kr/exchange/trade/tokamak/krw", hint: "KRW" },
];
const CEX_GLOBAL: Venue[] = [
  { name: "Poloniex", url: "https://poloniex.com/trade/TOKAMAK_USDT?type=spot", hint: "USDT" },
  { name: "DigiFinex", url: "https://www.digifinex.com/en-ww/trade/USDT/TOKAMAK", hint: "USDT" },
  { name: "Upbit Indonesia", url: "https://id.upbit.com/exchange?code=CRIX.UPBIT.IDR-TON", hint: "IDR" },
];

// Direct DEX links (secondary). Uniswap pools trade WTON, not TON.
const DEXES: Venue[] = [
  { name: "Uniswap", url: "https://app.uniswap.org/#/swap" },
  {
    name: "SushiSwap",
    url: "https://www.sushi.com/earn/eth:0x610468b2c5d1bd72c2093c47a6d2da68037c34e2",
  },
  {
    name: "KLAYswap",
    url: "https://klayswap.com/exchange/pool/detail/0xD30339c1Edb95E69E3B5B98F230D97B12f01D844",
  },
];
const WTON_GUIDE = "https://docs.tokamak.network/home/information/ton-wton";

// Pay-with options for the Uniswap deep-link. "ETH" is the native sentinel; the
// others are their mainnet ERC-20 addresses.
const PAY_TOKENS = [
  { sym: "ETH", id: "ETH" },
  { sym: "USDC", id: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
  { sym: "USDT", id: "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
] as const;

// Uniswap liquidity is on mainnet WTON — deep-link with the pair pre-filled so the
// user lands on Uniswap ready to swap (execution stays on uniswap.org).
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

type UnwrapState = "idle" | "signing" | "pending" | "success" | "error";

/** A single tappable venue row → opens the exchange / DEX in a new tab. */
function VenueRow({ name, url, hint }: Venue) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 transition-colors hover:border-accent-cyan/40 hover:bg-white/[0.08]"
    >
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-accent-cyan/12 text-sm font-bold text-accent-cyan">
        {name.slice(0, 1)}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-white truncate">{name}</span>
        {hint && <span className="block text-[11px] text-gray-400">{hint}</span>}
      </span>
      <span className="flex-none text-gray-500 transition-colors group-hover:text-accent-cyan">
        ↗
      </span>
    </a>
  );
}

/**
 * "Get TON" — two routes to bring TON into the wallet:
 *   1. CEX — buy on an exchange (TOKAMAK ticker), then withdraw to the wallet.
 *   2. DEX — (B) swap to WTON on Uniswap via a pre-filled deep-link, then
 *            (C) unwrap WTON → TON natively here (WTON.swapToTON, no leaving Toki).
 * Shows the live TON balance up top; empties get a "start here" nudge.
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

  // B — swap box
  const [payToken, setPayToken] = useState<string>(PAY_TOKENS[0].id);
  const [payAmount, setPayAmount] = useState("");

  // C — unwrap
  const [unwrapAmount, setUnwrapAmount] = useState("");
  const [unwrapState, setUnwrapState] = useState<UnwrapState>("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
  const externalWallet = wallets.find((w) => w.walletClientType !== "privy");
  const hasLinkedExternalWallet = user?.linkedAccounts?.some(
    (a) => a.type === "wallet"
  );
  const primaryWallet =
    (hasLinkedExternalWallet && externalWallet) || embeddedWallet;
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
      const tonBal = tonRes.status === "success" ? (tonRes.result as bigint) : BigInt(0);
      const wtonBal = wtonRes.status === "success" ? (wtonRes.result as bigint) : BigInt(0);
      setTon(Number(formatUnits(tonBal, 18)));
      setWton(wtonBal);
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
  const noTon = !loading && tonNum <= 0;
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { maximumFractionDigits: 2 });

  // Parse the unwrap amount into RAY (27 dp); guard against malformed input.
  let unwrapRay = BigInt(0);
  try {
    if (unwrapAmount && Number(unwrapAmount) > 0) unwrapRay = parseUnits(unwrapAmount, WTON_DECIMALS);
  } catch {
    /* invalid number — leaves unwrapRay at 0 */
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
      /* clipboard blocked — no false feedback */
    }
  };

  // C — burn WTON → receive TON, in one tx (no approval needed). Same Privy +
  // viem write pattern the staking flow uses.
  const handleUnwrap = async () => {
    if (!primaryWallet || !addr || !unwrapValid) return;
    setUnwrapState("signing");
    setTxHash(null);
    try {
      const provider = await primaryWallet.getEthereumProvider();
      const walletClient = createWalletClient({
        chain,
        transport: custom(provider),
        account: addr as `0x${string}`,
      });
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

  const onAmount = (raw: string, set: (v: string) => void) => {
    set(raw.replace(/[^0-9.]/g, ""));
    if (unwrapState !== "idle") setUnwrapState("idle");
  };

  return (
    <div className="relative min-h-screen bg-grid flex flex-col">
      <Header />

      {showReceive && addr && (
        <ReceiveModal address={addr} onClose={() => setShowReceive(false)} />
      )}

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 pt-24 pb-16">
        {/* Back to hub */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-accent-cyan transition-colors"
        >
          ← {t.getTon.back}
        </Link>

        {/* Hero */}
        <div className="mt-4 mb-6 flex items-center gap-4">
          <img
            src="/characters/toki-pointing.png"
            alt="Toki"
            className="h-20 w-20 flex-none object-contain animate-float"
          />
          <div>
            <h1 className="text-2xl font-bold text-white">{t.getTon.title}</h1>
            <p className="mt-0.5 text-sm text-gray-400">{t.getTon.subtitle}</p>
          </div>
        </div>

        {/* Balance — emphasised when the wallet has no TON */}
        <div
          className={`card mb-8 flex items-center justify-between gap-4 p-4 ${
            noTon ? "border-accent-cyan/40 animate-glow-cyan" : ""
          }`}
        >
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-gray-400">
              {t.getTon.balanceLabel}
            </div>
            <div className="text-2xl font-bold text-white leading-tight">
              {loading ? "…" : fmt(tonNum)}{" "}
              <span className="text-base font-normal text-accent-cyan">TON</span>
            </div>
            <div className="mt-0.5 text-xs text-gray-400">
              {noTon ? t.getTon.emptyNudge : t.getTon.hasTonNudge}
            </div>
          </div>
          {addr && (
            <button
              onClick={() => setShowReceive(true)}
              className="flex-none rounded-lg border border-accent-cyan/30 bg-accent-cyan/15 px-3.5 py-2 text-sm font-medium text-accent-cyan transition-colors hover:bg-accent-cyan/25"
            >
              {t.getTon.receive}
            </button>
          )}
        </div>

        {/* Route 1 — CEX */}
        <section className="card mb-5 p-5">
          <div className="mb-1 flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">{t.getTon.cexTitle}</h2>
            <span className="rounded-full bg-accent-cyan/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-accent-cyan">
              {t.getTon.cexTag}
            </span>
          </div>
          <p className="mb-3 text-sm text-gray-400">{t.getTon.cexDesc}</p>

          {/* Ticker heads-up */}
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-accent-amber/25 bg-accent-amber/10 px-3 py-2 text-[12px] leading-relaxed text-amber-200/90">
            <span className="mt-px flex-none">⚠️</span>
            <span>{t.getTon.cexTickerNote}</span>
          </div>

          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {t.getTon.cexKorean}
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {CEX_KOREAN.map((v) => (
              <VenueRow key={v.name} {...v} />
            ))}
          </div>

          <div className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {t.getTon.cexGlobal}
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {CEX_GLOBAL.map((v) => (
              <VenueRow key={v.name} {...v} />
            ))}
          </div>

          <p className="mt-4 text-[12px] leading-relaxed text-gray-500">
            {t.getTon.cexWithdrawHint}
          </p>
        </section>

        {/* Route 2 — DEX (swap → WTON, then unwrap → TON) */}
        <section className="card mb-5 p-5">
          <div className="mb-1 flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">{t.getTon.dexTitle}</h2>
            <span className="rounded-full bg-accent-sky/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-accent-sky">
              {t.getTon.dexTag}
            </span>
          </div>
          <p className="mb-3 text-sm text-gray-400">{t.getTon.dexDesc}</p>

          {/* Wrap heads-up */}
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-accent-amber/25 bg-accent-amber/10 px-3 py-2 text-[12px] leading-relaxed text-amber-200/90">
            <span className="mt-px flex-none">⚠️</span>
            <span>
              {t.getTon.dexWarn}{" "}
              <a
                href={WTON_GUIDE}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-accent-cyan underline-offset-2 hover:underline"
              >
                {t.getTon.dexWtonGuide} ↗
              </a>
            </span>
          </div>

          {/* B — Step 1: swap to WTON (deep-links out to Uniswap, pair pre-filled) */}
          <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-sm font-bold text-white">{t.getTon.swapBoxTitle}</div>
            <p className="mb-3 mt-0.5 text-[12px] text-gray-400">{t.getTon.swapBoxDesc}</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="flex-1">
                <span className="mb-1 block text-[11px] text-gray-500">{t.getTon.swapPayWith}</span>
                <select
                  value={payToken}
                  onChange={(e) => setPayToken(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-accent-cyan/40"
                >
                  {PAY_TOKENS.map((tk) => (
                    <option key={tk.sym} value={tk.id} className="bg-[#111a2e]">
                      {tk.sym}
                    </option>
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
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-accent-cyan/40"
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

          {/* C — Step 2: unwrap WTON → TON, natively */}
          <div className="rounded-xl border border-accent-cyan/20 bg-accent-cyan/[0.04] p-4">
            <div className="text-sm font-bold text-white">{t.getTon.unwrapTitle}</div>
            <p className="mb-3 mt-0.5 text-[12px] text-gray-400">{t.getTon.unwrapDesc}</p>

            <div className="mb-2 flex items-baseline justify-between text-[11px]">
              <span className="text-gray-500">{t.getTon.unwrapBalance}</span>
              <span className="font-mono text-gray-300">
                {loading ? "…" : fmt(wtonNum)} WTON
              </span>
            </div>

            <div className="relative">
              <input
                inputMode="decimal"
                value={unwrapAmount}
                onChange={(e) => onAmount(e.target.value, setUnwrapAmount)}
                placeholder="0.0"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 pr-14 text-sm text-white placeholder-gray-600 outline-none focus:border-accent-cyan/40"
              />
              <button
                type="button"
                onClick={() => onAmount(formatUnits(wton, WTON_DECIMALS), setUnwrapAmount)}
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
              <div className="rounded-lg bg-white/5 px-3 py-2.5 text-center text-[12px] text-gray-400">
                {t.getTon.unwrapConnect}
              </div>
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
              <div className="mt-2 text-center text-[12px] text-emerald-400">
                {t.getTon.unwrapSuccess}
              </div>
            )}
            {unwrapState === "error" && (
              <div className="mt-2 text-center text-[12px] text-red-400">
                {t.getTon.unwrapError}
              </div>
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

          {/* Secondary — open a DEX directly */}
          <div className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {t.getTon.dexSwapOn}
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {DEXES.map((v) => (
              <VenueRow key={v.name} {...v} />
            ))}
          </div>
        </section>

        {/* TON contract */}
        <div className="card flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-gray-400">
              {t.getTon.contractLabel}
            </div>
            <div className="truncate font-mono text-xs text-gray-300">
              {CONTRACTS.TON}
            </div>
            <a
              href={`${EXPLORER}/token/${CONTRACTS.TON}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-accent-sky hover:underline"
            >
              {t.getTon.viewOnEtherscan} ↗
            </a>
          </div>
          <button
            onClick={copyContract}
            className="flex-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-200 transition-colors hover:bg-white/10"
          >
            {copied ? t.getTon.copied : t.getTon.copy}
          </button>
        </div>
      </main>

      <HubFooter />
    </div>
  );
}
