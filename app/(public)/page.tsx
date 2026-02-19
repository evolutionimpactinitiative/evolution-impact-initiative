import { HeroSection } from "@/components/sections/HeroSection";
import { MarqueeBanner } from "@/components/shared/MarqueeBanner";
import { AboutSection } from "@/components/sections/AboutSection";
import { ProgrammesSection } from "@/components/sections/ProgrammesSection";
import { ImpactSection } from "@/components/sections/ImpactSection";
import { DonateSection } from "@/components/sections/DonateSection";
import { GetInvolvedSection } from "@/components/sections/GetInvolvedSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <MarqueeBanner />
      <AboutSection />
      <ProgrammesSection />
      <ImpactSection />
      <DonateSection />
      <GetInvolvedSection />
    </>
  );
}
