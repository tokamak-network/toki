"use client";

import Image from "next/image";
import { EVENT_CONFIG } from "@/constants/event";

interface QRDisplayProps {
  /** URL to encode in QR */
  url: string;
  label?: string;
}

/**
 * QR code display using external API (zero deps).
 */
export default function QRDisplay({ url, label }: QRDisplayProps) {
  const qrUrl = `${EVENT_CONFIG.qrApiUrl}/?size=${EVENT_CONFIG.qrSize}x${EVENT_CONFIG.qrSize}&data=${encodeURIComponent(url)}&bgcolor=0c1222&color=22d3ee&format=png`;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
        <Image
          src={qrUrl}
          alt="QR Code"
          width={EVENT_CONFIG.qrSize}
          height={EVENT_CONFIG.qrSize}
          className="rounded-lg"
          unoptimized
        />
      </div>
      {label && (
        <p className="text-sm text-gray-400">{label}</p>
      )}
    </div>
  );
}
