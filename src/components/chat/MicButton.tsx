"use client";

interface MicButtonProps {
  isListening: boolean;
  onClick: () => void;
  className?: string;
}

/**
 * Tap-to-toggle microphone button.
 * Tap once to start, tap again to stop.
 * Shows animated rings + waveform dots when listening.
 */
export default function MicButton({
  isListening,
  onClick,
  className = "",
}: MicButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center justify-center rounded-lg transition-all ${
        isListening
          ? "bg-accent-cyan/20 text-accent-cyan"
          : "bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300"
      } ${className}`}
      style={{ width: 36, height: 36 }}
      aria-label={isListening ? "Stop recording" : "Start recording"}
    >
      {/* Ripple rings (only when listening) */}
      {isListening && (
        <>
          <span className="absolute inset-0 rounded-lg border-2 border-accent-cyan/40 animate-mic-ring-1" />
          <span className="absolute -inset-1 rounded-xl border border-accent-cyan/20 animate-mic-ring-2" />
          <span className="absolute -inset-2 rounded-xl border border-accent-cyan/10 animate-mic-ring-3" />
        </>
      )}

      {/* Mic icon or waveform dots */}
      {isListening ? (
        <div className="flex items-center gap-[3px] z-10">
          <span className="w-[3px] h-3 rounded-full bg-accent-cyan animate-mic-bar-1" />
          <span className="w-[3px] h-4 rounded-full bg-accent-cyan animate-mic-bar-2" />
          <span className="w-[3px] h-2.5 rounded-full bg-accent-cyan animate-mic-bar-3" />
          <span className="w-[3px] h-3.5 rounded-full bg-accent-cyan animate-mic-bar-4" />
        </div>
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 z-10"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>
      )}

      {/* Ambient glow */}
      {isListening && (
        <span className="absolute inset-0 rounded-lg bg-accent-cyan/10 animate-mic-glow" />
      )}
    </button>
  );
}
