import { HeroSection } from "@/components/sections/HeroSection";
import { MarqueeBanner } from "@/components/shared/MarqueeBanner";
import { AboutSection } from "@/components/sections/AboutSection";
import { ProgrammesSection } from "@/components/sections/ProgrammesSection";
import { ImpactSection } from "@/components/sections/ImpactSection";
import { AnniversarySection } from "@/components/sections/AnniversarySection";
import { DonateSection } from "@/components/sections/DonateSection";
import { GetInvolvedSection } from "@/components/sections/GetInvolvedSection";

// B2S 2026 promo strip archived — re-enable for the 2027 drive:
// import { HomepagePromoStrip } from "@/components/back-to-school/HomepagePromoStrip";

// AnniversarySection fetches live Collection Day slot counts, so the
// homepage needs to render per-request until the drive is over.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Home() {
  return (
    <>
      <HeroSection />
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
