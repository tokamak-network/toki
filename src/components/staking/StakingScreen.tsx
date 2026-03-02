"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  createPublicClient,
  createWalletClient,
  http,
  formatUnits,
  parseUnits,
  encodeAbiParameters,
  encodeFunctionData,
  custom,
} from "viem";
import { sepolia, mainnet } from "viem/chains";
import { CONTRACTS } from "@/constants/contracts";
import {
  seigManagerAbi,
  layer2RegistryAbi,
  candidateAbi,
  tonTokenAbi,
} from "@/lib/abi";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useAchievement } from "@/components/providers/AchievementProvider";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useEip7702 } from "@/hooks/useEip7702";
import { useSessionKey } from "@/hooks/useSessionKey";
import { calculateLevel } from "@/lib/achievements";
import OperatorCard from "@/components/dashboard/OperatorCard";

// ─── Config ──────────────────────────────────────────────────────────

const isTestnet = process.env.NEXT_PUBLIC_NETWORK === "sepolia";
const chain = isTestnet ? sepolia : mainnet;

const publicClient = createPublicClient({
  chain,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || undefined, {
    timeout: 15_000,
  }),
});

// ─── Types ───────────────────────────────────────────────────────────

interface Operator {
  address: string;
  name: string;
  totalStaked: string;
  myStaked: string;
}

type Mood = "welcome" | "explain" | "thinking" | "excited" | "proud" | "cheer" | "wink" | "presenting" | "celebrate";

type Step = 1 | 2 | 3 | 4;

const MOOD_IMAGES: Record<Mood, string> = {
  welcome: "/toki-welcome.png",
  explain: "/toki-explain.png",
  thinking: "/toki-thinking.png",
  excited: "/toki-excited.png",
  proud: "/toki-proud.png",
  cheer: "/toki-cheer.png",
  wink: "/toki-wink.png",
  presenting: "/toki-presenting.png",
  celebrate: "/toki-celebrate.png",
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
};

const STEP_BACKGROUNDS: Record<Step, string> = {
  1: "/backgrounds/staking-night.png",
  2: "/backgrounds/staking-dawn.png",
  3: "/backgrounds/staking-sunrise.png",
  4: "/backgrounds/staking-sunrise.png",
};

