import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import WhyTtoni from "@/components/landing/WhyTtoni";
import StakingPreview from "@/components/landing/StakingPreview";
import FAQ from "@/components/landing/FAQ";
import CTASection from "@/components/landing/CTASection";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <div id="how-it-works">
          <HowItWorks />
        </div>
        <div id="why-ttoni">
          <WhyTtoni />
        </div>
        <div id="stats">
          <StakingPreview />
        </div>
        <FAQ />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
