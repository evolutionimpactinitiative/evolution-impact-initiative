import { HeroSection } from "@/components/sections/HeroSection";
import { FestivalCountdownStrip } from "@/components/sections/FestivalCountdownStrip";
import { MarqueeBanner } from "@/components/shared/MarqueeBanner";
import { AboutSection } from "@/components/sections/AboutSection";
import { ProgrammesSection } from "@/components/sections/ProgrammesSection";
import { ImpactSection } from "@/components/sections/ImpactSection";
import { AnniversarySection } from "@/components/sections/AnniversarySection";
import { DonateSection } from "@/components/sections/DonateSection";
import { GetInvolvedSection } from "@/components/sections/GetInvolvedSection";
import { HomepagePromoStrip } from "@/components/back-to-school/HomepagePromoStrip";
import { getFestivalRelease } from "@/lib/festival/release";

export default async function Home() {
  const release = await getFestivalRelease();
  const finalRelease = release.finalRelease ? release.ticketsRemaining : null;

  return (
    <>
      <HeroSection />
      <FestivalCountdownStrip finalRelease={finalRelease} />
      <MarqueeBanner finalRelease={finalRelease} />
      <HomepagePromoStrip />
      <AboutSection />
      <ProgrammesSection />
      <ImpactSection />
      <AnniversarySection />
      <DonateSection />
      <GetInvolvedSection />
    </>
  );
}
