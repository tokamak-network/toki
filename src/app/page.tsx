import Header from "@/components/layout/Header";
import VideoHero from "@/components/landing/VideoHero";
import MenuPoster from "@/components/landing/MenuPoster";
import SquadSection from "@/components/landing/SquadSection";
import Footer from "@/components/layout/Footer";
import SeasonalPromoModal from "@/components/seasonal/SeasonalPromoModal";

// Landing = cozy video title hero → summer menu poster → "TOKI SQUAD" feature
// section → footer. Hub lives at /dashboard.
// SeasonalPromoModal self-gates (first-visit-per-season); see src/config/season.ts.
export default function Home() {
  return (
    <>
      <Header />
      <VideoHero />
      <MenuPoster />
      <SquadSection />
      <Footer />
      <SeasonalPromoModal />
    </>
  );
}
