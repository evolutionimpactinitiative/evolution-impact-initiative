import { HeroSection } from "@/components/sections/HeroSection";
import { FestivalCountdownStrip } from "@/components/sections/FestivalCountdownStrip";
import { MarqueeBanner } from "@/components/shared/MarqueeBanner";
import { AboutSection } from "@/components/sections/AboutSection";
import { ProgrammesSection } from "@/components/sections/ProgrammesSection";
import { ImpactSection } from "@/components/sections/ImpactSection";
import { AnniversarySection } from "@/components/sections/AnniversarySection";
import { DonateSection } from "@/components/sections/DonateSection";
import { GetInvolvedSection } from "@/components/sections/GetInvolvedSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <FestivalCountdownStrip />
      <MarqueeBanner />
      <AboutSection />
      <ProgrammesSection />
      <ImpactSection />
      <AnniversarySection />
      <DonateSection />
      <GetInvolvedSection />
    </>
  );
}
