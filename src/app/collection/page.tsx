"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "@/components/layout/Header";
import CardCollection from "@/components/dashboard/CardCollection";
import { useTranslation } from "@/components/providers/LanguageProvider";

export default function CollectionPage() {
  const { ready, authenticated } = usePrivy();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">{t.dashboard.loading}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grid">
      <Header />
      <main className="max-w-5xl mx-auto px-4 pt-24 pb-12">
        <CardCollection />
      </main>
    </div>
  );
}
