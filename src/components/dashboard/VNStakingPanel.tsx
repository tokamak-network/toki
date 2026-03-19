"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import {
  createWalletClient,
  formatUnits,
  parseUnits,
  custom,
} from "viem";
import { CONTRACTS } from "@/constants/contracts";
import {
  seigManagerAbi,
  layer2RegistryAbi,
  candidateAbi,
  tonTokenAbi,
  tonPaymasterAbi,
} from "@/lib/abi";
import { buildStakingCalls } from "@/lib/staking-calls";
import { useTranslation } from "@/components/providers/LanguageProvider";
import OperatorCard from "./OperatorCard";

import type { PaymasterMode } from "@/hooks/useEip7702";
import type { useSessionKey } from "@/hooks/useSessionKey";
import { chain, publicClient, isTestnet } from "@/lib/chain";

type SessionKeyReturn = ReturnType<typeof useSessionKey>;

// ─── Types ───────────────────────────────────────────────────────────

interface Operator {
  address: string;
  name: string;
  totalStaked: string;
  myStaked: string;
}

type Mood = "welcome" | "explain" | "thinking" | "excited" | "proud" | "cheer" | "wink" | "surprised" | "confused" | "shy" | "determined" | "pointing" | "reading" | "crying-happy" | "peace" | "worried" | "laughing";

type VNPhase =
  | "welcome"
  | "operator-select"
  | "toki-pick"
  | "amount-entry"
  | "staking"
  | "success"
  | "error";

const MOOD_IMAGES: Record<Mood, string> = {
  welcome: "/characters/toki-welcome.png",
  explain: "/characters/toki-explain.png",
  thinking: "/characters/toki-thinking.png",
  excited: "/characters/toki-excited.png",
  proud: "/characters/toki-proud.png",
  cheer: "/characters/toki-cheer.png",
  wink: "/characters/toki-wink.png",
  surprised: "/characters/toki-surprised.png",
  confused: "/characters/toki-confused.png",
  shy: "/characters/toki-shy.png",
  determined: "/characters/toki-determined.png",
  pointing: "/characters/toki-pointing.png",
  reading: "/characters/toki-reading.png",
  "crying-happy": "/characters/toki-crying-happy.png",
  peace: "/characters/toki-peace.png",
  worried: "/characters/toki-worried.png",
  laughing: "/characters/toki-laughing.png",
};

const MOOD_GLOW: Record<Mood, string> = {
  welcome: "rgba(74, 144, 217, 0.35)",
  explain: "rgba(96, 165, 250, 0.35)",
  thinking: "rgba(99, 102, 241, 0.35)",
  excited: "rgba(245, 158, 11, 0.45)",
  proud: "rgba(34, 211, 238, 0.40)",
  cheer: "rgba(168, 85, 247, 0.35)",
  wink: "rgba(236, 72, 153, 0.35)",
  surprised: "rgba(245, 158, 11, 0.40)",
  confused: "rgba(99, 102, 241, 0.30)",
  shy: "rgba(236, 72, 153, 0.40)",
  determined: "rgba(239, 68, 68, 0.35)",
  pointing: "rgba(34, 211, 238, 0.35)",
  reading: "rgba(96, 165, 250, 0.30)",
  "crying-happy": "rgba(245, 158, 11, 0.40)",
  peace: "rgba(168, 85, 247, 0.35)",
  worried: "rgba(239, 68, 68, 0.30)",
  laughing: "rgba(245, 158, 11, 0.45)",
};

function getMoodForPhase(phase: VNPhase): Mood {
  switch (phase) {
    case "welcome": return "welcome";
    case "operator-select": return "explain";
    case "toki-pick": return "proud";
    case "amount-entry": return "cheer";
    case "staking": return "excited";
    case "success": return "proud";
    case "error": return "thinking";
  }
}

// ─── Typewriter Hook ─────────────────────────────────────────────────

