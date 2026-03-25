"use client";

interface MicButtonProps {
  isListening: boolean;
  onPress: () => void;
  onRelease: () => void;
  className?: string;
}

/**
 * Push-to-talk microphone button.
 * Desktop: press to start, release to stop.
 * Mobile: tap to toggle.
 */
export default function MicButton({
  isListening,
  onPress,
  onRelease,
  className = "",
}: MicButtonProps) {
  return (
    <button
      onMouseDown={onPress}
      onMouseUp={onRelease}
      onMouseLeave={isListening ? onRelease : undefined}
      onTouchStart={(e) => {
        e.preventDefault();
        onPress();
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        onRelease();
      }}
      className={`relative w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
        isListening
          ? "bg-accent-cyan/30 text-accent-cyan animate-mic-pulse"
          : "bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300"
      } ${className}`}
      aria-label={isListening ? "Stop recording" : "Start recording"}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" x2="12" y1="19" y2="22" />
      </svg>
      {isListening && (
        <span className="absolute inset-0 rounded-lg border-2 border-accent-cyan/50 animate-mic-pulse" />
      )}
    </button>
  );
}
