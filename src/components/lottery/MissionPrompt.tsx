"use client";

import { useState } from "react";
import Image from "next/image";

interface MissionPromptProps {
  cardNumber: string;
  onComplete: (bonusCard: { cardNumber: string; tier: string; prizeAmount: number }) => void;
}

type MissionType = "instagram" | "twitter";

export default function MissionPrompt({ cardNumber, onComplete }: MissionPromptProps) {
  const [selectedMission, setSelectedMission] = useState<MissionType | null>(null);
  const [proof, setProof] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!selectedMission || !proof.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/lottery/mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardNumber,
          userId: "current-user", // Will be replaced with actual Privy userId
          missionType: selectedMission,
          proof: proof.trim(),
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "미션 제출에 실패했어요");
        return;
      }

      onComplete(data.bonusCard);
    } catch {
      setError("네트워크 오류가 발생했어요");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center text-center space-y-6 animate-fade-in">
      <Image
        src="/toki-excited.png"
        alt="Toki"
        width={140}
        height={140}
        className="drop-shadow-2xl"
      />

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white">🎁 미션 완료하면 카드 한 장 더!</h2>
        <p className="text-sm text-gray-400">
          SNS에 공유하고 보너스 카드를 받아봐~
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        {/* Instagram mission */}
        <button
          onClick={() => setSelectedMission("instagram")}
          className={`w-full p-4 rounded-2xl text-left transition-all duration-200
            ${selectedMission === "instagram"
              ? "bg-pink-500/10 border-2 border-pink-500/50"
              : "bg-white/5 border border-white/10 hover:border-pink-500/30"
            }`}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500
              flex items-center justify-center text-lg shrink-0">📸</div>
            <div>
              <p className="font-bold text-white">인스타 스토리</p>
              <p className="text-xs text-gray-400 mt-0.5">
                카드 사진 + #TokiLottery #TokamakNetwork
                <br />→ 스크린샷 URL을 아래에 입력
              </p>
            </div>
          </div>
        </button>

        {/* Twitter/X mission */}
        <button
          onClick={() => setSelectedMission("twitter")}
          className={`w-full p-4 rounded-2xl text-left transition-all duration-200
            ${selectedMission === "twitter"
              ? "bg-blue-500/10 border-2 border-blue-500/50"
              : "bg-white/5 border border-white/10 hover:border-blue-500/30"
            }`}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-black
              flex items-center justify-center text-lg shrink-0">𝕏</div>
            <div>
              <p className="font-bold text-white">X(트위터) 포스트</p>
              <p className="text-xs text-gray-400 mt-0.5">
                당첨 소식 공유하기
                <br />→ 포스트 URL을 아래에 입력
              </p>
            </div>
          </div>
        </button>
      </div>

      {selectedMission && (
        <div className="w-full max-w-sm space-y-3 animate-slide-up">
          <input
            type="url"
            value={proof}
            onChange={(e) => setProof(e.target.value)}
            placeholder={
              selectedMission === "instagram"
                ? "인스타그램 스토리 스크린샷 URL"
                : "X 포스트 URL (https://x.com/...)"
            }
            className="w-full px-4 py-3 rounded-xl
              bg-white/5 border border-white/20
              text-white text-sm placeholder:text-gray-600
              focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/50
              transition-colors"
          />

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={!proof.trim() || loading}
            className="w-full py-3 rounded-xl font-bold
              bg-gradient-to-r from-accent-amber to-yellow-500
              text-gray-900 shadow-lg
              hover:scale-[1.02] active:scale-[0.98]
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-200"
          >
            {loading ? "확인 중..." : "미션 제출하기"}
          </button>
        </div>
      )}
    </div>
  );
}
