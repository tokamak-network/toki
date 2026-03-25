"use client";

interface VoiceIndicatorProps {
  transcript: string;
  isListening: boolean;
  locale: string;
}

/**
 * Visual indicator shown during voice recording.
 * Shows pulsing dots and the live transcript.
 */
export default function VoiceIndicator({
  transcript,
  isListening,
  locale,
}: VoiceIndicatorProps) {
  if (!isListening) return null;

  return (
    <div className="px-4 pb-2 animate-slide-up-fade">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20">
        {/* Pulsing dots */}
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
          <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" style={{ animationDelay: "300ms" }} />
        </div>
        <span className="text-xs text-accent-cyan/80 truncate flex-1">
          {transcript || (locale === "ko" ? "듣고 있어..." : "Listening...")}
        </span>
      </div>
    </div>
  );
}
