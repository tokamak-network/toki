"use client";

import { useEffect, useRef } from "react";
import { useAudio } from "./AudioProvider";

export default function FloatingPlayer() {
  const { isPlaying, toggle, analyserNode } = useAudio();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  // Mini visualizer ring around the button
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 64;
    canvas.width = size * 2; // retina
    canvas.height = size * 2;

    const draw = () => {
      ctx.clearRect(0, 0, size * 2, size * 2);

      const cx = size;
      const cy = size;
      const radius = size - 8;
      const barCount = 32;

      if (analyserNode && isPlaying) {
        const data = new Uint8Array(analyserNode.frequencyBinCount);
        analyserNode.getByteFrequencyData(data);

        for (let i = 0; i < barCount; i++) {
          const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
          const value = data[i] || 0;
          const barHeight = 3 + (value / 255) * 14;

          const x1 = cx + Math.cos(angle) * radius;
          const y1 = cy + Math.sin(angle) * radius;
          const x2 = cx + Math.cos(angle) * (radius + barHeight);
          const y2 = cy + Math.sin(angle) * (radius + barHeight);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = `rgba(34, 211, 238, ${0.4 + (value / 255) * 0.6})`;
          ctx.lineWidth = 2;
          ctx.lineCap = "round";
          ctx.stroke();
        }
      } else {
        // Idle: subtle static ring
        for (let i = 0; i < barCount; i++) {
          const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
          const x1 = cx + Math.cos(angle) * radius;
          const y1 = cy + Math.sin(angle) * radius;
          const x2 = cx + Math.cos(angle) * (radius + 3);
          const y2 = cy + Math.sin(angle) * (radius + 3);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = "rgba(74, 144, 217, 0.2)";
          ctx.lineWidth = 2;
          ctx.lineCap = "round";
          ctx.stroke();
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [analyserNode, isPlaying]);

  return (
    <button
      onClick={toggle}
      className="fixed bottom-6 right-6 z-50 group"
      aria-label={isPlaying ? "Pause BGM" : "Play BGM"}
    >
      {/* Glow backdrop */}
      <div
        className={`absolute inset-0 rounded-full blur-xl transition-opacity duration-500 ${
          isPlaying ? "opacity-60 bg-accent-cyan/30" : "opacity-0"
        }`}
      />

      {/* Visualizer ring */}
      <canvas
        ref={canvasRef}
        className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] pointer-events-none"
        style={{ width: 64, height: 64, left: -8, top: -8 }}
      />

      {/* Main button */}
      <div
        className={`relative w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-300 ${
          isPlaying
            ? "bg-accent-cyan/20 border-accent-cyan/40 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
            : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
        }`}
      >
        {isPlaying ? (
          // Pause icon
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            className="text-accent-cyan"
          >
            <rect
              x="3"
              y="2"
              width="4"
              height="12"
              rx="1"
              fill="currentColor"
            />
            <rect
              x="9"
              y="2"
              width="4"
              height="12"
              rx="1"
              fill="currentColor"
            />
          </svg>
        ) : (
          // Play icon
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            className="text-gray-400 group-hover:text-white transition-colors ml-0.5"
          >
            <path d="M4 2.5L13 8L4 13.5V2.5Z" fill="currentColor" />
          </svg>
        )}
      </div>

      {/* Label */}
      <span
        className={`absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-medium tracking-wider uppercase whitespace-nowrap transition-opacity ${
          isPlaying
            ? "text-accent-cyan/70 opacity-100"
            : "text-gray-500 opacity-0 group-hover:opacity-100"
        }`}
      >
        BGM
      </span>
    </button>
  );
}
