import Header from "@/components/layout/Header";
import VideoHero from "@/components/landing/VideoHero";

// Landing = cozy video title screen only. Hub/ecosystem lives at /dashboard.
export default function Home() {
  return (
    <>
      <Header />
      <VideoHero />
    </>
  );
}
