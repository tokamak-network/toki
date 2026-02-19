import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import StakingPreview from "@/components/landing/StakingPreview";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <div id="how-it-works">
          <HowItWorks />
        </div>
        <div id="stats">
          <StakingPreview />
        </div>
      </main>
      <Footer />
    </>
  );
}
