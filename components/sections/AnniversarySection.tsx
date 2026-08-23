import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { FIRST_YEAR_STATS } from "@/lib/festival";
// Archived B2S 2026 imports — re-enable when the 2027 card comes back:
// import { Calendar, MapPin, Sparkles } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { B2S } from "@/lib/back-to-school";

export function AnniversarySection() {
  return (
    <section className="bg-brand-dark text-white py-20 md:py-32 relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-brand-accent rounded-full opacity-10 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-brand-blue rounded-full opacity-20 blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Top: headline */}
        <div className="max-w-4xl mb-12 md:mb-16">
          <SectionLabel
            text="One year of impact"
            color="brand-accent"
            className="mb-6"
          />
          <h2 className="font-heading font-black text-3xl md:text-5xl lg:text-6xl leading-tight mb-6">
            A year of showing up{" "}
            <span className="text-brand-accent">for Medway.</span>
          </h2>
          <p className="text-lg text-white/70 max-w-2xl leading-relaxed">
            Twelve community events in twelve months. From school uniforms to
            candle-making, we&apos;ve been turning up — and we&apos;re just
            getting started.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12 md:mb-16">
          <StatTile value={FIRST_YEAR_STATS.peopleSupported} label="People supported" />
          <StatTile value={FIRST_YEAR_STATS.eventsDelivered} label="Events delivered" />
          <StatTile value={FIRST_YEAR_STATS.turkeysGiven} label="Christmas turkeys" />
          <StatTile value={FIRST_YEAR_STATS.uniformsGiven} label="Uniforms handed out" />
        </div>

        {/* B2S 2026 campaign card archived — restore for the 2027 drive
            when dates + venue are locked in. Uses B2S.* constants +
            CampaignCtaRow, both still exported. */}
      </div>
    </section>
  );
}

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-5 md:p-6 text-center">
      <p className="font-heading font-black text-3xl md:text-5xl text-brand-accent leading-none">
        {value.toLocaleString("en-GB")}
      </p>
      <p className="text-xs md:text-sm text-white/60 mt-2 uppercase tracking-wider">
        {label}
      </p>
    </div>
  );
}

function CampaignCtaRow({
  href,
  title,
  subtitle,
}: {
  href: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-accent rounded-lg px-5 py-4 transition-colors"
    >
      <div>
        <p className="font-heading font-bold text-white text-base md:text-lg">
          {title}
        </p>
        <p className="text-xs text-white/60 mt-0.5">{subtitle}</p>
      </div>
      <ArrowRight className="h-5 w-5 text-brand-accent group-hover:translate-x-1 transition-transform shrink-0" />
    </Link>
  );
}
