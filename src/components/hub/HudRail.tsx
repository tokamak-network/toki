"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/components/providers/LanguageProvider";
import {
  AI_ACCESS_URL,
  MIN_TON_AI_ACCESS,
  isNativeIssueEnabled,
  type Eip1193Provider,
} from "@/lib/aiAccess";
import AiAccessKeyModal from "./AiAccessKeyModal";

type RailStatus = "live" | "soon" | "ai-ready" | "ai-locked";

type RailItem = {
  id: string;
  icon: string;
  iconImg?: string; // optional anime icon asset (overrides the emoji)
  label: string;
  href: string | null; // null = disabled, unless onClick is set
  external?: boolean;
  onClick?: () => void;
  status: RailStatus;
  statusText: string;
};

/**
 * Vertical HUD rail (concept C): circular glowing icon buttons for each hub
 * service + the AI Access entry. Compact (fits one screen). AI eligibility is a
 * hint from the staking balance; the AI Access site re-validates on-chain.
 *
 * When native issuance is configured (NEXT_PUBLIC_AI_ACCESS_BASE) and the wallet
 * is reachable, the eligible AI button issues the key in-app via a SIWE-signed
 * delegated call; otherwise it hands off to the AI Access site.
 */
export default function HudRail({
  stakedTon,
  loading,
  address,
  getProvider,
}: {
  stakedTon: number;
  loading: boolean;
  address?: string;
  getProvider?: () => Promise<Eip1193Provider>;
}) {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const eligible = stakedTon >= MIN_TON_AI_ACCESS;
  const needed = Math.max(0, MIN_TON_AI_ACCESS - stakedTon);
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { maximumFractionDigits: 2 });

  const canIssueNative =
    isNativeIssueEnabled && eligible && !!address && !!getProvider;

  const aiItem: RailItem = !eligible
    ? {
        id: "ai",
        icon: "🤖",
        label: t.hub.aiAccessTitle,
        href: "/staking",
        status: "ai-locked",
        statusText: loading ? t.hub.aiAccessChecking : `+${fmt(needed)} TON`,
      }
    : canIssueNative
      ? {
          id: "ai",
          icon: "🤖",
          label: t.hub.aiAccessTitle,
          href: null,
          onClick: () => setShowModal(true),
          status: "ai-ready",
          statusText: t.hub.aiAccessBadge,
        }
      : {
          id: "ai",
          icon: "🤖",
          label: t.hub.aiAccessTitle,
          href: AI_ACCESS_URL,
          external: true,
          status: "ai-ready",
          statusText: t.hub.aiAccessBadge,
        };

  const items: RailItem[] = [
    {
      id: "staking",
      icon: "💠",
      label: t.hub.appStaking,
      href: "/staking",
      status: "live",
      statusText: t.hub.badgeLive,
    },
    {
      id: "private-transfer",
      icon: "🕶️",
      iconImg: "/icons/private-transfer.png",
      label: t.hub.appPrivateTransfer,
      href: "/private-transfer",
      status: "soon",
      statusText: t.hub.badgeSoon,
    },
    {
      id: "games",
      icon: "🎮",
      label: t.hub.appGames,
      href: null,
      status: "soon",
      statusText: t.hub.badgeSoon,
    },
    {
      id: "explore",
      icon: "🧭",
      label: t.hub.appExplore,
      href: "/explore",
      status: "live",
      statusText: t.hub.badgeLive,
    },
    aiItem,
  ];

  return (
    <>
      {showModal && canIssueNative && address && getProvider && (
        <AiAccessKeyModal
          address={address}
          getProvider={getProvider}
          onClose={() => setShowModal(false)}
        />
      )}
      <div className="flex flex-col gap-2.5 lg:items-end">
        {items.map((it) => (
          <RailButton key={it.id} item={it} />
        ))}
      </div>
    </>
  );
}

function RailButton({ item }: { item: RailItem }) {
  const live = item.status === "live" || item.status === "ai-ready";
  const ring =
    item.status === "ai-ready"
      ? "border-accent-gold/50 shadow-[0_0_18px_rgba(245,158,11,0.35)]"
      : live
        ? "border-accent-cyan/40 shadow-[0_0_18px_rgba(34,211,238,0.25)]"
        : "border-white/15";
  const statusColor =
    item.status === "ai-ready"
      ? "text-accent-gold"
      : item.status === "ai-locked"
        ? "text-accent-amber"
        : live
          ? "text-accent-cyan"
          : "text-gray-400";

  const inner = (
    <div className="group flex items-center justify-end gap-3">
      <span className="text-right [text-shadow:0_1px_3px_rgba(0,0,0,0.85)]">
        <span className="block text-sm font-semibold text-white leading-tight">
          {item.label}
        </span>
        <span className={`block text-[10px] ${statusColor}`}>
          {item.statusText}
        </span>
      </span>
      {item.iconImg ? (
        <span className="relative shrink-0 w-16 h-16 transition-transform group-hover:scale-110">
          <Image
            src={item.iconImg}
            alt=""
            width={160}
            height={160}
            className="w-16 h-16 object-contain drop-shadow-[0_0_14px_rgba(34,211,238,0.45)]"
          />
        </span>
      ) : (
        <span
          className={`relative shrink-0 grid place-items-center w-16 h-16 rounded-2xl bg-black/45 backdrop-blur-md border text-2xl transition-transform group-hover:scale-110 ${ring}`}
        >
          {item.icon}
        </span>
      )}
    </div>
  );

  if (item.onClick) {
    return (
      <button type="button" onClick={item.onClick} className="lg:self-end">
        {inner}
      </button>
    );
  }
  if (!item.href) {
    return (
      <div aria-disabled className="opacity-50 cursor-not-allowed">
        {inner}
      </div>
    );
  }
  return item.external ? (
    <a href={item.href} target="_blank" rel="noopener noreferrer">
      {inner}
    </a>
  ) : (
    <Link href={item.href}>{inner}</Link>
  );
}
