"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { PRIZE_TIERS, type PrizeTier } from "@/constants/lottery";

interface BonusScratchRevealProps {
  tier: PrizeTier;
  onReveal: () => void;
}

export default function BonusScratchReveal({ tier, onReveal }: BonusScratchRevealProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [scratching, setScratching] = useState(false);
  const prize = PRIZE_TIERS[tier];

  const CANVAS_W = 280;
  const CANVAS_H = 160;
  const REVEAL_THRESHOLD = 0.5;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw scratch surface
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H);
    gradient.addColorStop(0, "#374151");
    gradient.addColorStop(1, "#1f2937");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Add shimmer pattern
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * CANVAS_W;
      const y = Math.random() * CANVAS_H;
      ctx.beginPath();
      ctx.arc(x, y, Math.random() * 3 + 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Text hint
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("여기를 긁어봐!", CANVAS_W / 2, CANVAS_H / 2 + 6);
  }, []);

  const checkRevealProgress = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
    let transparent = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 0) transparent++;
    }

    const ratio = transparent / (CANVAS_W * CANVAS_H);
    if (ratio > REVEAL_THRESHOLD) {
      setRevealed(true);
      // Clear remaining
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      setTimeout(onReveal, 800);
    }
  }, [revealed, onReveal]);

  const scratch = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }, [revealed]);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;

    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setScratching(true);
    const pos = getPos(e);
    scratch(pos.x, pos.y);
  };

  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!scratching) return;
    e.preventDefault();
    const pos = getPos(e);
    scratch(pos.x, pos.y);
  };

  const handleEnd = () => {
    setScratching(false);
    checkRevealProgress();
  };

  return (
    <div className="flex flex-col items-center text-center space-y-6 animate-fade-in">
      <Image
        src="/toki-card-reveal.png"
        alt="Toki"
        width={120}
        height={120}
        className="drop-shadow-2xl"
      />

      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white">🎁 보너스 카드!</h2>
        <p className="text-sm text-gray-400">긁어서 당첨금을 확인해봐~</p>
      </div>

      <div className="relative w-[280px] h-[160px] rounded-2xl overflow-hidden
        border-2 border-white/20 shadow-xl">
        {/* Prize underneath */}
        <div className="absolute inset-0 flex flex-col items-center justify-center
          bg-gradient-to-br from-accent-cyan/20 to-accent-blue/20">
          <p className="text-3xl font-black text-white">
            {prize.emoji} {prize.label}
          </p>
          <p className="text-sm text-gray-300 mt-1">보너스 당첨!</p>
        </div>

        {/* Scratch canvas overlay */}
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="absolute inset-0 w-full h-full cursor-pointer touch-none"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
      </div>

      {revealed && (
        <p className="text-sm text-accent-cyan animate-bounce-in">
          축하해! 보너스 카드 당첨!
        </p>
      )}
    </div>
  );
}
