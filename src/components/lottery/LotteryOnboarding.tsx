"use client";

import { useState } from "react";
import Image from "next/image";
import { usePrivy } from "@privy-io/react-auth";

interface LotteryOnboardingProps {
  onComplete: (walletAddress: string) => void;
}

interface Slide {
  mood: string;
  lines: string[];
  extra?: "exchanges" | "apr";
}

const SLIDES: Slide[] = [
  {
    mood: "presenting",
    lines: [
      "반가워! 네가 받은 TON은 토카막 네트워크의 토큰이야~",
      "토카막 네트워크는 2017년부터 이더리움 생태계에서 꾸준히 개발해온 한국 블록체인 프로젝트야. 8년 넘게 살아남은 프로젝트는 많지 않거든~",
    ],
  },
  {
    mood: "proud",
    lines: [
      "TON은 업비트, 빗썸, 코인원, 고팍스 — 국내 4대 거래소에 모두 상장돼 있어!",
      "어디서든 쉽게 사고팔 수 있다는 뜻이지~",
    ],
    extra: "exchanges",
  },
  {
    mood: "excited",
    lines: [
      "스테이킹은 은행에 돈을 맡기고 이자를 받는 것처럼, TON을 네트워크에 맡겨서 보상을 받는 거야!",
      "맡긴 TON은 네트워크를 안전하게 지키는 데 쓰여. 그 대가로 보상이 자동으로 쌓이는 거지!",
    ],
    extra: "apr",
  },
  {
    mood: "wink",
    lines: [
      "스테이킹 말고도 토카막에는 DeFi, AI, 게임 등 66개 넘는 프로젝트가 있어!",
      "토키에서는 스테이킹, 퀘스트, 카드 수집까지 — 내가 다 알려줄게~",
    ],
  },
];

const EXCHANGE_LOGOS = [
  { name: "Upbit", initial: "U" },
  { name: "Bithumb", initial: "B" },
  { name: "Coinone", initial: "C" },
  { name: "GOPAX", initial: "G" },
];

type OnboardingStep = "login" | "slides" | "wallet";

export default function LotteryOnboarding({ onComplete }: LotteryOnboardingProps) {
  const { login, authenticated, user } = usePrivy();
  const [step, setStep] = useState<OnboardingStep>(authenticated ? "slides" : "login");
  const [slideIndex, setSlideIndex] = useState(0);

  const walletAddress = user?.wallet?.address;

  const handleLogin = async () => {
    if (authenticated) {
      setStep("slides");
      return;
    }
    login();
  };

  // After Privy login completes
  if (authenticated && step === "login") {
    setStep("slides");
  }

  const handleNextSlide = () => {
    if (slideIndex < SLIDES.length - 1) {
      setSlideIndex(slideIndex + 1);
    } else {
      setStep("wallet");
    }
  };

  if (step === "login") {
    return (
      <div className="flex flex-col items-center text-center space-y-6 animate-fade-in">
        <Image
          src="/toki-welcome.png"
          alt="Toki"
          width={160}
          height={160}
          className="drop-shadow-2xl"
        />
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">당첨금을 받으려면 계정이 필요해!</h2>
          <p className="text-sm text-gray-400">구글로 간편하게 시작할 수 있어~</p>
        </div>
        <button
          onClick={handleLogin}
          className="w-full max-w-xs py-3 rounded-xl font-bold text-lg
            bg-white text-gray-900
            hover:bg-gray-100 active:scale-[0.98]
            transition-all duration-200 flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google로 시작하기
        </button>
      </div>
    );
  }

  if (step === "slides") {
    const slide = SLIDES[slideIndex];
    return (
      <div className="flex flex-col items-center text-center space-y-6 animate-fade-in" key={slideIndex}>
        <Image
          src={`/toki-${slide.mood}.png`}
          alt="Toki"
          width={160}
          height={160}
          className="drop-shadow-2xl animate-character-entrance"
        />

        {/* Dialogue box */}
        <div className="w-full max-w-sm bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 space-y-3">
          {slide.lines.map((line, i) => (
            <p key={i} className="text-sm text-gray-200 leading-relaxed">{line}</p>
          ))}

          {/* Exchange logos */}
          {slide.extra === "exchanges" && (
            <div className="flex justify-center gap-3 pt-2">
              {EXCHANGE_LOGOS.map((ex) => (
                <div key={ex.name} className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20
                    flex items-center justify-center text-sm font-bold text-white">
                    {ex.initial}
                  </div>
                  <span className="text-[10px] text-gray-500">{ex.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* APR display */}
          {slide.extra === "apr" && (
            <div className="bg-accent-cyan/10 border border-accent-cyan/20 rounded-xl p-3 mt-2">
              <p className="text-xs text-gray-400">현재 스테이킹 수익률</p>
              <p className="text-2xl font-black text-accent-cyan">~XX% APR</p>
            </div>
          )}
        </div>

        {/* Progress + Next */}
        <div className="w-full max-w-sm space-y-3">
          <div className="flex justify-center gap-1.5">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === slideIndex ? "w-6 bg-accent-cyan" : "w-1.5 bg-white/20"
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleNextSlide}
            className="w-full py-3 rounded-xl font-bold
              bg-gradient-to-r from-accent-cyan to-accent-blue
              text-white hover:scale-[1.02] active:scale-[0.98]
              transition-all duration-200"
          >
            {slideIndex < SLIDES.length - 1 ? "다음" : "지갑 확인하기"}
          </button>
        </div>
      </div>
    );
  }

  // step === "wallet"
  return (
    <div className="flex flex-col items-center text-center space-y-6 animate-fade-in">
      <Image
        src="/toki-cheer.png"
        alt="Toki"
        width={160}
        height={160}
        className="drop-shadow-2xl animate-character-entrance"
      />
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white">지갑이 준비됐어!</h2>
        <p className="text-sm text-gray-400">이게 네 지갑 주소야~ 여기로 TON이 들어올 거야!</p>
      </div>

      {walletAddress && (
        <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">내 지갑 주소</p>
          <p className="text-sm font-mono text-accent-cyan break-all">
            {walletAddress}
          </p>
        </div>
      )}

      <button
        onClick={() => walletAddress && onComplete(walletAddress)}
        disabled={!walletAddress}
        className="w-full max-w-xs py-3 rounded-xl font-bold text-lg
          bg-gradient-to-r from-accent-cyan to-accent-blue
          text-white hover:scale-[1.02] active:scale-[0.98]
          disabled:opacity-40 disabled:cursor-not-allowed
          transition-all duration-200"
      >
        당첨금 선택하러 가기!
      </button>
    </div>
  );
}
