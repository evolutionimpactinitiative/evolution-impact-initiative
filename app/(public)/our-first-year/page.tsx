import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { TestimonialCard } from "@/components/shared/TestimonialCard";
import {
  FESTIVAL,
  FIRST_YEAR_EVENTS,
  FIRST_YEAR_STATS,
  type FirstYearEvent,
} from "@/lib/festival";
import { testimonials } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Our First Year | Evolution Impact Initiative CIC",
  description:
    "Twelve community events in twelve months across Medway. 749 people supported, 114 uniforms handed out, 200 turkeys distributed. The story of year one.",
};

const CATEGORY_COLORS: Record<FirstYearEvent["category"], string> = {
  "Sport & Youth": "bg-brand-green/10 text-brand-green border-brand-green/20",
  "Support & Outreach": "bg-brand-dark/10 text-brand-dark border-brand-dark/20",
  "Creative & Wellbeing": "bg-brand-blue/10 text-brand-blue border-brand-blue/20",
  "Community Events": "bg-brand-accent/15 text-brand-blue border-brand-accent/30",
};

export default function OurFirstYearPage() {
  return (
    <>
      {/* ============================================
          HERO
          ============================================ */}
      <section className="relative bg-brand-dark text-white pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-brand-accent rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-brand-blue rounded-full opacity-20 blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl">
            <p className="font-heading text-xs uppercase tracking-widest text-brand-accent mb-4">
              One year of impact
            </p>
            <h1 className="font-heading font-black text-5xl md:text-7xl lg:text-8xl leading-none mb-6">
              A year of showing up{" "}
              <span className="text-brand-accent">for Medway.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl leading-relaxed">
              Twelve community events in twelve months. From school uniforms to
              candle-making. Reaching{" "}
              <span className="text-white font-semibold">
                {FIRST_YEAR_STATS.peopleSupported.toLocaleString("en-GB")} people
              </span>{" "}
              across Medway.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
          STATS PANEL
          ============================================ */}
      <section className="bg-white py-16 md:py-24 -mt-12 md:-mt-16 relative z-20">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10 lg:p-12 border border-brand-blue/10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              <RecapStat value={FIRST_YEAR_STATS.peopleSupported} label="People supported across the year" />
              <RecapStat value={FIRST_YEAR_STATS.eventsDelivered} label="Events & workshops delivered" />
              <RecapStat value={FIRST_YEAR_STATS.turkeysGiven} label="Christmas turkeys given to families" />
              <RecapStat value={FIRST_YEAR_STATS.uniformsGiven} label="School uniforms handed out" />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          TIMELINE
          ============================================ */}
      <section className="bg-brand-pale/40 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mb-12 md:mb-16">
            <SectionLabel
              text="Every event, Jul 2025 — Jun 2026"
              color="brand-blue"
              className="mb-6"
            />
            <h2 className="font-heading font-black text-3xl md:text-4xl lg:text-5xl text-brand-dark mb-4">
              Twelve events. Twelve months.
            </h2>
            <p className="text-brand-dark/70 leading-relaxed">
              Every event listed below was free at the point of attendance —
              funded by donations, sponsorships, and the time of volunteers
              across Medway.
            </p>
          </div>

          <ol className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {FIRST_YEAR_EVENTS.map((event, idx) => (
              <li
                key={`${event.date}-${event.title}`}
                className="bg-white rounded-xl p-5 md:p-6 border border-brand-blue/10 flex items-start gap-4 md:gap-5 hover:border-brand-blue/30 transition-colors"
              >
                <div className="flex-shrink-0 w-12 md:w-14 text-center">
                  <p className="font-heading font-black text-xs uppercase text-brand-dark/40 tracking-wider">
                    {String(idx + 1).padStart(2, "0")}
                  </p>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                    <p className="font-heading text-xs text-brand-blue uppercase tracking-wider">
                      {event.dateLabel}
                    </p>
                    <span
                      className={`text-[10px] uppercase tracking-widest font-heading font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${CATEGORY_COLORS[event.category]}`}
                    >
                      {event.category}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-lg text-brand-dark mb-1 leading-tight">
                    {event.title}
                  </h3>
                  <p className="text-sm text-brand-dark/60">{event.countLabel}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ============================================
          TESTIMONIALS
          ============================================ */}
      <section className="bg-white py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mb-12 md:mb-16">
            <SectionLabel text="Community voices" color="brand-green" className="mb-6" />
            <h2 className="font-heading font-black text-3xl md:text-4xl text-brand-dark mb-4">
              What it sounded like.
            </h2>
            <p className="text-brand-dark/70 leading-relaxed">
              Behind every number is a family, a child, a parent. Here&apos;s a
              little of what we heard along the way.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <TestimonialCard
                key={t.id}
                quote={t.quote}
                author={t.author}
                borderColor={t.borderColor as "brand-blue" | "brand-green" | "brand-dark"}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          NEXT CHAPTER · FESTIVAL CTA
          ============================================ */}
      <section className="bg-brand-dark text-white py-20 md:py-28 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-brand-accent rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-brand-blue rounded-full opacity-20 blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <SectionLabel
              text="The next chapter"
              color="brand-accent"
              className="mb-6"
            />
            <h2 className="font-heading font-black text-3xl md:text-5xl lg:text-6xl mb-6 leading-tight">
              And we&apos;re only{" "}
              <span className="text-brand-accent">just getting started.</span>
            </h2>
            <p className="text-white/70 text-lg leading-relaxed mb-3">
              This year&apos;s headline goal is our biggest yet — to help{" "}
              <span className="text-white font-semibold">
                {FIRST_YEAR_STATS.goalChildren} children
              </span>{" "}
              start school with confidence.
            </p>
            <p className="text-white/70 leading-relaxed mb-8">
              Come and be part of it. Free family festival, Saturday 25 July.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Button
                asChild
                size="lg"
                className="bg-brand-accent text-brand-dark hover:bg-brand-green hover:text-white"
              >
                <Link href={`/${FESTIVAL.slug}`}>
                  Go to Evolution Fest 2026
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white hover:text-brand-dark"
              >
                <Link href="/donate">Donate to the campaign</Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60">
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4 text-brand-accent" />
                {FESTIVAL.dateLabel} · {FESTIVAL.timeLabel}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-accent" />
                {FESTIVAL.venueName}, {FESTIVAL.venueArea}
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function RecapStat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="font-heading font-black text-4xl md:text-6xl text-brand-blue leading-none">
        {value.toLocaleString("en-GB")}
      </p>
      <p className="text-xs md:text-sm text-brand-dark/60 mt-3 uppercase tracking-wider leading-snug">
        {label}
      </p>
    </div>
  );
}
