// ─── Chat Staking Flow: state machine for in-chat staking ─────────────
// States: idle → fetching-data → show-result → ask-amount → confirm → executing → success/error

import { useState, useRef, useCallback } from "react";
import type { Mood } from "@/lib/toki-dialogue";
import type { ChatActionButton } from "@/lib/toki-actions";
import {
  fetchTopOperators,
  tokiPick,
  fetchTonBalance,
  executeStaking,
  type OperatorInfo,
} from "@/lib/staking-service";
import { isTestnet } from "@/lib/chain";

type FlowStep =
  | "idle"
  | "fetching-data"
  | "show-result"
  | "ask-amount"
  | "confirm"
  | "executing"
  | "success"
  | "error";

export interface FlowMessage {
  text: string;
  mood: Mood;
  actions?: ChatActionButton[];
}

interface UseChatStakingFlowDeps {
  locale: string;
  userAddress?: string;
  smartAccountClient?: {
    sendTransaction: (args: { calls: { to: `0x${string}`; data: `0x${string}` }[] }) => Promise<`0x${string}`>;
  };
  sessionKey?: {
    delegationReady: boolean;
    stakeWithDelegation: (operator: `0x${string}`, amount: string) => Promise<`0x${string}`>;
  };
  getEthereumProvider?: () => Promise<unknown>;
  t: {
    chatActions: {
      fetchingOperators: string;
      tokiPickResult: string;
      askAmount: string;
      stakeAllButton: string;
      cancelButton: string;
      confirmStake: string;
      confirmButton: string;
      executing: string;
      success: string;
      viewTx: string;
      insufficientBalance: string;
      errorRejected: string;
      errorInsufficientGas: string;
      errorGeneric: string;
      retryButton: string;
      cancelled: string;
      noBalance: string;
      invalidAmount: string;
      exceedsBalance: string;
    };
  };
}

