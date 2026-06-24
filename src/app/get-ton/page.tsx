"use client";

import dynamic from "next/dynamic";
import Header from "@/components/layout/Header";

// "Get TON" hub screen — visual-novel frame cloned from the staking page (left
// Toki + bottom dialogue + right menu panel). Reachable from the lobby GET TON tile.
// Reference: https://docs.tokamak.network/home/information/get-ton
const GetTonView = dynamic(() => import("@/components/getton/GetTonView"), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-[#070b14]" />,
});

export default function GetTonPage() {
  return (
    <>
      <Header />
      <GetTonView />
    </>
  );
}
