"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  createWalletClient,
  formatUnits,
  parseUnits,
  encodeAbiParameters,
  encodeFunctionData,
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
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useAchievement } from "@/components/providers/AchievementProvider";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useEip7702 } from "@/hooks/useEip7702";
import { useSessionKey } from "@/hooks/useSessionKey";
import { calculateLevel, CARD_TIERS, type CardTier } from "@/lib/achievements";
import OperatorCard from "@/components/dashboard/OperatorCard";
import { chain, publicClient, isTestnet } from "@/lib/chain";

// ─── Types ───────────────────────────────────────────────────────────

interface Operator {
  address: string;
  name: string;
  totalStaked: string;
  myStaked: string;
  commissionRate: number; // percentage, negative = rebate
}

type Mood = "welcome" | "explain" | "thinking" | "excited" | "proud" | "cheer" | "wink" | "presenting" | "celebrate" | "card-reveal" | "surprised" | "confused" | "shy" | "determined" | "pointing" | "reading" | "crying-happy" | "peace" | "worried" | "laughing";

type Step = 1 | 2 | 3 | 4;

const MOOD_IMAGES: Record<Mood, string> = {
  welcome: "/characters/toki-welcome.png",
  explain: "/characters/toki-explain.png",
  thinking: "/characters/toki-thinking.png",
  excited: "/characters/toki-excited.png",
  proud: "/characters/toki-proud.png",
  cheer: "/characters/toki-cheer.png",
  wink: "/characters/toki-wink.png",
  presenting: "/characters/toki-presenting.png",
  celebrate: "/characters/toki-celebrate.png",
  "card-reveal": "/characters/toki-card-reveal.png",
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
  presenting: "rgba(96, 165, 250, 0.35)",
  celebrate: "rgba(245, 158, 11, 0.45)",
  "card-reveal": "rgba(245, 158, 11, 0.40)",
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

const STEP_BACKGROUNDS: Record<Step, string> = {
  1: "/backgrounds/staking-night.png",
  2: "/backgrounds/staking-dawn.png",
  3: "/backgrounds/staking-dawn.png",
  4: "/backgrounds/staking-sunrise.png",
};

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

// ─── Main Component ──────────────────────────────────────────────────

export default function StakingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { authenticated, ready } = usePrivy();
  const { wallets } = useWallets();
  const { smartAccountClient, paymasterMode } = useEip7702();
  const { storage, trackActivity } = useAchievement();

  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
  const externalWallet = wallets.find((w) => w.walletClientType !== "privy");
  const primaryWallet = externalWallet || embeddedWallet;

  const getEthereumProvider = useCallback(async () => {
    if (!primaryWallet) throw new Error("No wallet connected");
    return await primaryWallet.getEthereumProvider();
  }, [primaryWallet]);

  const sessionKey = useSessionKey(
    primaryWallet ? getEthereumProvider : null,
    (primaryWallet?.address as `0x${string}`) || null,
  );

  // Staking state
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
  const selectedOpRef = useRef(selectedOp);
  selectedOpRef.current = selectedOp;

  // VN state
  const [step, setStep] = useState<Step>(1);
  const [cardRevealed, setCardRevealed] = useState(false);
  const [hoverDialogue, setHoverDialogue] = useState<string | null>(null);

  const walletAddress = primaryWallet?.address || "";
  const addr = walletAddress as `0x${string}`;
  const seigManagerAddr = CONTRACTS.SEIG_MANAGER_PROXY as `0x${string}`;
  const registryAddr = CONTRACTS.LAYER2_REGISTRY_PROXY as `0x${string}`;
  const tonAddr = CONTRACTS.TON as `0x${string}`;
  const wtonAddr = CONTRACTS.WTON as `0x${string}`;
  const depositManagerAddr = CONTRACTS.DEPOSIT_MANAGER_PROXY as `0x${string}`;

  // Dynamic gas reserve for MAX button (paymaster pays gas in TON)
  const [gasReserveTon, setGasReserveTon] = useState(0);

  // ─── Auth redirect ─────────────────────────────────────────────────

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  // ─── Fetch Operators ───────────────────────────────────────────────

  const fetchOperators = useCallback(async () => {
    if (!walletAddress) return;
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
        address: a, abi: candidateAbi, functionName: "memo" as const,
      }));
      const stakedContracts = addresses.map((a) => ({
        address: a, abi: candidateAbi, functionName: "totalStaked" as const,
      }));
      const myStakedContracts = addresses.map((a) => ({
        address: seigManagerAddr, abi: seigManagerAbi, functionName: "stakeOf" as const,
        args: [a, addr] as const,
      }));
      const commissionContracts = addresses.map((a) => ({
        address: seigManagerAddr, abi: seigManagerAbi, functionName: "commissionRates" as const,
        args: [a] as const,
      }));
      const commissionNegContracts = addresses.map((a) => ({
        address: seigManagerAddr, abi: seigManagerAbi, functionName: "isCommissionRateNegative" as const,
        args: [a] as const,
      }));

      const [memoResults, stakedResults, myStakedResults, commResults, commNegResults] = await Promise.all([
        publicClient.multicall({ contracts: memoContracts, allowFailure: true }),
        publicClient.multicall({ contracts: stakedContracts, allowFailure: true }),
        publicClient.multicall({ contracts: myStakedContracts, allowFailure: true }),
        publicClient.multicall({ contracts: commissionContracts, allowFailure: true }),
        publicClient.multicall({ contracts: commissionNegContracts, allowFailure: true }),
      ]);

      const ops: Operator[] = addresses.map((a, i) => {
        // Commission rate: RAY format (1e27 = 100%)
        const rawRate = commResults[i].status === "success" ? Number(formatUnits(commResults[i].result as bigint, 27)) * 100 : 0;
        const isNeg = commNegResults[i].status === "success" ? (commNegResults[i].result as boolean) : false;
        return {
          address: a,
          name: memoResults[i].status === "success" ? (memoResults[i].result as string) || `Operator ${i}` : `Operator ${i}`,
          totalStaked: stakedResults[i].status === "success" ? formatUnits(stakedResults[i].result as bigint, 27) : "0",
          myStaked: myStakedResults[i].status === "success" ? formatUnits(myStakedResults[i].result as bigint, 27) : "0",
          commissionRate: isNeg ? -rawRate : rawRate,
        };
      });

      ops.sort((a, b) => Number(b.totalStaked) - Number(a.totalStaked));
      const topOps = ops.slice(0, 10);
      setOperators(topOps);

      const tonBal = await publicClient.readContract({
        address: tonAddr, abi: tonTokenAbi, functionName: "balanceOf", args: [addr],
      });
      setTonBalance(formatUnits(tonBal, 18));
    } catch (e) {
      console.error("Failed to fetch operators:", e);
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress, seigManagerAddr, registryAddr, tonAddr]);

  useEffect(() => {
    if (walletAddress) fetchOperators();
  }, [walletAddress, fetchOperators]);

  // ─── Estimate gas reserve for MAX button (via TONPaymaster oracle) ──
  useEffect(() => {
    if (!smartAccountClient) {
      setGasReserveTon(0);
      return;
    }
    const paymasterAddr = CONTRACTS.TON_PAYMASTER;
    let cancelled = false;
    async function estimateGasReserve() {
      try {
        const gasPrice = await publicClient.getGasPrice();
        // UserOp gas: ~600k (approve + approveAndCall + paymaster verify/postOp)
        const estimatedGas = BigInt(600_000);
        const gasCostWei = gasPrice * estimatedGas;

        let gasCostTon: number;

        if (paymasterAddr) {
          // Use TONPaymaster.ethToToken() — includes markup (150%) and TWAP oracle rate
          const tonAmount = await publicClient.readContract({
            address: paymasterAddr as `0x${string}`,
            abi: tonPaymasterAbi,
            functionName: "ethToToken",
            args: [gasCostWei],
          });
          gasCostTon = Number(formatUnits(tonAmount, 18));
        } else {
          // Fallback: rough estimate (1 ETH ≈ 1250 TON)
          gasCostTon = (Number(gasCostWei) / 1e18) * 1250;
        }

        // 1.5x safety margin on top of paymaster's 150% markup, minimum 0.5 TON
        const reserve = Math.max(0.5, Math.ceil(gasCostTon * 1.5 * 10) / 10);

        if (!cancelled) {
          setGasReserveTon(reserve);
          console.log(`[GasReserve] gasPrice=${gasPrice} gasCostWei=${gasCostWei} tonReserve=${reserve}`);
        }
      } catch (e) {
        console.warn("Gas estimation failed, using fallback:", e);
        if (!cancelled) setGasReserveTon(2);
      }
    }
    estimateGasReserve();
    return () => { cancelled = true; };
  }, [smartAccountClient]);

  // ─── Handlers ──────────────────────────────────────────────────────

  const handleAutoSelect = () => {
    if (operators.length === 0) return;
    setShuffling(true);
    setTimeout(() => {
      // Pick the operator with lowest commission, then highest staked
      const best = [...operators].sort((a, b) => {
        if (a.commissionRate !== b.commissionRate) return a.commissionRate - b.commissionRate;
        return Number(b.totalStaked) - Number(a.totalStaked);
      })[0];
      const idx = operators.findIndex((o) => o.address === best.address);
      setSelectedOp(best.address);
      setAutoSelectedIndex(idx);
      setShuffling(false);
    }, 500);
  };

  const handleStake = async () => {
    if (!amount || !selectedOp) return;
    setStaking(true);
    setError(null);
    setTxHash(null);

    try {
      const tonAmount = parseUnits(amount, 18);
      const stakingData = encodeAbiParameters(
        [{ type: "address" }, { type: "address" }],
        [depositManagerAddr, selectedOp as `0x${string}`]
      );

      let hash: `0x${string}`;

      if (sessionKey?.delegationReady) {
        hash = await sessionKey.stakeWithDelegation(selectedOp as `0x${string}`, amount);
      } else if (smartAccountClient) {
        hash = await smartAccountClient.sendTransaction({
          calls: [{
            to: tonAddr,
            data: encodeFunctionData({
              abi: tonTokenAbi, functionName: "approveAndCall",
              args: [wtonAddr, tonAmount, stakingData],
            }),
          }],
        });
      } else {
        const provider = await getEthereumProvider();
        const walletClient = createWalletClient({ chain, transport: custom(provider), account: addr });
        hash = await walletClient.writeContract({
          address: tonAddr, abi: tonTokenAbi, functionName: "approveAndCall",
          args: [wtonAddr, tonAmount, stakingData],
        });
      }

      setTxHash(hash);
      await publicClient.waitForTransactionReceipt({ hash });

      // Track achievement
      trackActivity("stake", { amount: Number(amount), paymasterMode });
      localStorage.setItem("toki-first-stake-done", "true");

      setStep(4);
      setTimeout(() => setCardRevealed(true), 600);
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      console.error("Staking failed:", errMsg);
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

  // ─── Derived State ─────────────────────────────────────────────────

  const selectedOperator = operators.find((o) => o.address === selectedOp);
  const currentLevel = calculateLevel(storage.score);
  const cardTier = CARD_TIERS[Math.min(currentLevel, 5) - 1];

  function getMood(): Mood {
    if (step === 4) return cardRevealed ? "celebrate" : "card-reveal";
    if (staking) return "excited";
    if (error) return "thinking";
    if (step === 3) return "excited";
    if (step === 2) return "cheer";
    if (autoSelectedIndex !== undefined && step === 1) return "proud";
    if (selectedOp && step === 1) return "explain";
    return "presenting";
  }

  function getDialogue(): string {
    const s = t.stakingScreen;
    if (step === 1) {
      if (autoSelectedIndex !== undefined) return s.step1TokiPick;
      if (selectedOperator) {
        return s.step1OperatorSelected
          .replace("{name}", selectedOperator.name)
          .replace("{amount}", Number(selectedOperator.totalStaked).toLocaleString("en-US", { maximumFractionDigits: 0 }));
      }
      return s.step1Dialogue;
    }
    if (step === 2) {
      if (amount && Number(amount) > 0) {
        return s.step2Ready.replace("{amount}", amount);
      }
      if (gasReserveTon > 0) {
        return s.step2DialogueWithGas
          .replace("{balance}", Number(tonBalance).toLocaleString("en-US", { maximumFractionDigits: 2 }))
          .replace("{gas}", String(gasReserveTon));
      }
      return s.step2Dialogue.replace("{balance}", Number(tonBalance).toLocaleString("en-US", { maximumFractionDigits: 2 }));
    }
    if (step === 3) {
      if (staking) return s.step3Staking;
      if (error) return s.step3Error;
      return s.step3Dialogue;
    }
    if (cardRevealed) return s.step4Dialogue;
    return s.step4TapToReveal;
  }

  // ─── Render ────────────────────────────────────────────────────────

  if (!ready || !authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">{t.dashboard.loading}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="animate-pulse text-gray-400">{t.dashboard.loading}</div>
      </div>
    );
  }

  const mood = hoverDialogue ? "wink" as Mood : getMood();
  const dialogue = hoverDialogue || getDialogue();
  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Background - transitions between stages */}
      {([1, 2, 3, 4] as Step[]).map((s) => (
        <div
          key={s}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
          style={{
            backgroundImage: `url('${STEP_BACKGROUNDS[s]}')`,
            opacity: step === s ? 1 : 0,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

      {/* Middle area: Character left + Interactive panel right */}
      <div className="absolute inset-x-0 top-16 bottom-[176px] z-10 flex items-center justify-center">
        <div className="max-w-3xl w-full mx-auto flex items-end h-full">
          {/* Left: Toki Character */}
          <div className="w-[40%] flex items-end justify-center">
            <TokiCharacter mood={mood} />
          </div>

          {/* Right: Interactive Panel */}
          <div className="w-[60%] flex items-end justify-center pb-4">
            <div className="w-full max-w-sm animate-slide-up">
            <div className="bg-black/50 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-[0_0_40px_rgba(0,0,0,0.3)]">
                {/* Step indicator + back button (hidden on step 4) */}
                {step < 4 && (
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3].map((s) => (
                      <div key={s} className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                          step > s ? "bg-accent-cyan text-white" :
                          step === s ? "bg-accent-cyan/20 border-2 border-accent-cyan text-accent-cyan" :
                          "bg-white/10 text-gray-600"
                        }`}>
                          {step > s ? "\u2713" : s}
                        </div>
                        {s < 3 && (
                          <div className={`w-6 h-0.5 transition-colors duration-500 ${step > s ? "bg-accent-cyan" : "bg-white/10"}`} />
                        )}
                      </div>
                    ))}
                  </div>
                  {step > 1 && (
                    <button
                      onClick={() => setStep((step - 1) as Step)}
                      className="px-3 py-1 rounded-lg bg-white/10 text-gray-400 text-xs hover:bg-white/20 transition-colors"
                    >
                      ← Back
                    </button>
                  )}
                </div>
                )}

                {/* Step content */}
                <div className="space-y-3">
                  {/* Step 1: Operator Selection */}
                  {step === 1 && (
                    <>
                      <OperatorCard
                        operators={operators}
                        selectedOp={selectedOp}
                        onSelect={(address) => {
                          setSelectedOp(address);
                          setAutoSelectedIndex(undefined);
                        }}
                        shuffling={shuffling}
                        autoSelectedIndex={autoSelectedIndex}
                      />

                      <div className="flex gap-3">
                        <button
                          onClick={handleAutoSelect}
                          onMouseEnter={() => setHoverDialogue(t.stakingScreen.tokiPickHover)}
                          onMouseLeave={() => setHoverDialogue(null)}
                          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-accent-amber/20 to-yellow-500/20 border border-accent-amber/30 text-accent-amber text-sm font-semibold hover:border-accent-amber/50 hover:scale-[1.02] transition-all"
                        >
                          {t.stakingScreen.tokiPickButton}
                        </button>
                        {selectedOp && (
                          <button
                            onClick={() => setStep(2)}
                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold text-sm hover:scale-[1.02] transition-transform"
                          >
                            {t.stakingScreen.nextStep} →
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  {/* Step 2: Amount Input */}
                  {step === 2 && (
                    <>
                      {selectedOperator && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white">
                            {selectedOperator.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm text-white font-medium">{selectedOperator.name}</div>
                            <div className="text-xs text-gray-500">
                              {Number(selectedOperator.totalStaked).toLocaleString("en-US", { maximumFractionDigits: 0 })} TON
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Gas estimate info */}
                      {gasReserveTon > 0 && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-amber/10 border border-accent-amber/20">
                          <span className="text-accent-amber text-sm">⛽</span>
                          <span className="text-xs text-accent-amber/80">
                            {t.stakingScreen.estimatedGasCost.replace("{amount}", String(gasReserveTon))}
                          </span>
                        </div>
                      )}

                      <div>
                        <div className="relative">
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.0"
                            min="0"
                            step="any"
                            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white text-lg placeholder-gray-600 focus:outline-none focus:border-accent-cyan/50 font-mono-num"
                          />
                          <button
                            onClick={() => {
                              const max = Math.max(0, Number(tonBalance) - gasReserveTon);
                              setAmount(max > 0 ? String(Math.floor(max * 100) / 100) : "0");
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-accent-cyan/10 text-accent-cyan text-xs font-semibold hover:bg-accent-cyan/20 transition-colors"
                          >
                            MAX
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          {t.dashboard.balance} {Number(tonBalance).toLocaleString("en-US", { maximumFractionDigits: 2 })} TON
                          {gasReserveTon > 0 && (
                            <span className="text-gray-600 ml-1">
                              ({t.stakingScreen.gasReserve.replace("{amount}", String(gasReserveTon))})
                            </span>
                          )}
                        </div>
                      </div>

                      {amount && Number(amount) > 0 && (
                        <button
                          onClick={() => setStep(3)}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold text-sm hover:scale-[1.02] transition-transform"
                        >
                          {t.stakingScreen.nextStep} →
                        </button>
                      )}
                    </>
                  )}

                  {/* Step 3: Execute */}
                  {step === 3 && (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between p-3 rounded-lg bg-white/5">
                          <span className="text-gray-400 text-sm">{t.stakingScreen.step1Title}</span>
                          <span className="text-white text-sm font-medium">{selectedOperator?.name}</span>
                        </div>
                        <div className="flex justify-between p-3 rounded-lg bg-white/5">
                          <span className="text-gray-400 text-sm">{t.stakingScreen.step2Title}</span>
                          <span className="text-white text-sm font-mono-num">{amount} TON</span>
                        </div>
                        {smartAccountClient && paymasterMode === "sponsor" && (
                          <div className="flex justify-between p-3 rounded-lg bg-green-500/5">
                            <span className="text-gray-400 text-sm">Gas</span>
                            <span className="text-green-400 text-sm font-medium">{t.dashboard.gaslessShort}</span>
                          </div>
                        )}
                      </div>

                      {!error ? (
                        <button
                          onClick={handleStake}
                          disabled={staking}
                          className="w-full py-4 rounded-xl bg-gradient-to-r from-accent-blue to-accent-cyan text-white font-bold text-lg disabled:opacity-50 hover:scale-[1.02] transition-transform shadow-lg shadow-accent-cyan/20 animate-glow-cyan"
                        >
                          {staking ? t.stakingScreen.step3Staking : t.stakingScreen.stakeButton}
                        </button>
                      ) : (
                        <>
                          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                            <div className="text-sm text-red-400 break-all">{error}</div>
                          </div>
                          <button
                            onClick={() => { setError(null); setTxHash(null); }}
                            className="w-full py-3 rounded-xl bg-white/10 text-white font-semibold text-sm hover:bg-white/15 transition-colors"
                          >
                            {t.stakingScreen.retryButton}
                          </button>
                        </>
                      )}

                      {txHash && !error && (
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
                    </>
                  )}

                  {/* Step 4: Card Unlock Celebration */}
                  {step === 4 && (
                    <div className="animate-fade-in">
                      <div className="text-accent-amber text-sm font-semibold tracking-widest mb-3 text-center animate-pulse">
                        {t.stakingScreen.step4CardUnlocked}
                      </div>

                      <div className="flex justify-center mb-4">
                        <CardRevealGacha
                          tier={cardTier}
                          revealed={step === 4}
                          onReveal={() => setCardRevealed(true)}
                        />
                      </div>

                      {cardRevealed && (
                        <button
                          onClick={() => router.push("/dashboard")}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold text-sm glow-blue hover:scale-[1.02] transition-transform animate-fade-in"
                        >
                          {t.stakingScreen.goToDashboard} →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>

      {/* Bottom: Dialogue bar (onboarding style) */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="max-w-3xl mx-auto">
          <DialogueBar
            text={dialogue}
            mood={mood}
            stepProgress={step === 4
              ? "Complete!"
              : t.stakingScreen.stepLabel.replace("{current}", String(step)).replace("{total}", "3")
            }
          />
        </div>
      </div>
    </div>
  );
}

// ─── Toki Character ──────────────────────────────────────────────────

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
      <div className="relative w-64 sm:w-80 md:w-96 lg:w-[28rem] overflow-visible">
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
    </div>
  );
}

// ─── Dialogue Bar (matches OnboardingQuest DialogueBox) ──────────────

function DialogueBar({ text, mood, stepProgress }: { text: string; mood: Mood; stepProgress: string }) {
  const { displayed, done, skip } = useTypewriter(text, 30);

  return (
    <div
      className="cursor-pointer select-none w-full"
      onClick={() => !done && skip()}
    >
      <div className="bg-black/70 backdrop-blur-xl border-t border-white/10 rounded-t-2xl px-6 py-5 sm:px-8 sm:py-6 h-[160px] sm:h-[176px] flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-cyan/10 border border-accent-cyan/30">
            <span className="text-accent-cyan font-bold text-sm tracking-wide">Toki</span>
            <span className="text-xs text-accent-cyan/60">{mood}</span>
          </div>
          <span className="text-xs text-gray-500 tabular-nums">{stepProgress}</span>
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

// ─── Unlocked Card ───────────────────────────────────────────────────

function UnlockedCard({ tier }: { tier: CardTier }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [light, setLight] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const ry = ((e.clientX - cx) / (rect.width / 2)) * 15;
    const rx = -((e.clientY - cy) / (rect.height / 2)) * 15;
    setRotation({ x: rx, y: ry });
    setLight({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, []);

  const handleLeave = useCallback(() => {
    setRotation({ x: 0, y: 0 });
    setLight({ x: 50, y: 50 });
    setHovered(false);
  }, []);

  const starsStr = "\u2605".repeat(tier.stars) + "\u2606".repeat(5 - tier.stars);

  return (
    <div style={{ perspective: "1200px" }}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleLeave}
        className="relative cursor-pointer transition-transform duration-200 ease-out"
        style={{
          transform: hovered
            ? `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(1.05)`
            : "rotateX(0) rotateY(0) scale(1)",
          transformStyle: "preserve-3d",
        }}
      >
        <div className="relative w-[320px] h-[200px] rounded-2xl overflow-hidden shadow-2xl border border-white/20">
          <Image src={tier.bgImage} alt={tier.tier} fill className="object-cover" />

          {hovered && (
            <div
              className="absolute inset-0 pointer-events-none z-[5]"
              style={{
                background: `radial-gradient(circle at ${light.x}% ${light.y}%, rgba(255,255,255,0.4) 0%, transparent 50%)`,
              }}
            />
          )}

          <div className="relative h-full z-[2] flex">
            <div className="w-[45%] h-full relative">
              <Image src={tier.charImage} alt={tier.name} fill className="object-contain object-bottom drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]" />
            </div>
            <div className="w-[55%] h-full p-4 flex flex-col justify-between">
              <div>
                <div className="text-[8px] font-semibold tracking-[0.3em]" style={{ color: "rgba(255,255,255,0.5)" }}>
                  TOKI STAKING MEMBER
                </div>
                <div className="text-lg font-black tracking-[0.15em] mt-1" style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.55) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
                  {tier.tier}
                </div>
              </div>
              <div className="text-base" style={{
                letterSpacing: "0.2em",
                background: "linear-gradient(180deg, #fcd34d 0%, #b45309 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                {starsStr}
              </div>
              <div className="text-[11px] font-medium tracking-[0.08em]" style={{ color: "rgba(255,255,255,0.65)" }}>
                Level {tier.level} &middot; {tier.name}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Card Reveal: Gacha (Light Beam + Drop + Flip + Burst) ───────────

const GACHA_PARTICLES = Array.from({ length: 16 }, (_, i) => {
  const angle = (i / 16) * 360;
  const distance = 90 + Math.random() * 70;
  const tx = Math.cos((angle * Math.PI) / 180) * distance;
  const ty = Math.sin((angle * Math.PI) / 180) * distance;
  const size = 3 + Math.random() * 5;
  const delay = Math.random() * 0.35;
  return { tx, ty, size, delay };
});

function CardRevealGacha({ tier, revealed, onReveal }: { tier: CardTier; revealed: boolean; onReveal?: () => void }) {
  const [phase, setPhase] = useState<"idle" | "beam" | "drop" | "waiting" | "flip" | "done">("idle");

  useEffect(() => {
    if (!revealed) { setPhase("idle"); return; }
    const t0 = setTimeout(() => setPhase("beam"), 50);
    const t1 = setTimeout(() => setPhase("drop"), 450);
    const t2 = setTimeout(() => setPhase("waiting"), 1150);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); };
  }, [revealed]);

  const handleCardClick = () => {
    if (phase !== "waiting") return;
    setPhase("flip");
    setTimeout(() => {
      setPhase("done");
      onReveal?.();
    }, 700);
  };

  return (
    <div className="relative" style={{ minHeight: 220 }}>
      {/* Light beam from above */}
      {(phase === "beam" || phase === "drop") && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80px] animate-light-beam overflow-hidden"
          style={{
            background: "linear-gradient(180deg, rgba(245,158,11,0.8), rgba(245,158,11,0.2), transparent)",
            filter: "blur(8px)",
            height: 0,
          }}
        />
      )}

      {/* Card container */}
      {(phase !== "idle" && phase !== "beam") && (
        <div
          style={{ perspective: "1200px" }}
          onClick={handleCardClick}
          className={phase === "waiting" ? "cursor-pointer" : ""}
        >
          {/* Drop stage */}
          <div className={phase === "drop" ? "animate-gacha-drop" : ""} style={{ transformStyle: "preserve-3d" }}>
            {/* Flip stage */}
            <div
              className={phase === "flip" || phase === "done" ? "animate-gacha-flip" : ""}
              style={{
                transformStyle: "preserve-3d",
                transform: phase === "drop" || phase === "waiting" ? "rotateY(180deg)" : undefined,
              }}
            >
              {/* Front (actual card) */}
              <div className="card-front relative overflow-hidden rounded-2xl">
                <UnlockedCard tier={tier} />
                {/* Shine after flip */}
                {phase === "done" && (
                  <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none z-10">
                    <div
                      className="absolute inset-y-0 w-[60%]"
                      style={{
                        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
                        animation: "shine-sweep 0.6s ease-out 0.2s forwards",
                        transform: "translateX(-100%)",
                      }}
                    />
                  </div>
                )}
              </div>
              {/* Back (silhouette) */}
              <div className="card-back absolute inset-0 rounded-2xl overflow-hidden pointer-events-none" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                <div className="w-[320px] h-[200px] rounded-2xl bg-gradient-to-br from-accent-amber/30 to-yellow-900/50 border border-accent-amber/20 flex items-center justify-center">
                  <div className="text-accent-amber/40 text-4xl font-black">?</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tap prompt */}
          {phase === "waiting" && (
            <div className="absolute -bottom-8 left-0 right-0 text-center">
              <span className="text-accent-amber/80 text-xs font-semibold tracking-wider animate-pulse">
                TAP TO REVEAL
              </span>
            </div>
          )}
        </div>
      )}

      {/* Shimmer glow behind card after flip */}
      {phase === "done" && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[160px] rounded-full animate-gacha-shimmer"
          style={{ background: "radial-gradient(circle, rgba(245,158,11,0.5), transparent 70%)" }}
        />
      )}

      {/* Particles burst after flip */}
      {(phase === "done") && GACHA_PARTICLES.map((p, i) => (
        <div
          key={i}
          className="absolute top-1/2 left-1/2 rounded-full"
          style={{
            width: p.size,
            height: p.size,
            marginLeft: -p.size / 2,
            marginTop: -p.size / 2,
            background: `hsl(${40 + (i % 4) * 5}, 90%, ${55 + (i % 3) * 10}%)`,
            boxShadow: `0 0 ${p.size * 2}px hsl(${40 + (i % 4) * 5}, 90%, 60%)`,
            animation: `burst-particle 0.9s ease-out ${p.delay}s forwards`,
            "--tx": `${p.tx}px`,
            "--ty": `${p.ty}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
