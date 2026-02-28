"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/components/providers/LanguageProvider";

interface TokiBridgeProps {
  sprite: string;
  bridgeKey: "toWhyToki" | "toStats" | "toFaq" | "toCta";
  direction?: "left" | "right";
}

export default function TokiBridge({
  sprite,
  bridgeKey,
  direction = "left",
}: TokiBridgeProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  const dialogue = t.bridge[bridgeKey];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.5 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="py-8 px-4">
      <div
        className={`
        max-w-2xl mx-auto flex items-center gap-4
        ${direction === "right" ? "flex-row-reverse" : "flex-row"}
        transition-all duration-500
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
      >
        {/* Toki sprite */}
        <div
          className={`
          shrink-0 w-16 h-16 md:w-20 md:h-20
          transition-all duration-500 delay-100
          ${visible ? "scale-100 opacity-100" : "scale-75 opacity-0"}
        `}
        >
          <Image
            src={sprite}
            alt="Toki"
            width={80}
            height={80}
            className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.1)]"
          />
        </div>

        {/* Speech bubble */}
        <div
          className={`
          relative bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 px-5 py-3
          ${direction === "right" ? "rounded-tr-sm" : "rounded-tl-sm"}
          transition-all duration-500 delay-200
          ${visible ? "opacity-100 translate-x-0" : `opacity-0 ${direction === "right" ? "translate-x-4" : "-translate-x-4"}`}
        `}
        >
          {/* Arrow */}
          <div
            className={`
            absolute top-4 w-2.5 h-2.5 bg-white/5 border border-white/10 rotate-45
            ${
              direction === "right"
                ? "right-[-6px] border-l-0 border-b-0"
                : "left-[-6px] border-r-0 border-t-0"
            }
          `}
          />

          <p className="text-sm md:text-base text-gray-300 leading-relaxed">
            {dialogue}
          </p>
        </div>
      </div>
    </div>
  );
}
