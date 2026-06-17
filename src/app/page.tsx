import Header from "@/components/layout/Header";
import VideoHero from "@/components/landing/VideoHero";
import MenuPoster from "@/components/landing/MenuPoster";
import SquadSection from "@/components/landing/SquadSection";

// Landing = cozy video title hero → summer menu poster → "TOKI SQUAD" feature
// section. Hub lives at /dashboard.
export default function Home() {
  return (
    <>
      <Header />
      <VideoHero />
      <MenuPoster />
      <SquadSection />
    </>
  );
}
