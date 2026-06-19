"use client";

import dynamic from "next/dynamic";

// "Get TON" hub screen — shows the ways to bring TON into the wallet
// (centralized exchanges + DEX swap). Reachable from the lobby's GET TON tile.
// Reference: https://docs.tokamak.network/home/information/get-ton
const GetTonView = dynamic(() => import("@/components/getton/GetTonView"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-400">Loading...</div>
    </div>
  ),
});

export default function GetTonPage() {
  return <GetTonView />;
}
