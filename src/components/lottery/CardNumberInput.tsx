"use client";

import { useState, useRef } from "react";
import { LOTTERY_CONFIG } from "@/constants/lottery";

interface CardNumberInputProps {
  onSubmit: (cardNumber: string) => void;
  loading?: boolean;
}

export default function CardNumberInput({ onSubmit, loading }: CardNumberInputProps) {
  const isDev = process.env.NODE_ENV === "development";
  const [prefix, setPrefix] = useState(isDev ? "TK01" : "");
  const [code, setCode] = useState(isDev ? "DEMO01" : "");
  const codeRef = useRef<HTMLInputElement>(null);

  const fullNumber = `${prefix}-${code}`.toUpperCase();
  const isValid = LOTTERY_CONFIG.cardNumberPattern.test(fullNumber);

  const handlePrefixChange = (value: string) => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
    setPrefix(cleaned);
    if (cleaned.length === 4) {
      codeRef.current?.focus();
    }
  };

  const handleCodeChange = (value: string) => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    setCode(cleaned);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && !loading) {
      onSubmit(fullNumber);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto space-y-6">
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-400">
          스크래치 아래 카드번호를 입력해주세요
        </p>
      </div>

      <div className="flex items-center justify-center gap-2">
        <input
          type="text"
          value={prefix}
          onChange={(e) => handlePrefixChange(e.target.value)}
          placeholder="TK01"
          className="w-20 text-center text-xl font-mono font-bold tracking-wider
            bg-white/5 border border-white/20 rounded-lg px-2 py-3
            text-white placeholder:text-gray-600
            focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/50
            transition-colors"
          maxLength={4}
          autoFocus
          disabled={loading}
        />
        <span className="text-2xl font-bold text-gray-500">-</span>
        <input
          ref={codeRef}
          type="text"
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          placeholder="A3F9B2"
          className="w-32 text-center text-xl font-mono font-bold tracking-wider
            bg-white/5 border border-white/20 rounded-lg px-2 py-3
            text-white placeholder:text-gray-600
            focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/50
            transition-colors"
          maxLength={6}
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={!isValid || loading}
        className="w-full py-3 rounded-xl font-bold text-lg
          bg-gradient-to-r from-accent-cyan to-accent-blue
          text-white shadow-lg shadow-accent-cyan/20
          hover:shadow-accent-cyan/40 hover:scale-[1.02]
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
          transition-all duration-200"
      >
        {loading ? "확인 중..." : "당첨 확인하기"}
      </button>
    </form>
  );
}
