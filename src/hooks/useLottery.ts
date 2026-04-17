"use client";

import { useState, useCallback } from "react";
import { type PrizeTier, type LotteryStep } from "@/constants/lottery";

interface LotteryState {
  step: LotteryStep;
  cardNumber: string | null;
  tier: PrizeTier | null;
  prizeAmount: number | null;
  /** Current DB status of the card — matters on re-entry after discount
   *  selection but before staff verification (show QR again). */
  cardStatus: string | null;
  walletAddress: string | null;
  txHash: string | null;
  showMission: boolean;
  error: string | null;
  loading: boolean;
}

export function useLottery() {
  const [state, setState] = useState<LotteryState>({
    step: "loading",
    cardNumber: null,
    tier: null,
    prizeAmount: null,
    cardStatus: null,
    walletAddress: null,
    txHash: null,
    showMission: false,
    error: null,
    loading: false,
  });

  const setStep = useCallback((step: LotteryStep) => {
    setState((s) => ({ ...s, step }));
  }, []);

  const claimCard = useCallback(async (cardNumber: string) => {
    setState((s) => ({ ...s, loading: true, error: null, cardNumber }));

    try {
      const res = await fetch("/api/lottery/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardNumber }),
      });

      const data = await res.json();

      if (!data.success) {
        setState((s) => ({
          ...s,
          loading: false,
          step: "invalid",
          error: data.error || "유효하지 않은 카드입니다",
        }));
        return;
      }

      setState((s) => ({
        ...s,
        loading: false,
        tier: data.card.tier,
        prizeAmount: data.card.prizeAmount,
        cardStatus: data.card.status ?? "unclaimed",
        step: "prize_reveal",
      }));
    } catch {
      setState((s) => ({
        ...s,
        loading: false,
        step: "invalid",
        error: "네트워크 오류가 발생했어요",
      }));
    }
  }, []);

  const chooseReward = useCallback(
    async (
      choice: "discount" | "ton",
      userId?: string | null,
    ): Promise<{ txHash?: string; showMission?: boolean } | undefined> => {
      if (!state.cardNumber) return;

      setState((s) => ({ ...s, loading: true }));

      try {
        const res = await fetch("/api/lottery/choose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardNumber: state.cardNumber,
            userId: userId ?? null,
            walletAddress: state.walletAddress,
            choice,
          }),
        });

        const data = await res.json();

        if (!data.success) {
          setState((s) => ({ ...s, loading: false, error: data.error }));
          return;
        }

        if (choice === "discount") {
          setState((s) => ({ ...s, loading: false, step: "discount_qr" }));
          return {};
        } else {
          setState((s) => ({
            ...s,
            loading: false,
            txHash: data.txHash,
            showMission: data.showMission || false,
            step: "ton_success",
          }));
          return { txHash: data.txHash, showMission: data.showMission || false };
        }
      } catch {
        setState((s) => ({
          ...s,
          loading: false,
          error: "네트워크 오류가 발생했어요",
        }));
      }
    },
    [state.cardNumber, state.walletAddress],
  );

  const setWalletAddress = useCallback((address: string) => {
    setState((s) => ({ ...s, walletAddress: address }));
  }, []);

  return {
    ...state,
    setStep,
    claimCard,
    chooseReward,
    setWalletAddress,
  };
}
