"use client";

import { useEffect, useRef } from "react";
import { useAudio } from "./AudioProvider";

export default function AudioVisualizer() {
  const { isPlaying, analyserNode } = useAudio();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      const barCount = 48;
      const gap = 3;
      const totalBarWidth = (w - gap * (barCount - 1)) / barCount;
      const barWidth = Math.max(totalBarWidth, 2);

      if (analyserNode && isPlaying) {
        const data = new Uint8Array(analyserNode.frequencyBinCount);
        analyserNode.getByteFrequencyData(data);

        for (let i = 0; i < barCount; i++) {
          // Map bar index to frequency data index
          const dataIndex = Math.floor((i / barCount) * data.length);
          const value = data[dataIndex] || 0;
          const normalized = value / 255;

          // Bar height from center
          const maxBarH = h * 0.45;
          const barH = 4 + normalized * maxBarH;

          const x = i * (barWidth + gap);
          const centerY = h / 2;

          // Color gradient based on frequency
          const hue = 190 + (i / barCount) * 30; // cyan to blue range
          const alpha = 0.15 + normalized * 0.5;

          ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${alpha})`;

          // Draw mirrored bars from center
          const radius = Math.min(barWidth / 2, 3);

          // Top bar
          roundRect(ctx, x, centerY - barH, barWidth, barH, radius);
          ctx.fill();

          // Bottom bar (mirror)
          roundRect(ctx, x, centerY, barWidth, barH, radius);
          ctx.fill();
        }
      } else {
        // Idle: subtle ambient bars
        const time = Date.now() / 1000;
        for (let i = 0; i < barCount; i++) {
          const wave = Math.sin(time * 0.5 + i * 0.3) * 0.5 + 0.5;
          const barH = 2 + wave * 8;

          const x = i * (barWidth + gap);
          const centerY = h / 2;

          ctx.fillStyle = `rgba(74, 144, 217, ${0.06 + wave * 0.06})`;

          roundRect(ctx, x, centerY - barH, barWidth, barH, 1);
          ctx.fill();
          roundRect(ctx, x, centerY, barWidth, barH, 1);
          ctx.fill();
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [analyserNode, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-700 ${
        isPlaying ? "opacity-100" : "opacity-40"
      }`}
    />
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
