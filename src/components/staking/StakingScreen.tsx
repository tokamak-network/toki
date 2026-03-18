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
  depositManagerAbi,
} from "@/lib/abi";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useAchievement } from "@/components/providers/AchievementProvider";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useEip7702 } from "@/hooks/useEip7702";
import { useSessionKey } from "@/hooks/useSessionKey";
import { calculateLevel, CARD_TIERS, type CardTier } from "@/lib/achievements";
import { fetchStakingData } from "@/lib/staking";
import OperatorCard from "@/components/dashboard/OperatorCard";
import { chain, publicClient, isTestnet } from "@/lib/chain";

// ─── Types ───────────────────────────────────────────────────────────

interface Operator {
  address: string;
  name: string;
  totalStaked: string;
  myStaked: string;          // stakeOf minus pendingUnstaked (actual available)
  myStakedRaw: bigint;       // raw WTON bigint (27 decimals) for precise unstaking
  pendingUnstaked: string;   // amount waiting for withdrawal
  commissionRate: number;    // percentage, negative = rebate
}

type Mood = "welcome" | "explain" | "thinking" | "excited" | "proud" | "cheer" | "wink" | "presenting" | "celebrate" | "card-reveal" | "surprised" | "confused" | "shy" | "determined" | "pointing" | "reading" | "crying-happy" | "peace" | "worried" | "laughing";

