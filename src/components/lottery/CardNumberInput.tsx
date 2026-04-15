"use client";

import { useState, useRef } from "react";
import { LOTTERY_CONFIG } from "@/constants/lottery";
import { useTranslation } from "@/components/providers/LanguageProvider";

interface CardNumberInputProps {
  onSubmit: (cardNumber: string) => void;
  loading?: boolean;
}

export default function CardNumberInput({ onSubmit, loading }: CardNumberInputProps) {
  const { t } = useTranslation();
  const l = t.lotteryPage;
  const [prefix, setPrefix] = useState("");
  const [code, setCode] = useState("");
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
        <p className="text-sm text-pink-900/60">
          {l.inputGuide}
        </p>
      </div>

      <div className="flex items-center justify-center gap-2">
        <input
          type="text"
          value={prefix}
          onChange={(e) => handlePrefixChange(e.target.value)}
          placeholder="TK01"
          className="w-20 text-center text-xl font-mono font-bold tracking-wider
            bg-white/60 border border-pink-300/50 rounded-lg px-2 py-3
            text-pink-900 placeholder:text-pink-300
            focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400/50
            transition-colors"
          maxLength={4}
          autoFocus
          disabled={loading}
        />
        <span className="text-2xl font-bold text-pink-300">-</span>
        <input
          ref={codeRef}
          type="text"
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          placeholder="A3F9B2"
          className="w-32 text-center text-xl font-mono font-bold tracking-wider
            bg-white/60 border border-pink-300/50 rounded-lg px-2 py-3
            text-pink-900 placeholder:text-pink-300
            focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400/50
            transition-colors"
          maxLength={6}
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={!isValid || loading}
        className="w-full py-3 rounded-xl font-bold text-lg
          bg-gradient-to-r from-pink-500 to-purple-500
          text-white shadow-lg shadow-pink-500/25
          hover:shadow-pink-500/40 hover:scale-[1.02]
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
          transition-all duration-200"
      >
        {loading ? l.submitting : l.submit}
      </button>
    </form>
  );
}