const CARD_TIERS = [
  { level: 1, tier: "BRONZE", name: "Beginner", charImage: "/toki-card-bronze.png", bgImage: "/card-bg-bronze.png", stars: 1, threshold: 0 },
  { level: 2, tier: "SILVER", name: "Explorer", charImage: "/toki-card-silver.png", bgImage: "/card-bg-silver.png", stars: 2, threshold: 500 },
  { level: 3, tier: "GOLD", name: "Staker", charImage: "/toki-card-gold-v2.png", bgImage: "/card-bg-gold.png", stars: 3, threshold: 1500 },
  { level: 4, tier: "PLATINUM", name: "Expert", charImage: "/toki-card-platinum.png", bgImage: "/card-bg-platinum.png", stars: 4, threshold: 3000 },
  { level: 5, tier: "TOKI BLACK", name: "Master", charImage: "/toki-card-black.png", bgImage: "/card-bg-black.png", stars: 5, threshold: 5000 },
];

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

  const walletAddress = primaryWallet?.address || "";
  const addr = walletAddress as `0x${string}`;
  const seigManagerAddr = CONTRACTS.SEIG_MANAGER_PROXY as `0x${string}`;
  const registryAddr = CONTRACTS.LAYER2_REGISTRY_PROXY as `0x${string}`;
  const tonAddr = CONTRACTS.TON as `0x${string}`;
  const wtonAddr = CONTRACTS.WTON as `0x${string}`;
  const depositManagerAddr = CONTRACTS.DEPOSIT_MANAGER_PROXY as `0x${string}`;

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

      const [memoResults, stakedResults, myStakedResults] = await Promise.all([
        publicClient.multicall({ contracts: memoContracts, allowFailure: true }),
        publicClient.multicall({ contracts: stakedContracts, allowFailure: true }),
        publicClient.multicall({ contracts: myStakedContracts, allowFailure: true }),
      ]);

      const ops: Operator[] = addresses.map((a, i) => ({
        address: a,
        name: memoResults[i].status === "success" ? (memoResults[i].result as string) || `Operator ${i}` : `Operator ${i}`,
        totalStaked: stakedResults[i].status === "success" ? formatUnits(stakedResults[i].result as bigint, 27) : "0",
        myStaked: myStakedResults[i].status === "success" ? formatUnits(myStakedResults[i].result as bigint, 27) : "0",
      }));

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

  // ─── Handlers ──────────────────────────────────────────────────────

  const handleAutoSelect = () => {
    if (operators.length === 0) return;
    setShuffling(true);
    setTimeout(() => {
      setSelectedOp(operators[0].address);
      setAutoSelectedIndex(0);
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
    if (step === 4) return "celebrate";
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
      return s.step2Dialogue.replace("{balance}", Number(tonBalance).toLocaleString("en-US", { maximumFractionDigits: 2 }));
    }
    if (step === 3) {
      if (staking) return s.step3Staking;
      if (error) return s.step3Error;
      return s.step3Dialogue;
    }
    return s.step4Dialogue;
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

  const mood = getMood();
  const dialogue = getDialogue();
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

      {/* Character + Bottom Panel (matching OnboardingQuest layout) */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="max-w-3xl mx-auto">
          {/* Toki Character - centered above bottom panel */}
          <TokiCharacter mood={mood} />

          {/* Interactive Panel (steps 1-3) or Dialogue (step 4) */}
          {step < 4 ? (
            <div className="bg-black/70 backdrop-blur-xl border-t border-white/10 rounded-t-2xl px-6 py-5 sm:px-8 sm:py-6">
              {/* Step indicator + back button */}
              <div className="flex items-center justify-between mb-4">
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

              {/* Dialogue text with typewriter */}
              <DialogueInline text={dialogue} mood={mood} stepProgress={t.stakingScreen.stepLabel.replace("{current}", String(step)).replace("{total}", "3")} />

              {/* Step content */}
              <div className="mt-4 space-y-4">
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
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-accent-amber/20 to-yellow-500/20 border border-accent-amber/30 text-accent-amber text-sm font-semibold hover:border-accent-amber/50 hover:scale-[1.02] transition-all"
                      >
                        {t.stakingScreen.tokiPickButton}
                      </button>
                      {selectedOp && (
                        <button
                          onClick={() => setStep(2)}
                          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold text-sm hover:scale-[1.02] transition-transform"
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
                          onClick={() => setAmount(tonBalance)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-accent-cyan/10 text-accent-cyan text-xs font-semibold hover:bg-accent-cyan/20 transition-colors"
                        >
                          MAX
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        {t.dashboard.balance} {Number(tonBalance).toLocaleString("en-US", { maximumFractionDigits: 2 })} TON
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
              </div>
            </div>
          ) : (
            /* Step 4: Celebration - full bottom panel */
            <div className="bg-black/70 backdrop-blur-xl border-t border-white/10 rounded-t-2xl px-6 py-8 sm:px-8">
              <div className="max-w-2xl mx-auto text-center animate-fade-in">
                <div className="text-accent-amber text-sm font-semibold tracking-widest mb-4 animate-pulse">
                  {t.stakingScreen.step4CardUnlocked}
                </div>

                <div className={`flex justify-center mb-6 transition-all duration-700 ${cardRevealed ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-75 rotate-12"}`}>
                  <UnlockedCard tier={cardTier} />
                </div>

                <p className="text-gray-100 text-base leading-relaxed mb-6">
                  {dialogue}
                </p>

                <button
                  onClick={() => router.push("/dashboard")}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold text-lg glow-blue hover:scale-105 transition-transform"
                >
                  {t.stakingScreen.goToDashboard} →
                </button>
              </div>
            </div>
          )}
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

// ─── Dialogue Inline (matches OnboardingQuest DialogueBox) ───────────

function DialogueInline({ text, mood, stepProgress }: { text: string; mood: Mood; stepProgress: string }) {
  const { displayed, done, skip } = useTypewriter(text, 30);

  return (
    <div className="cursor-pointer select-none" onClick={() => !done && skip()}>
      <div className="flex items-center justify-between mb-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-cyan/10 border border-accent-cyan/30">
          <span className="text-accent-cyan font-bold text-sm tracking-wide">Toki</span>
          <span className="text-xs text-accent-cyan/60">{mood}</span>
        </div>
        <span className="text-xs text-gray-500 tabular-nums">{stepProgress}</span>
      </div>
      <p className="text-gray-100 text-base sm:text-lg leading-relaxed">
        {displayed}
        {!done && (
          <span className="inline-block w-0.5 h-5 bg-accent-cyan ml-0.5 animate-pulse align-middle" />
        )}
      </p>
    </div>
  );
}

// ─── Unlocked Card ───────────────────────────────────────────────────

function UnlockedCard({ tier }: { tier: typeof CARD_TIERS[number] }) {
  const starsStr = "\u2605".repeat(tier.stars) + "\u2606".repeat(5 - tier.stars);

  return (
    <div style={{ perspective: "1200px" }}>
      <div className="relative w-[320px] h-[200px] rounded-2xl overflow-hidden shadow-2xl border border-white/20 hover:scale-105 transition-transform duration-300">
        <Image src={tier.bgImage} alt={tier.tier} fill className="object-cover" />
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
  );
}