export function useChatStakingFlow(deps: UseChatStakingFlowDeps) {
  const { locale, userAddress, smartAccountClient, sessionKey, getEthereumProvider, t } = deps;

  const [step, setStep] = useState<FlowStep>("idle");
  const operatorRef = useRef<OperatorInfo | null>(null);
  const balanceRef = useRef<string>("0");
  const amountRef = useRef<string>("");

  const isActive = step !== "idle";

  const start = useCallback(async (): Promise<FlowMessage[]> => {
    if (!userAddress) return [];

    setStep("fetching-data");

    const messages: FlowMessage[] = [{
      text: t.chatActions.fetchingOperators,
      mood: "thinking",
    }];

    try {
      const [operators, balance] = await Promise.all([
        fetchTopOperators(),
        fetchTonBalance(userAddress as `0x${string}`),
      ]);

      const best = tokiPick(operators);
      operatorRef.current = best;
      balanceRef.current = balance;

      if (!best) {
        setStep("idle");
        return [...messages, {
          text: t.chatActions.errorGeneric,
          mood: "confused" as Mood,
        }];
      }

      const balNum = Number(balance);

      if (balNum <= 0) {
        setStep("idle");
        return [...messages, {
          text: t.chatActions.noBalance,
          mood: "explain" as Mood,
        }];
      }

      const rateStr = best.commissionRate >= 0
        ? best.commissionRate.toFixed(1)
        : best.commissionRate.toFixed(1);

      const resultMsg = t.chatActions.tokiPickResult
        .replace("{name}", best.name)
        .replace("{rate}", rateStr);

      const askMsg = t.chatActions.askAmount
        .replace("{balance}", balNum.toLocaleString("en-US", { maximumFractionDigits: 2 }));

      setStep("ask-amount");

      return [
        ...messages,
        { text: resultMsg, mood: "cheer" as Mood },
        {
          text: askMsg,
          mood: "explain" as Mood,
          actions: [
            { id: "stake-max", labelKo: t.chatActions.stakeAllButton, labelEn: t.chatActions.stakeAllButton, variant: "primary" as const },
            { id: "staking-cancel", labelKo: t.chatActions.cancelButton, labelEn: t.chatActions.cancelButton, variant: "secondary" as const },
          ],
        },
      ];
    } catch (e) {
      console.error("Staking flow fetch error:", e);
      setStep("idle");
      return [...messages, {
        text: t.chatActions.errorGeneric,
        mood: "worried" as Mood,
      }];
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAddress, t]);

  const handleAction = useCallback(async (actionId: string): Promise<FlowMessage[]> => {
    const operator = operatorRef.current;
    const balance = balanceRef.current;

    switch (actionId) {
      case "stake-max": {
        // Use balance minus small gas reserve
        const gasReserve = 2; // rough TON reserve for gas
        const maxAmount = Math.max(0, Number(balance) - gasReserve);
        if (maxAmount <= 0) {
          return [{
            text: t.chatActions.insufficientBalance.replace("{balance}", Number(balance).toFixed(2)),
            mood: "worried",
          }];
        }
        const amtStr = String(Math.floor(maxAmount * 100) / 100);
        amountRef.current = amtStr;
        setStep("confirm");

        const confirmText = t.chatActions.confirmStake
          .replace("{amount}", amtStr)
          .replace("{operator}", operator?.name || "");

        return [{
          text: confirmText,
          mood: "determined",
          actions: [
            {
              id: "confirm-stake",
              labelKo: locale === "ko"
                ? `${amtStr} TON 스테이킹`
                : `Stake ${amtStr} TON`,
              labelEn: `Stake ${amtStr} TON`,
              variant: "primary",
            },
            { id: "staking-cancel", labelKo: t.chatActions.cancelButton, labelEn: t.chatActions.cancelButton, variant: "secondary" },
          ],
        }];
      }

      case "confirm-stake": {
        if (!operator || !userAddress) return [];
        setStep("executing");

        const executingMsg: FlowMessage = {
          text: t.chatActions.executing,
          mood: "determined",
        };

        const result = await executeStaking({
          walletAddress: userAddress as `0x${string}`,
          operatorAddress: operator.address as `0x${string}`,
          amount: amountRef.current,
          smartAccountClient,
          sessionKey,
          getEthereumProvider,
        });

        if (result.success) {
          setStep("idle");
          operatorRef.current = null;

          const successText = t.chatActions.success.replace("{amount}", amountRef.current);
          const msgs: FlowMessage[] = [executingMsg, {
            text: successText,
            mood: "cheer",
          }];

          if (result.txHash) {
            const etherscanBase = isTestnet ? "https://sepolia.etherscan.io" : "https://etherscan.io";
            msgs.push({
              text: `${etherscanBase}/tx/${result.txHash}`,
              mood: "proud",
              actions: [{
                id: "view-tx",
                labelKo: t.chatActions.viewTx,
                labelEn: t.chatActions.viewTx,
                variant: "secondary",
                params: { url: `${etherscanBase}/tx/${result.txHash}` },
              }],
            });
          }

          return msgs;
        } else {
          setStep("error");

          let errorText: string;
          switch (result.errorType) {
            case "rejected":
              errorText = t.chatActions.errorRejected;
              break;
            case "insufficient-gas":
              errorText = t.chatActions.errorInsufficientGas;
              break;
            default:
              errorText = t.chatActions.errorGeneric;
          }

          return [executingMsg, {
            text: errorText,
            mood: "worried",
            actions: [
              { id: "staking-retry", labelKo: t.chatActions.retryButton, labelEn: t.chatActions.retryButton, variant: "primary" },
              { id: "staking-cancel", labelKo: t.chatActions.cancelButton, labelEn: t.chatActions.cancelButton, variant: "secondary" },
            ],
          }];
        }
      }

      case "staking-retry": {
        // Retry from confirm step
        setStep("confirm");
        const confirmText = t.chatActions.confirmStake
          .replace("{amount}", amountRef.current)
          .replace("{operator}", operator?.name || "");

        return [{
          text: confirmText,
          mood: "determined",
          actions: [
            {
              id: "confirm-stake",
              labelKo: locale === "ko"
                ? `${amountRef.current} TON 스테이킹`
                : `Stake ${amountRef.current} TON`,
              labelEn: `Stake ${amountRef.current} TON`,
              variant: "primary",
            },
            { id: "staking-cancel", labelKo: t.chatActions.cancelButton, labelEn: t.chatActions.cancelButton, variant: "secondary" },
          ],
        }];
      }

      case "staking-cancel": {
        setStep("idle");
        operatorRef.current = null;
        amountRef.current = "";
        return [{
          text: t.chatActions.cancelled,
          mood: "wink",
        }];
      }

      default:
        return [];
    }
  }, [userAddress, smartAccountClient, sessionKey, getEthereumProvider, t, locale]);

  const handleTextInput = useCallback((text: string): FlowMessage[] | null => {
    if (step !== "ask-amount") return null;

    const match = text.match(/^(\d+(?:\.\d+)?)\s*(?:톤|TON)?$/i);
    if (!match) {
      return [{
        text: t.chatActions.invalidAmount,
        mood: "confused",
      }];
    }

    const inputAmount = Number(match[1]);
    const balance = Number(balanceRef.current);
    const gasReserve = 2;
    const maxAmount = Math.max(0, balance - gasReserve);

    if (inputAmount > maxAmount) {
      return [{
        text: t.chatActions.exceedsBalance.replace("{max}", maxAmount.toFixed(2)),
        mood: "worried",
        actions: [
          { id: "stake-max", labelKo: t.chatActions.stakeAllButton, labelEn: t.chatActions.stakeAllButton, variant: "primary" },
          { id: "staking-cancel", labelKo: t.chatActions.cancelButton, labelEn: t.chatActions.cancelButton, variant: "secondary" },
        ],
      }];
    }

    if (inputAmount <= 0) {
      return [{
        text: t.chatActions.invalidAmount,
        mood: "confused",
      }];
    }

    const amtStr = String(inputAmount);
    amountRef.current = amtStr;
    setStep("confirm");

    const operator = operatorRef.current;
    const confirmText = t.chatActions.confirmStake
      .replace("{amount}", amtStr)
      .replace("{operator}", operator?.name || "");

    return [{
      text: confirmText,
      mood: "determined",
      actions: [
        {
          id: "confirm-stake",
          labelKo: locale === "ko"
            ? `${amtStr} TON 스테이킹`
            : `Stake ${amtStr} TON`,
          labelEn: `Stake ${amtStr} TON`,
          variant: "primary",
        },
        { id: "staking-cancel", labelKo: t.chatActions.cancelButton, labelEn: t.chatActions.cancelButton, variant: "secondary" },
      ],
    }];
  }, [step, t, locale]);

  const reset = useCallback(() => {
    setStep("idle");
    operatorRef.current = null;
    amountRef.current = "";
    balanceRef.current = "0";
  }, []);

  return {
    isActive,
    start,
    handleAction,
    handleTextInput,
    reset,
  };
}
