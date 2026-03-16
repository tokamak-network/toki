"use client";

import Image from "next/image";
import { useTranslation } from "@/components/providers/LanguageProvider";

type Mood = "welcome" | "explain" | "thinking" | "excited" | "proud" | "cheer" | "wink" | "surprised" | "confused" | "shy" | "determined" | "pointing" | "reading" | "crying-happy" | "peace" | "worried" | "laughing";

const MOOD_IMAGES: Record<Mood, string> = {
  welcome: "/toki-welcome.png",
  explain: "/toki-explain.png",
  thinking: "/toki-thinking.png",
  excited: "/toki-excited.png",
  proud: "/toki-proud.png",
  cheer: "/toki-cheer.png",
  wink: "/toki-wink.png",
  surprised: "/toki-surprised.png",
  confused: "/toki-confused.png",
  shy: "/toki-shy.png",
  determined: "/toki-determined.png",
  pointing: "/toki-pointing.png",
  reading: "/toki-reading.png",
  "crying-happy": "/toki-crying-happy.png",
  peace: "/toki-peace.png",
  worried: "/toki-worried.png",
  laughing: "/toki-laughing.png",
};

export type CoachState = "idle" | "idle_no_balance" | "staking" | "success" | "error" | "earnings";

interface TokiCoachProps {
  state: CoachState;
  earningsAmount?: string;
}

function getMood(state: CoachState): Mood {
  switch (state) {
    case "idle":
      return "cheer";
    case "idle_no_balance":
      return "thinking";
    case "staking":
      return "excited";
    case "success":
      return "proud";
    case "error":
      return "thinking";
    case "earnings":
      return "wink";
    default:
      return "welcome";
  }
}

export default function TokiCoach({ state, earningsAmount }: TokiCoachProps) {
  const { t } = useTranslation();
  const mood = getMood(state);

  function getMessage(): string {
    switch (state) {
      case "idle":
        return t.dashboard.coachIdleWithBalance;
      case "idle_no_balance":
        return t.dashboard.coachIdleNoBalance;
      case "staking":
        return t.dashboard.coachStaking;
      case "success":
        return t.dashboard.coachSuccess;
      case "error":
        return t.dashboard.coachError;
      case "earnings":
        return t.dashboard.coachEarnings.replace("{amount}", earningsAmount || "0");
      default:
        return t.dashboard.coachIdleWithBalance;
    }
  }

  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="shrink-0 w-[80px] h-[80px] relative">
        <Image
          src={MOOD_IMAGES[mood]}
          alt="Toki"
          fill
          className="object-contain"
          sizes="80px"
        />
      </div>
      <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl rounded-bl-sm px-4 py-3 max-w-[320px]">
        {/* speech bubble triangle */}
        <div className="absolute left-[-8px] bottom-3 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-white/10" />
        <p className="text-sm text-gray-200 leading-relaxed">{getMessage()}</p>
      </div>
    </div>
  );
}
