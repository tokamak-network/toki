"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useAchievement } from "@/components/providers/AchievementProvider";
import { useTranslation } from "@/components/providers/LanguageProvider";
import type { Achievement } from "@/lib/achievements";

const TOAST_DURATION = 4000;

function ToastItem({
  achievement,
  locale,
  onDismiss,
}: {
  achievement: Achievement;
  locale: string;
  onDismiss: () => void;
}) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Enter animation
    const enterTimer = requestAnimationFrame(() => setVisible(true));

    // Auto-dismiss
    const dismissTimer = setTimeout(() => {
      setExiting(true);
      setTimeout(onDismiss, 300);
    }, TOAST_DURATION);

    return () => {
      cancelAnimationFrame(enterTimer);
      clearTimeout(dismissTimer);
    };
  }, [onDismiss]);

  const handleClick = () => {
    setExiting(true);
    setTimeout(onDismiss, 300);
  };

  const title = locale === "ko" ? achievement.titleKo : achievement.titleEn;

  return (
    <div
      onClick={handleClick}
      className={`cursor-pointer flex items-center gap-3 px-5 py-4 rounded-2xl bg-background/95 backdrop-blur-xl border border-accent-cyan/30 shadow-2xl shadow-accent-cyan/20 transition-all duration-300 ${
        visible && !exiting
          ? "translate-y-0 opacity-100"
          : "translate-y-8 opacity-0"
      }`}
    >
      {/* Toki Character */}
      <div className="w-10 h-10 flex-shrink-0 relative">
        <Image
          src="/toki-proud.png"
          alt="Toki"
          width={40}
          height={40}
          className="w-full h-auto drop-shadow-lg"
        />
      </div>

      {/* Badge Icon */}
      <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-accent-cyan/20">
        {achievement.icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-accent-cyan font-semibold">
          {t.achievements.toastTitle}
        </div>
        <div className="text-sm text-gray-200 font-medium truncate">
          {title}
        </div>
      </div>

      {/* XP */}
      <div className="text-accent-amber font-mono-num text-sm font-semibold whitespace-nowrap">
        {t.achievements.toastXp.replace("{points}", String(achievement.points))}
      </div>
    </div>
  );
}

export default function AchievementToast() {
  const { unlockQueue, dismissToast } = useAchievement();
  const { locale } = useTranslation();

  const current = unlockQueue[0];
  if (!current) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-md">
      <ToastItem
        key={current.id}
        achievement={current}
        locale={locale}
        onDismiss={dismissToast}
      />
    </div>
  );
}
