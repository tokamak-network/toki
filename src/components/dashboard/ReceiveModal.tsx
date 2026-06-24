"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { useTranslation } from "@/components/providers/LanguageProvider";

export default function ReceiveModal({
  address,
  onClose,
}: {
  address: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked (non-secure context / permission) — no false feedback */
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card p-6 max-w-sm w-full text-center relative"
      >
        <button
          onClick={onClose}
          aria-label="close"
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-300 text-xl leading-none"
        >
          ×
        </button>
        <h2 className="text-lg font-semibold mb-2">{t.hub.receiveTitle}</h2>
        <p className="text-xs text-gray-500 mb-4 leading-relaxed">{t.hub.receiveDesc}</p>
        <div className="bg-white p-3 rounded-xl inline-block mb-4">
          <QRCodeSVG value={address} size={176} />
        </div>
        <div className="p-3 rounded-lg bg-white/5 font-mono text-xs text-gray-300 break-all mb-3">
          {address}
        </div>
        <button
          onClick={copy}
          className="w-full py-2.5 rounded-lg bg-accent-cyan/15 border border-accent-cyan/30 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/25 transition-colors"
        >
          {copied ? t.dashboard.copied : t.dashboard.copy}
        </button>
      </div>
    </div>
  );
}
