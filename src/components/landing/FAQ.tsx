"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useStakingData, replaceApr } from "@/components/providers/StakingDataProvider";

function TypingBubble({ text, onDone }: { text: string; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        setDone(true);
        onDone?.();
      }
    }, 20);
    return () => clearInterval(id);
  }, [text, onDone]);

  return (
    <span>
      {displayed}
      {!done && <span className="inline-block w-0.5 h-4 bg-cyan-400/80 ml-0.5 animate-pulse" />}
    </span>
  );
}

export default function FAQ() {
  const [selectedQ, setSelectedQ] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const { apr } = useStakingData();

  const faqs = [
    { q: t.faq.q1, a: replaceApr(t.faq.a1, apr) },
    { q: t.faq.q2, a: t.faq.a2 },
    { q: t.faq.q3, a: t.faq.a3 },
    { q: t.faq.q4, a: t.faq.a4 },
    { q: t.faq.q5, a: t.faq.a5 },
    { q: t.faq.q6, a: t.faq.a6 },
  ];

  const handleSelect = (i: number) => {
    if (isTyping) return;
    setSelectedQ(i);
    setShowAnswer(false);
    setIsTyping(true);

    // Simulate Toki "thinking"
    setTimeout(() => {
      setShowAnswer(true);
    }, 800);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedQ, showAnswer]);

  // Toki sprites for different question types
  const getSprite = (i: number) => {
    if (i <= 1) return "/characters/toki-explain.png";
    if (i <= 3) return "/characters/toki-thinking.png";
    return "/characters/toki-wink.png";
  };

  return (
    <section className="py-24 px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
          {t.faqChat.title}
        </h2>
        <p className="text-gray-400 text-center mb-12 text-lg">
          {t.faqChat.subtitle}
        </p>

        {/* Chat container */}
        <div className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-sm overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 bg-white/5">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-cyan-400/50">
              <Image src="/characters/toki-welcome.png" alt="Toki" width={32} height={32} className="object-cover" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Toki</div>
              <div className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Online
              </div>
            </div>
          </div>

          {/* Chat body */}
          <div className="p-5 space-y-4 min-h-[300px] max-h-[500px] overflow-y-auto">
            {/* Toki greeting */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/20">
                <Image src="/characters/toki-welcome.png" alt="Toki" width={32} height={32} className="object-cover" />
              </div>
              <div className="bg-white/10 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%]">
                <p className="text-sm text-gray-200">{t.faqChat.placeholder}</p>
              </div>
            </div>

            {/* Question-answer pairs */}
            {selectedQ !== null && (
              <>
                {/* User question bubble - right */}
                <div className="flex justify-end">
                  <div className="bg-accent-blue/20 border border-accent-blue/30 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%]">
                    <p className="text-sm text-white">{faqs[selectedQ].q}</p>
                  </div>
                </div>

                {/* Typing indicator or answer */}
                {!showAnswer ? (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/20">
                      <Image src="/characters/toki-thinking.png" alt="Toki thinking" width={32} height={32} className="object-cover" />
                    </div>
                    <div className="bg-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{t.faqChat.typing}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/20">
                      <Image src={getSprite(selectedQ)} alt="Toki" width={32} height={32} className="object-cover" />
                    </div>
                    <div className="bg-white/10 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%]">
                      <p className="text-sm text-gray-200 leading-relaxed">
                        <TypingBubble
                          text={faqs[selectedQ].a}
                          onDone={() => setIsTyping(false)}
                        />
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Question selector - like a chat input area */}
          <div className="border-t border-white/10 p-4 bg-white/5">
            <div className="flex flex-wrap gap-2">
              {faqs.map((faq, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  disabled={isTyping}
                  className={`
                    text-xs px-3 py-2 rounded-full border transition-all
                    ${selectedQ === i
                      ? "bg-accent-blue/20 border-accent-blue/40 text-accent-cyan"
                      : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20 hover:text-gray-200"}
                    ${isTyping ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                  `}
                >
                  {faq.q.length > 30 ? faq.q.slice(0, 30) + "..." : faq.q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
