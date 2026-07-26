import Link from "next/link";
import { Calendar, MapPin, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { FIRST_YEAR_STATS } from "@/lib/festival";
import { B2S } from "@/lib/back-to-school";

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

        {/* B2S campaign card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-10 lg:p-12 backdrop-blur-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 bg-brand-accent/15 text-brand-accent px-3 py-1 rounded-full text-xs font-heading font-semibold uppercase tracking-wider mb-5">
                <Sparkles className="h-3.5 w-3.5" />
                The next chapter starts here
              </div>

              <h3 className="font-heading font-black text-2xl md:text-4xl lg:text-5xl leading-tight mb-4">
                {B2S.title}
              </h3>
              <p className="text-brand-accent font-heading font-semibold text-lg md:text-xl mb-5">
                Free uniforms, stationery and school bags for {B2S.goalChildren} children.
              </p>

              <p className="text-white/70 mb-6 leading-relaxed max-w-xl">
                Our biggest campaign of the year — helping families across
                Medway send their children back to school with everything they
                need. Register your family, donate, or pledge new supplies.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 text-sm text-white/80 mb-8">
                <span className="inline-flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-brand-accent" />
                  {B2S.dateLabel} · {B2S.timeLabel}
                </span>
                <span className="hidden sm:inline text-white/30">·</span>
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-brand-accent" />
                  {B2S.venueName}, {B2S.venueArea}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-brand-accent text-brand-dark hover:bg-brand-green hover:text-white"
                >
                  <Link href="/back-to-school/register">
                    Register a family
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white hover:text-brand-dark">
                  <Link href="/back-to-school">Campaign hub</Link>
                </Button>
              </div>
            </div>

            {/* Right: secondary CTAs */}
            <div className="lg:col-span-5">
              <p className="text-xs uppercase tracking-widest text-white/50 mb-4 font-heading font-semibold">
                Other ways to help
              </p>
              <div className="space-y-3">
                <CampaignCtaRow
                  href="/back-to-school#donate-money"
                  title="Donate to the drive"
                  subtitle="£20 kits one child head-to-toe"
                />
                <CampaignCtaRow
                  href="/back-to-school/sponsor"
                  title="Sponsor the campaign"
                  subtitle="From £50 to £3,000+"
                />
                <CampaignCtaRow
                  href="/back-to-school/donate-supplies"
                  title="Pledge new supplies"
                  subtitle="Uniforms, stationery, school bags"
                />
              </div>
            </div>
          </div>
        </div>
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