function useTypewriter(text: string, speed = 35) {
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

// ─── Props ───────────────────────────────────────────────────────────

interface VNStakingPanelProps {
  walletAddress: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getEthereumProvider: () => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  smartAccountClient?: { sendTransaction: (...args: any[]) => Promise<`0x${string}`> } | null;
  onBalanceChange?: () => void;
  paymasterMode?: PaymasterMode;
  isMetaMask?: boolean;
  sessionKey?: SessionKeyReturn;
  onFirstStakeComplete?: () => void;
}

// ─── Main Component ──────────────────────────────────────────────────

export default function VNStakingPanel({
  walletAddress,
  getEthereumProvider,
  smartAccountClient,
  onBalanceChange,
  paymasterMode = "none",
  sessionKey,
  onFirstStakeComplete,
}: VNStakingPanelProps) {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [selectedOp, setSelectedOp] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [staking, setStaking] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tonBalance, setTonBalance] = useState<string>("0");
  const [shuffling, setShuffling] = useState(false);
  const [autoSelectedIndex, setAutoSelectedIndex] = useState<number | undefined>(undefined);
  const [vnPhase, setVnPhase] = useState<VNPhase>("welcome");
  const [gasEstimateTon, setGasEstimateTon] = useState(0);
  const selectedOpRef = useRef(selectedOp);
  selectedOpRef.current = selectedOp;
  const { t } = useTranslation();

  const addr = walletAddress as `0x${string}`;
  const seigManagerAddr = CONTRACTS.SEIG_MANAGER_PROXY as `0x${string}`;
  const registryAddr = CONTRACTS.LAYER2_REGISTRY_PROXY as `0x${string}`;
  const tonAddr = CONTRACTS.TON as `0x${string}`;
  const wtonAddr = CONTRACTS.WTON as `0x${string}`;
  const depositManagerAddr = CONTRACTS.DEPOSIT_MANAGER_PROXY as `0x${string}`;

  // ─── Dialogue Text ─────────────────────────────────────────────────

  function getDialogueText(): string {
    const selectedOperator = operators.find((o) => o.address === selectedOp);
    switch (vnPhase) {
      case "welcome":
        return t.vnStaking.welcome;
      case "operator-select":
        if (selectedOperator) {
          return t.vnStaking.operatorExplain.replace(
            "{amount}",
            Number(selectedOperator.totalStaked).toLocaleString("en-US", { maximumFractionDigits: 0 })
          );
        }
        return t.vnStaking.welcome;
      case "toki-pick":
        return t.vnStaking.tokiPick;
      case "amount-entry":
        return t.vnStaking.amountEntry.replace(
          "{balance}",
          Number(tonBalance).toLocaleString("en-US", { maximumFractionDigits: 2 })
        );
      case "staking":
        return t.vnStaking.progress;
      case "success":
        return t.vnStaking.success;
      case "error":
        return t.vnStaking.error;
    }
  }

  // ─── Fetch Operators ───────────────────────────────────────────────

  const fetchOperators = useCallback(async () => {
    setLoading(true);
    try {
      const numLayer2s = await publicClient.readContract({
        address: registryAddr,
        abi: layer2RegistryAbi,
        functionName: "numLayer2s",
      });

      const count = Math.min(Number(numLayer2s), 10);
      const addresses = await Promise.all(
        Array.from({ length: count }, (_, i) =>
          publicClient.readContract({
            address: registryAddr,
            abi: layer2RegistryAbi,
            functionName: "layer2ByIndex",
            args: [BigInt(i)],
          })
        )
      );

      const memoContracts = addresses.map((a) => ({
        address: a,
        abi: candidateAbi,
        functionName: "memo" as const,
      }));
      const stakedContracts = addresses.map((a) => ({
        address: a,
        abi: candidateAbi,
        functionName: "totalStaked" as const,
      }));
      const myStakedContracts = addresses.map((a) => ({
        address: seigManagerAddr,
        abi: seigManagerAbi,
        functionName: "stakeOf" as const,
        args: [a, addr] as const,
      }));

      const [memoResults, stakedResults, myStakedResults] = await Promise.all([
        publicClient.multicall({ contracts: memoContracts, allowFailure: true }),
        publicClient.multicall({ contracts: stakedContracts, allowFailure: true }),
        publicClient.multicall({ contracts: myStakedContracts, allowFailure: true }),
      ]);

      const ops: Operator[] = addresses.map((a, i) => ({
        address: a,
        name:
          memoResults[i].status === "success"
            ? (memoResults[i].result as string) || `Operator ${i}`
            : `Operator ${i}`,
        totalStaked:
          stakedResults[i].status === "success"
            ? formatUnits(stakedResults[i].result as bigint, 27)
            : "0",
        myStaked:
          myStakedResults[i].status === "success"
            ? formatUnits(myStakedResults[i].result as bigint, 27)
            : "0",
      }));

      ops.sort((a, b) => Number(b.totalStaked) - Number(a.totalStaked));
      const topOps = ops.slice(0, 10);
      setOperators(topOps);

      const tonBal = await publicClient.readContract({
        address: tonAddr,
        abi: tonTokenAbi,
        functionName: "balanceOf",
        args: [addr],
      });
      setTonBalance(formatUnits(tonBal, 18));
    } catch (e) {
      console.error("Failed to fetch operators:", e);
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addr, seigManagerAddr, registryAddr, tonAddr]);

  useEffect(() => {
    if (walletAddress) {
      fetchOperators();
    }
  }, [walletAddress, fetchOperators]);

  // ─── Estimate gas cost in TON ──────────────────────────────────────
  useEffect(() => {
    if (!smartAccountClient) { setGasEstimateTon(0); return; }
    const paymasterAddr = CONTRACTS.TON_PAYMASTER;
    let cancelled = false;
    async function estimate() {
      try {
        const gasPrice = await publicClient.getGasPrice();
        // Mainnet 3-step staking uses ~850k gas; Sepolia 1-step uses ~400k
        const gasCostWei = gasPrice * (isTestnet ? BigInt(400_000) : BigInt(900_000));
        let gasCostTon: number;
        if (paymasterAddr) {
          const tonAmount = await publicClient.readContract({
            address: paymasterAddr as `0x${string}`,
            abi: tonPaymasterAbi,
            functionName: "ethToToken",
            args: [gasCostWei],
          });
          gasCostTon = Number(formatUnits(tonAmount, 18));
        } else {
          gasCostTon = (Number(gasCostWei) / 1e18) * 1250;
        }
        if (!cancelled) setGasEstimateTon(Math.max(0.01, Math.ceil(gasCostTon * 100) / 100));
      } catch {
        if (!cancelled) setGasEstimateTon(0);
      }
    }
    estimate();
    return () => { cancelled = true; };
  }, [smartAccountClient]);

  // ─── Handlers ──────────────────────────────────────────────────────

  const handleAutoSelect = () => {
    if (operators.length === 0) return;
    setShuffling(true);
    setTimeout(() => {
      setSelectedOp(operators[0].address);
      setAutoSelectedIndex(0);
      setShuffling(false);
      setVnPhase("toki-pick");
    }, 500);
  };

  const handleOperatorSelect = (address: string) => {
    setSelectedOp(address);
    setAutoSelectedIndex(undefined);
    setVnPhase("operator-select");
  };

  const handleAmountFocus = () => {
    if (vnPhase !== "staking" && vnPhase !== "success") {
      setVnPhase("amount-entry");
    }
  };

  const handleStake = async () => {
    if (!amount || !selectedOp) return;

    // Block if staking amount + gas fee exceeds balance
    if (gasEstimateTon > 0) {
      const remaining = Number(tonBalance) - Number(amount);
      if (remaining < gasEstimateTon) {
        setError(t.dashboard.insufficientTonForGas);
        setVnPhase("error");
        return;
      }
    }

    setStaking(true);
    setError(null);
    setTxHash(null);
    setVnPhase("staking");

    try {
      const tonAmount = parseUnits(amount, 18);
      const stakingCalls = buildStakingCalls(
        tonAddr, wtonAddr, depositManagerAddr,
        selectedOp as `0x${string}`, tonAmount,
      );

      let hash: `0x${string}`;

      if (sessionKey?.delegationReady) {
        hash = await sessionKey.stakeWithDelegation(
          selectedOp as `0x${string}`,
          amount,
        );
      } else if (smartAccountClient) {
        hash = await smartAccountClient.sendTransaction({
          calls: stakingCalls,
        });
      } else {
        const provider = await getEthereumProvider();
        const walletClient = createWalletClient({
          chain,
          transport: custom(provider),
          account: addr,
        });

        if (stakingCalls.length === 1) {
          hash = await walletClient.sendTransaction({
            to: stakingCalls[0].to,
            data: stakingCalls[0].data,
            chain,
          });
        } else {
          for (let i = 0; i < stakingCalls.length - 1; i++) {
            const txHash = await walletClient.sendTransaction({
              to: stakingCalls[i].to,
              data: stakingCalls[i].data,
              chain,
            });
            await publicClient.waitForTransactionReceipt({ hash: txHash });
          }
          hash = await walletClient.sendTransaction({
            to: stakingCalls[stakingCalls.length - 1].to,
            data: stakingCalls[stakingCalls.length - 1].data,
            chain,
          });
        }
      }

      setTxHash(hash);
      await publicClient.waitForTransactionReceipt({ hash });

      setVnPhase("success");
      setAmount("");
      fetchOperators();
      onBalanceChange?.();

      // Mark first stake as done
      localStorage.setItem("toki-first-stake-done", "true");
      onFirstStakeComplete?.();
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      console.error("Staking failed:", errMsg);
      setVnPhase("error");
      if (errMsg.includes("User rejected")) {
        setError(t.dashboard.txRejected);
      } else if (errMsg.includes("insufficient TON") || errMsg.includes("insufficient funds")) {
        setError(t.dashboard.insufficientTonForGas);
      } else if (errMsg.includes("validatePaymasterUserOp") || errMsg.includes("Paymaster")) {
        setError(t.dashboard.paymasterValidationFailed);
      } else {
        setError(errMsg.slice(0, 200));
      }
    }
    setStaking(false);
  };

  // ─── VN Character ──────────────────────────────────────────────────

  const mood = getMoodForPhase(vnPhase);
  const dialogueText = getDialogueText();

  // ─── Render ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">{t.dashboard.staking}</h2>
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-white/5 rounded-lg" />
          <div className="h-10 bg-white/5 rounded-lg" />
          <div className="h-10 bg-white/5 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden min-h-[600px]">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/backgrounds/6.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />

      {/* Content */}
      <div className="relative z-10 flex flex-col lg:flex-row gap-4 p-4 sm:p-6 min-h-[600px]">
        {/* Left: Toki Character */}
        <div className="lg:w-[40%] flex flex-col items-center justify-end">
          <TokiCharacterVN mood={mood} />
        </div>

        {/* Right: Staking UI Panel */}
        <div className="lg:w-[55%] flex flex-col justify-center">
          <div className="bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 p-5 space-y-4">
            {/* Gasless badge */}
            {smartAccountClient && paymasterMode === "sponsor" && (
              <div className="flex justify-end">
                <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400">
                  {t.dashboard.gaslessShort}
                </span>
              </div>
            )}

            {/* Operator Cards */}
            <OperatorCard
              operators={operators}
              selectedOp={selectedOp}
              onSelect={handleOperatorSelect}
              shuffling={shuffling}
              autoSelectedIndex={autoSelectedIndex}
            />

            {/* Toki's Pick Button */}
            <div className="flex justify-center">
              <button
                onClick={handleAutoSelect}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-accent-amber/20 to-yellow-500/20 border border-accent-amber/30 text-accent-amber text-sm font-semibold hover:border-accent-amber/50 hover:scale-105 transition-all"
              >
                {t.vnStaking.tokiPickButton}
              </button>
            </div>

            {/* Amount Input */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                {t.dashboard.amountToStake}
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onFocus={handleAmountFocus}
                    placeholder="0.0"
                    min="0"
                    step="any"
                    className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-accent-blue/50 font-mono-num"
                  />
                  <button
                    onClick={() => {
                      const bal = Number(tonBalance);
                      const reserve = gasEstimateTon > 0 ? gasEstimateTon * 1.5 : 0;
                      const max = Math.max(0, bal - reserve);
                      setAmount(max > 0 ? String(Math.floor(max * 100) / 100) : "0");
                      handleAmountFocus();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-accent-sky hover:text-accent-cyan transition-colors"
                  >
                    MAX
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {t.dashboard.balance}{" "}
                {Number(tonBalance).toLocaleString("en-US", { maximumFractionDigits: 2 })} TON
              </div>
            </div>

            {/* Stake Button */}
            <button
              onClick={handleStake}
              disabled={staking || !amount || Number(amount) <= 0 || !selectedOp}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] transition-transform"
            >
              {staking
                ? t.dashboard.stakingInProgress
                : paymasterMode === "sponsor"
                  ? t.dashboard.stakeTonGasless
                  : t.dashboard.stakeTon}
            </button>

            {/* Status Messages */}
            {txHash && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="text-sm text-green-400">{t.dashboard.txSubmitted}</div>
                <a
                  href={`https://${isTestnet ? "sepolia." : ""}etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-500 hover:text-green-300 font-mono break-all"
                >
                  {txHash}
                </a>
              </div>
            )}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="text-sm text-red-400 break-all">{error}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Dialogue Box */}
      <div className="relative z-20">
        <DialogueBoxVN text={dialogueText} mood={mood} />
      </div>
    </div>
  );
}

// ─── TokiCharacter (VN Style) ────────────────────────────────────────

function TokiCharacterVN({ mood }: { mood: Mood }) {
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
    <div className="relative w-48 sm:w-64 md:w-72 lg:w-80 overflow-visible">
      <div
        className="absolute inset-[15%] bottom-0 rounded-full blur-3xl -z-10 animate-glow-pulse transition-colors duration-700 opacity-40"
        style={{ backgroundColor: glowColor }}
      />
      <Image
        src={transitioning ? prevSrc : imageSrc}
        alt="Toki"
        width={512}
        height={512}
        className={`relative z-10 drop-shadow-2xl transition-opacity duration-200 w-full h-auto ${
          transitioning ? "opacity-0" : "opacity-100"
        }`}
        priority
      />
    </div>
  );
}

// ─── Dialogue Box (VN Style) ─────────────────────────────────────────

function DialogueBoxVN({ text, mood }: { text: string; mood: Mood }) {
  const { displayed, done, skip } = useTypewriter(text, 35);

  return (
    <div className="cursor-pointer select-none" onClick={() => !done && skip()}>
      <div className="bg-black/70 backdrop-blur-xl border-t border-white/10 px-5 py-4 sm:px-6 sm:py-5">
        {/* Name plate */}
        <div className="flex items-center gap-2 mb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-cyan/10 border border-accent-cyan/30">
            <span className="text-accent-cyan font-bold text-sm tracking-wide">Toki</span>
            <span className="text-xs text-accent-cyan/60">{mood}</span>
          </div>
        </div>
        <p className="text-gray-100 text-sm sm:text-base leading-relaxed">
          {displayed}
          {!done && (
            <span className="inline-block w-0.5 h-4 bg-accent-cyan ml-0.5 animate-pulse align-middle" />
          )}
        </p>
      </div>
    </div>
  );
}
