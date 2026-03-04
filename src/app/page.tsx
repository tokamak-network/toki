import { Suspense } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import StakingPreview from "@/components/landing/StakingPreview";
import GachaIntoWall from "@/components/landing/GachaIntoWall";

import CTASection from "@/components/landing/CTASection";
import FloatingPlayer from "@/components/audio/FloatingPlayer";
import { fetchStakingData } from "@/lib/staking";

export const dynamic = "force-dynamic";

function StakingLoading() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
          Live Staking Stats
        </h2>
        <p className="text-gray-400 text-center mb-16 text-lg">
          Loading on-chain data...
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-6 text-center animate-pulse">
              <div className="h-4 bg-white/10 rounded w-20 mx-auto mb-3" />
              <div className="h-8 bg-white/10 rounded w-24 mx-auto mb-2" />
              <div className="h-3 bg-white/10 rounded w-28 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function Home() {
  let apr: number | null = null;
  try {
    const data = await fetchStakingData();
    apr = data.apr;
  } catch {
    // fallback
  }

  return (
    <>
      <Header />
      <main>
        <HeroSection apr={apr} />
        <div id="how-it-works">
          <HowItWorks />
        </div>
        <GachaIntoWall />
        <div id="stats">
          <Suspense fallback={<StakingLoading />}>
            <StakingPreview />
          </Suspense>
        </div>
        <CTASection />
      </main>
      <Footer />
      <FloatingPlayer />
    </>
  );
}
