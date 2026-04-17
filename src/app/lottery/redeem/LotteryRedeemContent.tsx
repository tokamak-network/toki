"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { EVENT_KRW_PER_TON } from "@/constants/lottery";

interface CardInfo {
  cardNumber: string;
  prizeAmount: number;
  tier: string;
  label: string;
  emoji: string;
  status: string;
  expiresAt: string | null;
  alreadyVerified: boolean;
  claimedAt: string | null;
}

type PageState = "loading" | "ready" | "confirming" | "success" | "error";

export default function LotteryRedeemContent() {
  const searchParams = useSearchParams();
  const card = searchParams.get("card");

  const [cardInfo, setCardInfo] = useState<CardInfo | null>(null);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  // Fetch card info
  useEffect(() => {
    if (!card) {
      setErrorMessage("카드 번호가 없습니다.");
      setPageState("error");
      return;
    }

    fetch(`/api/lottery/redeem?card=${encodeURIComponent(card)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setErrorMessage(data.error === "Card not found" ? "존재하지 않는 카드입니다." : data.error);
          setPageState("error");
          return;
        }
        setCardInfo(data);

        if (data.alreadyVerified) {
          setPageState("success");
        } else if (data.status !== "discount_used") {
          setErrorMessage(
            data.status === "unclaimed"
              ? "아직 할인이 선택되지 않은 카드입니다."
              : data.status === "ton_claimed"
              ? "TON 전송으로 처리된 카드입니다."
              : "사용할 수 없는 카드입니다.",
          );
          setPageState("error");
        } else if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
          setErrorMessage("유효기간이 만료된 카드입니다.");
          setPageState("error");
        } else {
          setPageState("ready");
        }
      })
      .catch(() => {
        setErrorMessage("카드 정보를 불러오지 못했습니다.");
        setPageState("error");
      });
  }, [card]);

  // Redeem handler
  const handleRedeem = useCallback(async () => {
    if (!cardInfo) return;
    if (!pin.trim()) {
      setPinError(true);
      return;
    }
    setPinError(false);
    setPageState("confirming");

    try {
      const res = await fetch("/api/lottery/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardNumber: cardInfo.cardNumber, pin: pin.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setPageState("success");
      } else if (data.error === "invalid_pin") {
        setPinError(true);
        setPin("");
        setPageState("ready");
      } else {
        setErrorMessage(data.message ?? "처리 중 오류가 발생했습니다.");
        setPageState("error");
      }
    } catch {
      setErrorMessage("네트워크 오류가 발생했습니다.");
      setPageState("error");
    }
  }, [cardInfo, pin]);

  // Format expiry date
  const formatExpiry = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  // ── Loading ──
  if (pageState === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center" style={bgStyle}>
        <div className="text-center space-y-4">
          <Image src="/characters/toki-thinking.png" alt="Toki" width={120} height={120} className="mx-auto animate-pulse" />
          <p className="text-pink-400 animate-pulse">카드 정보 확인 중...</p>
        </div>
      </main>
    );
  }

  // ── Error ──
  if (pageState === "error") {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={bgStyle}>
        <div className="text-center space-y-6 max-w-sm">
          <Image src="/characters/toki-thinking.png" alt="Toki" width={120} height={120} className="mx-auto" />
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-pink-950">사용할 수 없는 카드</h2>
            <p className="text-sm text-pink-900/60">{errorMessage}</p>
          </div>
          {cardInfo && (
            <div className="text-xs text-pink-900/40">
              카드번호: {cardInfo.cardNumber}
            </div>
          )}
        </div>
      </main>
    );
  }

  // ── Success (already used or just redeemed) ──
  if (pageState === "success") {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={bgStyle}>
        <div className="text-center space-y-6 max-w-sm">
          <div
            className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl"
            style={{
              background: "linear-gradient(135deg, rgba(209,250,229,0.8), rgba(167,243,208,0.6))",
              boxShadow: "0 0 30px rgba(16,185,129,0.2)",
            }}
          >
            ✓
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-emerald-600">사용 완료!</h2>
            <p className="text-sm text-pink-900/60">할인이 적용되었습니다.</p>
          </div>
          {cardInfo && (
            <div
              className="rounded-2xl p-5 space-y-1.5 text-center"
              style={cardStyle}
            >
              <div className="text-4xl">{cardInfo.emoji}</div>
              <p className="text-2xl font-black text-pink-600 tracking-tight">
                {(cardInfo.prizeAmount * EVENT_KRW_PER_TON).toLocaleString("ko-KR")}원 할인
              </p>
              <p className="text-[11px] text-pink-900/50 font-semibold font-mono">
                {cardInfo.label}
              </p>
              <div className="text-[10px] text-pink-900/40 pt-1">
                <p>카드번호: {cardInfo.cardNumber}</p>
              </div>
            </div>
          )}
          <p className="text-xs text-pink-900/40">이 페이지를 닫아도 됩니다.</p>
        </div>
      </main>
    );
  }

  // ── Ready / Confirming ──
  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={bgStyle}>
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <Image src="/characters/toki-proud.png" alt="Toki" width={100} height={100} className="mx-auto" />
          <h1 className="text-xl font-black text-pink-950">Toki Lucky Lottery</h1>
          <p className="text-sm text-pink-900/50">할인 카드 정보</p>
        </div>

        {/* Card info */}
        {cardInfo && (
          <div className="rounded-2xl p-5 space-y-4" style={cardStyle}>
            {/* Prize */}
            <div className="text-center space-y-1.5">
              <div className="text-5xl">{cardInfo.emoji}</div>
              <p className="text-[11px] font-bold text-pink-900/50 tracking-[0.2em] uppercase mt-1">할인 금액</p>
              <p className="text-4xl sm:text-5xl font-black text-pink-600 tracking-tight">
                {(cardInfo.prizeAmount * EVENT_KRW_PER_TON).toLocaleString("ko-KR")}원
              </p>
              <p className="text-xs text-pink-900/55 font-semibold font-mono">
                {cardInfo.label}
              </p>
              <p className="text-[10px] text-pink-900/40 font-medium mt-1">
                이벤트 고정 가격 (1 TON = {EVENT_KRW_PER_TON}원)
              </p>
            </div>

            {/* Divider */}
            <div className="h-[1px] bg-gradient-to-r from-transparent via-pink-300/40 to-transparent" />

            {/* Details */}
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-pink-900/50">카드번호</span>
                <span className="font-mono text-pink-950/70">{cardInfo.cardNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-pink-900/50">상태</span>
                <span className="text-amber-600 font-bold">사용 대기</span>
              </div>
              {cardInfo.expiresAt && (
                <div className="flex justify-between">
                  <span className="text-pink-900/50">유효기간</span>
                  <span className="text-pink-950/70">{formatExpiry(cardInfo.expiresAt)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Staff PIN input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-pink-900/60 block">
            스탭 PIN 번호
          </label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={8}
            value={pin}
            onChange={(e) => { setPin(e.target.value); setPinError(false); }}
            onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
            placeholder="PIN 입력"
            className={`w-full px-4 py-3 rounded-xl text-center text-lg font-bold tracking-[0.3em] outline-none transition-colors ${
              pinError
                ? "border-2 border-red-400 bg-red-50/50"
                : "border border-pink-200/50 bg-white/50"
            }`}
          />
          {pinError && (
            <p className="text-xs text-red-500 text-center">PIN 번호가 올바르지 않습니다</p>
          )}
        </div>

        {/* Redeem button */}
        <button
          onClick={handleRedeem}
          disabled={pageState === "confirming" || !pin.trim()}
          className="w-full py-4 rounded-2xl font-black text-lg text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)",
            boxShadow: "0 4px 24px rgba(236,72,153,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
          }}
        >
          {pageState === "confirming" ? "처리 중..." : "사용하기"}
        </button>

        <p className="text-center text-xs text-pink-900/30">
          버튼을 누르면 할인이 적용되며 다시 사용할 수 없습니다.
        </p>
      </div>
    </main>
  );
}

// ── Shared styles ──

const bgStyle = {
  background:
    "linear-gradient(180deg, #fff5f7 0%, #ffe4ec 30%, #ffd6e0 50%, #fce8ef 70%, #f5e6f0 100%)",
};

const cardStyle = {
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(252,231,243,0.5) 100%)",
  border: "1px solid rgba(244,114,182,0.25)",
  boxShadow:
    "0 0 24px rgba(244,114,182,0.1), inset 0 1px 0 rgba(255,255,255,0.6)",
};
