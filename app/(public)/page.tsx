import { HeroSection } from "@/components/sections/HeroSection";
import { MarqueeBanner } from "@/components/shared/MarqueeBanner";
import { AboutSection } from "@/components/sections/AboutSection";
import { ProgrammesSection } from "@/components/sections/ProgrammesSection";
import { ImpactSection } from "@/components/sections/ImpactSection";
import { AnniversarySection } from "@/components/sections/AnniversarySection";
import { DonateSection } from "@/components/sections/DonateSection";
import { GetInvolvedSection } from "@/components/sections/GetInvolvedSection";
import { HomepagePromoStrip } from "@/components/back-to-school/HomepagePromoStrip";

export default function Home() {
  return (
    <>
      <HeroSection />
      <MarqueeBanner />
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