type Step = 0 | 1 | 2 | 3 | 4 | 10 | 11 | 12 | 13;

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
  pointing: "/characters/toki-explain.png",
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
  0: "/backgrounds/staking-dawn.png",
  1: "/backgrounds/staking-dawn.png",
  2: "/backgrounds/staking-dawn.png",
  3: "/backgrounds/staking-dawn.png",
  4: "/backgrounds/staking-sunrise.png",
  10: "/backgrounds/staking-dawn.png",
  11: "/backgrounds/staking-dawn.png",
  12: "/backgrounds/staking-dawn.png",
  13: "/backgrounds/staking-sunrise.png",
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
  const [autoSelectedIndex, setAutoSelectedIndex] = useState<number | undefined>(undefined);
  const [guidanceType, setGuidanceType] = useState<"none" | "new-user" | "no-ton" | "has-staked">("none");
  const [showManualSelect, setShowManualSelect] = useState(false);
  const [showGasExplain, setShowGasExplain] = useState(false);
  const [apr, setApr] = useState<number | null>(null);
  const selectedOpRef = useRef(selectedOp);
  selectedOpRef.current = selectedOp;

  // VN state
  const [step, setStep] = useState<Step>(1);
  const [cardRevealed, setCardRevealed] = useState(false);
  const [hoverDialogue] = useState<string | null>(null);

  // Unstaking state
  const [unstakeOp, setUnstakeOp] = useState<string>("");
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const [unstakeIsMax, setUnstakeIsMax] = useState(false);
  const [unstaking, setUnstaking] = useState(false);
  const [unstakeTxHash, setUnstakeTxHash] = useState<string | null>(null);
  const [unstakeError, setUnstakeError] = useState<string | null>(null);

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

  // ─── Fetch TON Balance (independent, runs first) ─────────────────

  const fetchBalance = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const tonBal = await publicClient.readContract({
        address: tonAddr, abi: tonTokenAbi, functionName: "balanceOf", args: [addr],
      });
      setTonBalance(formatUnits(tonBal, 18));
    } catch (e) {
      console.error("Failed to fetch TON balance:", e);
    }
  }, [walletAddress, tonAddr, addr]);

  useEffect(() => {
    if (walletAddress) fetchBalance();
  }, [walletAddress, fetchBalance]);

  // ─── Fetch Operators (batched to avoid rate limiting) ─────────────

  const fetchOperators = useCallback(async () => {
    if (!walletAddress) return;
    setLoading(true);
    try {
      const numLayer2s = await publicClient.readContract({
        address: registryAddr,
        abi: layer2RegistryAbi,
        functionName: "numLayer2s",
      });

      const count = Number(numLayer2s);

      // Batch layer2ByIndex calls via multicall to avoid 429 rate limiting
      const BATCH_SIZE = 50;
      const addresses: `0x${string}`[] = [];
      for (let start = 0; start < count; start += BATCH_SIZE) {
        const end = Math.min(start + BATCH_SIZE, count);
        const batchContracts = Array.from({ length: end - start }, (_, i) => ({
          address: registryAddr,
          abi: layer2RegistryAbi,
          functionName: "layer2ByIndex" as const,
          args: [BigInt(start + i)] as const,
        }));
        const batchResults = await publicClient.multicall({ contracts: batchContracts, allowFailure: true });
        for (const r of batchResults) {
          if (r.status === "success") addresses.push(r.result as `0x${string}`);
        }
      }

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
      const pendingUnstakedContracts = addresses.map((a) => ({
        address: depositManagerAddr, abi: depositManagerAbi, functionName: "pendingUnstaked" as const,
        args: [a, addr] as const,
      }));

      const [memoResults, stakedResults, myStakedResults, commResults, commNegResults, pendingUnstakedResults] = await Promise.all([
        publicClient.multicall({ contracts: memoContracts, allowFailure: true }),
        publicClient.multicall({ contracts: stakedContracts, allowFailure: true }),
        publicClient.multicall({ contracts: myStakedContracts, allowFailure: true }),
        publicClient.multicall({ contracts: commissionContracts, allowFailure: true }),
        publicClient.multicall({ contracts: commissionNegContracts, allowFailure: true }),
        publicClient.multicall({ contracts: pendingUnstakedContracts, allowFailure: true }),
      ]);

      const ops: Operator[] = addresses.map((a, i) => {
        // Commission rate: RAY format (1e27 = 100%)
        const rawRate = commResults[i].status === "success" ? Number(formatUnits(commResults[i].result as bigint, 27)) * 100 : 0;
        const isNeg = commNegResults[i].status === "success" ? (commNegResults[i].result as boolean) : false;
        const rawStaked = myStakedResults[i].status === "success" ? (myStakedResults[i].result as bigint) : BigInt(0);
        const rawPending = pendingUnstakedResults[i].status === "success" ? (pendingUnstakedResults[i].result as bigint) : BigInt(0);
        // Subtract pending unstaked from stakeOf to show actual available staked amount
        const netStaked = rawStaked > rawPending ? rawStaked - rawPending : BigInt(0);
        return {
          address: a,
          name: memoResults[i].status === "success" ? (memoResults[i].result as string) || `Operator ${i}` : `Operator ${i}`,
          totalStaked: stakedResults[i].status === "success" ? formatUnits(stakedResults[i].result as bigint, 27) : "0",
          myStaked: formatUnits(netStaked, 27),
          myStakedRaw: netStaked,
          pendingUnstaked: formatUnits(rawPending, 27),
          commissionRate: isNeg ? -rawRate : rawRate,
        };
      });

      ops.sort((a, b) => Number(b.totalStaked) - Number(a.totalStaked));
      const topOps = ops.slice(0, 10);
      setOperators(topOps);

      // Auto-select best operator (lowest fee → highest staked)
      if (!selectedOpRef.current) {
        const best = [...topOps].sort((a, b) => {
          if (a.commissionRate !== b.commissionRate) return a.commissionRate - b.commissionRate;
          return Number(b.totalStaked) - Number(a.totalStaked);
        })[0];
        if (best) {
          const idx = topOps.findIndex((o) => o.address === best.address);
          setSelectedOp(best.address);
          setAutoSelectedIndex(idx);
        }
      }
    } catch (e) {
      console.error("Failed to fetch operators:", e);
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress, seigManagerAddr, registryAddr, addr]);

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

  // ─── Fetch APR ────────────────────────────────────────────────────

  useEffect(() => {
    fetchStakingData().then((data) => setApr(data.apr)).catch(console.error);
  }, []);

  // ─── New user / no-TON guidance ────────────────────────────────────

  useEffect(() => {
    if (loading) return;
    const hasTon = Number(tonBalance) > 0;
    const isNewUser = storage.unlocked.length === 0;
    const hasStaked = operators.some((o) => Number(o.myStaked) > 0);

    if (hasStaked) {
      setGuidanceType("has-staked");
      setStep(0);
    } else if (isNewUser && !hasTon) {
      setGuidanceType("new-user");
      setStep(0);
    } else if (!isNewUser && !hasTon) {
      setGuidanceType("no-ton");
      setStep(0);
    }
  }, [loading, storage.unlocked.length, tonBalance, operators]);

  // ─── Handlers ──────────────────────────────────────────────────────

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

  // ─── Unstaking Handler ───────────────────────────────────────────────

  const handleRequestWithdrawal = async () => {
    if (!unstakeAmount || !unstakeOp) return;
    setUnstaking(true);
    setUnstakeError(null);
    setUnstakeTxHash(null);

    try {
      // Use raw bigint when MAX was pressed to avoid rounding issues
      const wtonAmount = unstakeIsMax && selectedUnstakeOperator
        ? selectedUnstakeOperator.myStakedRaw
        : parseUnits(unstakeAmount, 27);
      let hash: `0x${string}`;

      if (smartAccountClient) {
        hash = await smartAccountClient.sendTransaction({
          calls: [{
            to: depositManagerAddr,
            data: encodeFunctionData({
              abi: depositManagerAbi,
              functionName: "requestWithdrawal",
              args: [unstakeOp as `0x${string}`, wtonAmount],
            }),
          }],
        });
      } else {
        const provider = await getEthereumProvider();
        const walletClient = createWalletClient({ chain, transport: custom(provider), account: addr });
        hash = await walletClient.writeContract({
          address: depositManagerAddr,
          abi: depositManagerAbi,
          functionName: "requestWithdrawal",
          args: [unstakeOp as `0x${string}`, wtonAmount],
        });
      }

      setUnstakeTxHash(hash);
      await publicClient.waitForTransactionReceipt({ hash });
      setStep(13);
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      console.error("Unstake request failed:", errMsg);
      if (errMsg.includes("User rejected")) {
        setUnstakeError(t.dashboard.txRejected);
      } else if (errMsg.includes("insufficient") || errMsg.includes("funds")) {
        setUnstakeError(t.dashboard.insufficientTonForGas);
      } else if (errMsg.includes("Paymaster")) {
        setUnstakeError(t.dashboard.paymasterValidationFailed);
      } else {
        setUnstakeError(errMsg.slice(0, 200));
      }
    }
    setUnstaking(false);
  };

  // ─── Derived State ─────────────────────────────────────────────────

  const selectedOperator = operators.find((o) => o.address === selectedOp);
  const currentLevel = calculateLevel(storage.score);
  const cardTier = CARD_TIERS[Math.min(currentLevel, 5) - 1];

  function getMood(): Mood {
    if (step === 0) return "welcome";
    if (step === 4) return cardRevealed ? "celebrate" : "card-reveal";
    // Unstaking flow moods
    if (step === 10) return "explain";
    if (step === 11) return "cheer";
    if (step === 12) {
      if (unstaking) return "excited";
      if (unstakeError) return "thinking";
      return "determined";
    }
    if (step === 13) return "proud";
    // Only change for meaningful state transitions
    if (staking) return "excited";
    if (error) return "thinking";
    // Each step gets one stable mood — no flicker on sub-state changes
    if (step === 3) return "cheer";
    if (step === 2) return "cheer";
    if (step === 1) return "welcome";
    return "welcome";
  }

  const selectedUnstakeOperator = operators.find((o) => o.address === unstakeOp);

  function getDialogue(): string {
    const s = t.stakingScreen;
    if (step === 0) {
      if (guidanceType === "has-staked") return s.hasStakedDesc;
      return guidanceType === "no-ton" ? s.noTonDesc : s.onboardingPromptDesc;
    }
    // Unstaking flow dialogues
    if (step === 10) return s.unstakeStep1Dialogue;
    if (step === 11) {
      if (unstakeAmount && Number(unstakeAmount) > 0) {
        return s.unstakeStep2Ready.replace("{amount}", unstakeAmount);
      }
      return s.unstakeStep2Dialogue
        .replace("{name}", selectedUnstakeOperator?.name || "")
        .replace("{amount}", Number(selectedUnstakeOperator?.myStaked || 0).toLocaleString("en-US", { maximumFractionDigits: 2 }));
    }
    if (step === 12) {
      if (unstaking) return s.unstakeStep3Processing;
      if (unstakeError) return s.unstakeStep3Error;
      return s.unstakeStep3Dialogue;
    }
    if (step === 13) return s.unstakeSuccessDialogue;
    if (step === 1) {
      if (autoSelectedIndex !== undefined && !showManualSelect) {
        return apr !== null
          ? s.step1AutoSelected.replace("{apr}", apr.toFixed(1))
          : s.step1TokiPick;
      }
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
      {([0, 1, 2, 3, 4, 10, 11, 12, 13] as Step[]).map((s) => (
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
          {/* Left: Toki Character (hidden on mobile) */}
          <div className="hidden md:flex w-[40%] items-end justify-center">
            <TokiCharacter mood={mood} />
          </div>

          {/* Right: Interactive Panel (full width on mobile) */}
          <div className="w-full md:w-[60%] flex items-end justify-center pb-4 px-4 md:px-0">
            <div className="w-full max-w-sm animate-slide-up">
            <div className="bg-black/50 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-[0_0_40px_rgba(0,0,0,0.3)]">
                {/* Step indicator + back button (staking steps 1-3 only) */}
                {step >= 1 && step <= 3 && (
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
                      onClick={() => { setError(null); setTxHash(null); setStep((step - 1) as Step); }}
                      className="px-3 py-1 rounded-lg bg-white/10 text-gray-400 text-xs hover:bg-white/20 transition-colors"
                    >
                      ← Back
                    </button>
                  )}
                </div>
                )}

                {/* Step content */}
                <div className="space-y-3">
                  {/* Step 0: Guidance (new user, no TON, or has staked) */}
                  {step === 0 && (
                    <div className="space-y-4">
                      <h3 className="text-white text-lg font-bold text-center">
                        {guidanceType === "has-staked"
                          ? t.stakingScreen.hasStakedTitle
                          : guidanceType === "no-ton"
                          ? t.stakingScreen.noTonTitle
                          : t.stakingScreen.onboardingPromptTitle}
                      </h3>
                      <div className="space-y-2">
                        {guidanceType === "has-staked" ? (
                          <>
                            <button
                              onClick={() => setStep(1)}
                              className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-blue to-accent-cyan text-white font-semibold text-sm hover:scale-[1.02] transition-transform shadow-lg shadow-accent-cyan/20"
                            >
                              {t.stakingScreen.hasStakedStakeMore}
                            </button>
                            <button
                              onClick={() => {
                                setUnstakeOp("");
                                setUnstakeAmount("");
                                setUnstakeError(null);
                                setUnstakeTxHash(null);
                                setStep(10);
                              }}
                              className="w-full py-3 rounded-xl bg-white/10 text-gray-300 font-medium text-sm hover:bg-white/15 transition-colors border border-white/10"
                            >
                              {t.stakingScreen.hasStakedUnstake}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => router.push("/onboarding")}
                              className={`w-full py-3 rounded-xl font-semibold text-sm hover:scale-[1.02] transition-transform shadow-lg ${
                                guidanceType === "no-ton"
                                  ? "bg-gradient-to-r from-accent-amber to-orange-500 text-white shadow-accent-amber/20"
                                  : "bg-gradient-to-r from-accent-blue to-accent-cyan text-white shadow-accent-cyan/20"
                              }`}
                            >
                              {guidanceType === "no-ton"
                                ? t.stakingScreen.noTonGoQuest
                                : t.stakingScreen.onboardingPromptYes}
                            </button>
                            {guidanceType !== "no-ton" && (
                              <button
                                onClick={() => setStep(1)}
                                className="w-full py-3 rounded-xl bg-white/10 text-gray-400 font-medium text-sm hover:bg-white/15 transition-colors"
                              >
                                {t.stakingScreen.onboardingPromptNo}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 1: Operator Selection */}
                  {step === 1 && (
                    <>
                      {!showManualSelect ? (
                        /* Simplified: Toki auto-selected */
                        <>
                          {selectedOperator && (
                            <div className="space-y-3">
                              <div className="p-4 rounded-xl bg-white/5 border border-accent-cyan/20">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center text-sm font-bold text-accent-cyan">
                                    {selectedOperator.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-white font-medium text-sm">{selectedOperator.name}</div>
                                    <div className="text-xs text-gray-500">
                                      {Number(selectedOperator.totalStaked).toLocaleString("en-US", { maximumFractionDigits: 0 })} TON
                                    </div>
                                  </div>
                                  <div className="text-accent-cyan text-xs font-semibold px-2 py-1 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 shrink-0">
                                    {t.dashboard.tokiAutoSelected}
                                  </div>
                                </div>
                              </div>

                              {apr !== null && (
                                <div className="flex items-center justify-between p-3 rounded-lg bg-accent-amber/5 border border-accent-amber/15">
                                  <span className="text-gray-400 text-sm">{t.stakingScreen.currentApr}</span>
                                  <span className="text-accent-amber font-bold text-lg font-mono-num">~{apr.toFixed(1)}%</span>
                                </div>
                              )}
                            </div>
                          )}

                          <button
                            onClick={() => setStep(2)}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-blue to-accent-cyan text-white font-semibold text-sm hover:scale-[1.02] transition-transform"
                          >
                            {t.stakingScreen.nextStep} →
                          </button>
                          <button
                            onClick={() => setShowManualSelect(true)}
                            className="w-full text-center text-xs text-gray-500 hover:text-gray-300 transition-colors py-1"
                          >
                            {t.stakingScreen.manualSelectButton}
                          </button>
                        </>
                      ) : (
                        /* Manual: full operator list */
                        <>
                          <OperatorCard
                            operators={operators}
                            selectedOp={selectedOp}
                            onSelect={(address) => {
                              setSelectedOp(address);
                              setAutoSelectedIndex(undefined);
                            }}
                            shuffling={false}
                            autoSelectedIndex={autoSelectedIndex}
                            apr={apr}
                          />

                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                const best = [...operators].sort((a, b) => {
                                  if (a.commissionRate !== b.commissionRate) return a.commissionRate - b.commissionRate;
                                  return Number(b.totalStaked) - Number(a.totalStaked);
                                })[0];
                                if (best) {
                                  const idx = operators.findIndex((o) => o.address === best.address);
                                  setSelectedOp(best.address);
                                  setAutoSelectedIndex(idx);
                                }
                                setShowManualSelect(false);
                              }}
                              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-accent-amber/20 to-yellow-500/20 border border-accent-amber/30 text-accent-amber text-sm font-semibold hover:border-accent-amber/50 hover:scale-[1.02] transition-all"
                            >
                              {t.stakingScreen.backToAutoSelect}
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
                        <div className="space-y-0">
                          <button
                            onClick={() => setShowGasExplain(!showGasExplain)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-amber/10 border border-accent-amber/20 hover:bg-accent-amber/15 transition-colors text-left"
                          >
                            <span className="text-accent-amber text-sm">⛽</span>
                            <span className="text-xs text-accent-amber/80 flex-1">
                              {t.stakingScreen.estimatedGasCost.replace("{amount}", String(gasReserveTon))}
                            </span>
                            <span className={`text-accent-amber/50 text-[10px] transition-transform ${showGasExplain ? "rotate-180" : ""}`}>▼</span>
                          </button>
                          {!showGasExplain && (
                            <button
                              onClick={() => setShowGasExplain(true)}
                              className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors px-3 pt-1"
                            >
                              {t.stakingScreen.gasExplainToggle}
                            </button>
                          )}
                          {showGasExplain && (
                            <div className="mt-2 p-3 rounded-lg bg-white/5 border border-white/10 space-y-2 animate-fade-in">
                              <div className="flex items-center gap-2 mb-1">
                                <Image src="/characters/toki-explain.png" alt="Toki" width={28} height={28} className="rounded-full" />
                                <span className="text-accent-cyan text-xs font-bold">{t.stakingScreen.gasExplainTitle}</span>
                              </div>
                              <p className="text-xs text-gray-400 leading-relaxed">{t.stakingScreen.gasExplainBody1}</p>
                              <p className="text-xs text-gray-400 leading-relaxed">{t.stakingScreen.gasExplainBody2}</p>
                              <p className="text-xs text-gray-500 leading-relaxed">{t.stakingScreen.gasExplainBody3}</p>
                            </div>
                          )}
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
                            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white text-lg placeholder-gray-600 focus:outline-none focus:border-accent-cyan/50 font-mono-num [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
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
                          onClick={() => { setError(null); setTxHash(null); setStep(3); }}
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
                          <span className="text-white text-sm font-mono-num">{Number(amount).toLocaleString("en-US", { maximumFractionDigits: 2 })} TON</span>
                        </div>
                        {smartAccountClient && paymasterMode === "sponsor" && (
                          <div className="flex justify-between p-3 rounded-lg bg-green-500/5">
                            <span className="text-gray-400 text-sm">Gas</span>
                            <span className="text-green-400 text-sm font-medium">{t.dashboard.gaslessShort}</span>
                          </div>
                        )}
                      </div>

                      {/* Unstaking delay notice */}
                      <div className="p-3 rounded-lg bg-accent-amber/5 border border-accent-amber/15">
                        <div className="flex items-start gap-2">
                          <span className="text-accent-amber text-sm mt-0.5 shrink-0">⏳</span>
                          <div>
                            <div className="text-accent-amber text-xs font-semibold">{t.stakingScreen.unstakingNotice}</div>
                            <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{t.stakingScreen.unstakingNoticeDetail}</p>
                          </div>
                        </div>
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
                        <div className="space-y-2 animate-fade-in">
                          <button
                            onClick={() => router.push("/dashboard")}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold text-sm glow-blue hover:scale-[1.02] transition-transform"
                          >
                            {t.stakingScreen.goToDashboard}
                          </button>
                          <button
                            onClick={() => router.push("/explore")}
                            className="w-full py-3 rounded-xl bg-white/10 border border-white/10 text-gray-300 font-medium text-sm hover:bg-white/15 hover:scale-[1.02] transition-all"
                          >
                            {t.stakingScreen.goToExplore}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ─── Unstaking Flow ─────────────────────────────── */}

                  {/* Step 10: Unstake operator selection */}
                  {step === 10 && (
                    <>
                      {/* Step indicator for unstaking */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                                s === 1 ? "bg-accent-cyan/20 border-2 border-accent-cyan text-accent-cyan" :
                                "bg-white/10 text-gray-600"
                              }`}>
                                {s}
                              </div>
                              {s < 3 && (
                                <div className="w-6 h-0.5 bg-white/10" />
                              )}
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => setStep(0)}
                          className="px-3 py-1 rounded-lg bg-white/10 text-gray-400 text-xs hover:bg-white/20 transition-colors"
                        >
                          ← Back
                        </button>
                      </div>

                      <div className="space-y-2 max-h-[280px] overflow-y-auto scrollbar-thin">
                        {operators.filter((o) => Number(o.myStaked) > 0).map((op) => (
                          <button
                            key={op.address}
                            onClick={() => {
                              setUnstakeOp(op.address);
                              setUnstakeAmount("");
                              setUnstakeError(null);
                              setUnstakeTxHash(null);
                              setStep(11);
                            }}
                            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:border-accent-cyan/30 hover:bg-white/10 transition-all text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center text-sm font-bold text-accent-cyan">
                                {op.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-white font-medium text-sm">{op.name}</div>
                                <div className="text-xs text-gray-500">
                                  {op.address.slice(0, 10)}...{op.address.slice(-6)}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-accent-cyan text-sm font-mono-num">
                                  {Number(op.myStaked).toLocaleString("en-US", { maximumFractionDigits: 2 })}
                                </div>
                                <div className="text-xs text-gray-500">TON</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Step 11: Unstake amount input */}
                  {step === 11 && (
                    <>
                      {/* Step indicator for unstaking */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                                s < 2 ? "bg-accent-cyan text-white" :
                                s === 2 ? "bg-accent-cyan/20 border-2 border-accent-cyan text-accent-cyan" :
                                "bg-white/10 text-gray-600"
                              }`}>
                                {s < 2 ? "\u2713" : s}
                              </div>
                              {s < 3 && (
                                <div className={`w-6 h-0.5 transition-colors duration-500 ${s < 2 ? "bg-accent-cyan" : "bg-white/10"}`} />
                              )}
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => setStep(10)}
                          className="px-3 py-1 rounded-lg bg-white/10 text-gray-400 text-xs hover:bg-white/20 transition-colors"
                        >
                          ← Back
                        </button>
                      </div>

                      {/* Selected operator info */}
                      {selectedUnstakeOperator && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white">
                            {selectedUnstakeOperator.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white font-medium">{selectedUnstakeOperator.name}</div>
                            <div className="text-xs text-gray-500">
                              {t.dashboard.myStake}: {Number(selectedUnstakeOperator.myStaked).toLocaleString("en-US", { maximumFractionDigits: 2 })} TON
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Delay warning */}
                      <div className="p-3 rounded-lg bg-accent-amber/5 border border-accent-amber/15">
                        <div className="flex items-start gap-2">
                          <span className="text-accent-amber text-sm mt-0.5 shrink-0">⏳</span>
                          <div className="text-xs text-accent-amber/80">
                            {t.stakingScreen.unstakeDelayWarning}
                          </div>
                        </div>
                      </div>

                      {/* Amount input */}
                      <div>
                        <div className="relative">
                          <input
                            type="number"
                            value={unstakeAmount}
                            onChange={(e) => { setUnstakeAmount(e.target.value); setUnstakeIsMax(false); }}
                            placeholder="0.0"
                            min="0"
                            step="any"
                            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white text-lg placeholder-gray-600 focus:outline-none focus:border-accent-cyan/50 font-mono-num [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                          />
                          <button
                            onClick={() => {
                              const raw = selectedUnstakeOperator?.myStaked || "0";
                              setUnstakeAmount(String(Math.floor(Number(raw) * 100) / 100));
                              setUnstakeIsMax(true);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-accent-cyan/10 text-accent-cyan text-xs font-semibold hover:bg-accent-cyan/20 transition-colors"
                          >
                            MAX
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          {t.dashboard.myStake}: {Number(selectedUnstakeOperator?.myStaked || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })} TON
                        </div>
                      </div>

                      {unstakeAmount && Number(unstakeAmount) > 0 && (
                        <button
                          onClick={() => { setUnstakeError(null); setUnstakeTxHash(null); setStep(12); }}
                          disabled={Number(unstakeAmount) > Number(selectedUnstakeOperator?.myStaked || 0)}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold text-sm hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {t.stakingScreen.nextStep} →
                        </button>
                      )}
                    </>
                  )}

                  {/* Step 12: Unstake execute */}
                  {step === 12 && (
                    <>
                      {/* Step indicator for unstaking */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                                s < 3 ? "bg-accent-cyan text-white" :
                                s === 3 ? "bg-accent-cyan/20 border-2 border-accent-cyan text-accent-cyan" :
                                "bg-white/10 text-gray-600"
                              }`}>
                                {s < 3 ? "\u2713" : s}
                              </div>
                              {s < 3 && (
                                <div className={`w-6 h-0.5 transition-colors duration-500 ${s < 3 ? "bg-accent-cyan" : "bg-white/10"}`} />
                              )}
                            </div>
                          ))}
                        </div>
                        {!unstaking && (
                          <button
                            onClick={() => setStep(11)}
                            className="px-3 py-1 rounded-lg bg-white/10 text-gray-400 text-xs hover:bg-white/20 transition-colors"
                          >
                            ← Back
                          </button>
                        )}
                      </div>

                      {/* Summary */}
                      <div className="space-y-2">
                        <div className="flex justify-between p-3 rounded-lg bg-white/5">
                          <span className="text-gray-400 text-sm">{t.stakingScreen.step1Title}</span>
                          <span className="text-white text-sm font-medium">{selectedUnstakeOperator?.name}</span>
                        </div>
                        <div className="flex justify-between p-3 rounded-lg bg-white/5">
                          <span className="text-gray-400 text-sm">{t.stakingScreen.step2Title}</span>
                          <span className="text-white text-sm font-mono-num">{Number(unstakeAmount).toLocaleString("en-US", { maximumFractionDigits: 2 })} TON</span>
                        </div>
                      </div>

                      {/* 2-step process notice */}
                      <div className="p-3 rounded-lg bg-accent-cyan/5 border border-accent-cyan/15">
                        <div className="flex items-start gap-2">
                          <span className="text-accent-cyan text-sm mt-0.5 shrink-0">💡</span>
                          <div className="text-xs text-accent-cyan/80 leading-relaxed">
                            {t.stakingScreen.unstake2StepNotice}
                          </div>
                        </div>
                      </div>

                      {!unstakeError ? (
                        <button
                          onClick={handleRequestWithdrawal}
                          disabled={unstaking}
                          className="w-full py-4 rounded-xl bg-gradient-to-r from-red-500/80 to-red-600/80 text-white font-bold text-lg disabled:opacity-50 hover:scale-[1.02] transition-transform shadow-lg shadow-red-500/20"
                        >
                          {unstaking ? t.stakingScreen.unstakeStep3Processing : t.stakingScreen.unstakeRequestButton}
                        </button>
                      ) : (
                        <>
                          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                            <div className="text-sm text-red-400 break-all">{unstakeError}</div>
                          </div>
                          <button
                            onClick={() => { setUnstakeError(null); setUnstakeTxHash(null); }}
                            className="w-full py-3 rounded-xl bg-white/10 text-white font-semibold text-sm hover:bg-white/15 transition-colors"
                          >
                            {t.stakingScreen.retryButton}
                          </button>
                        </>
                      )}

                      {unstakeTxHash && !unstakeError && (
                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                          <div className="text-sm text-green-400">{t.dashboard.txSubmitted}</div>
                          <a
                            href={`https://${isTestnet ? "sepolia." : ""}etherscan.io/tx/${unstakeTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-green-500 hover:text-green-300 font-mono break-all"
                          >
                            {unstakeTxHash}
                          </a>
                        </div>
                      )}
                    </>
                  )}

                  {/* Step 13: Unstake completion */}
                  {step === 13 && (
                    <div className="space-y-3 animate-fade-in">
                      <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                        <div className="text-green-400 text-lg font-bold mb-1">✓</div>
                        <div className="text-green-400 text-sm font-medium">
                          {t.stakingScreen.unstakeSuccessDialogue}
                        </div>
                      </div>

                      {/* 2-step reminder */}
                      <div className="p-3 rounded-lg bg-accent-amber/5 border border-accent-amber/15">
                        <div className="flex items-start gap-2">
                          <span className="text-accent-amber text-sm mt-0.5 shrink-0">⏳</span>
                          <div className="text-xs text-accent-amber/80 leading-relaxed">
                            {t.stakingScreen.unstake2StepNotice}
                          </div>
                        </div>
                      </div>

                      {unstakeTxHash && (
                        <div className="p-3 rounded-lg bg-white/5">
                          <a
                            href={`https://${isTestnet ? "sepolia." : ""}etherscan.io/tx/${unstakeTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-accent-cyan hover:text-accent-cyan/80 font-mono break-all"
                          >
                            {unstakeTxHash}
                          </a>
                        </div>
                      )}

                      <button
                        onClick={() => router.push("/dashboard?panel=wallet")}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-amber to-orange-500 text-white font-semibold text-sm hover:scale-[1.02] transition-transform shadow-lg shadow-accent-amber/20"
                      >
                        🔐 {t.stakingScreen.goToVault}
                      </button>
                      <button
                        onClick={() => {
                          setUnstakeOp("");
                          setUnstakeAmount("");
                          setUnstakeError(null);
                          setUnstakeTxHash(null);
                          setStep(0);
                          fetchOperators();
                          fetchBalance();
                        }}
                        className="w-full py-3 rounded-xl bg-white/10 border border-white/10 text-gray-300 font-medium text-sm hover:bg-white/15 hover:scale-[1.02] transition-all"
                      >
                        {t.stakingScreen.hasStakedStakeMore}
                      </button>
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
            stepProgress={step === 0
              ? ""
              : step === 4
              ? "Complete!"
              : step === 13
              ? "Complete!"
              : step >= 10
              ? t.stakingScreen.stepLabel.replace("{current}", String(step - 9)).replace("{total}", "3")
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
