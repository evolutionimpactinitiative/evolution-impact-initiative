import Link from "next/link";
import { Sparkles, Calendar, MapPin, ArrowRight } from "lucide-react";
import { FESTIVAL } from "@/lib/festival";

type Variant = "tickets" | "sponsor" | "volunteer" | "vendor";

interface FestivalPromoBannerProps {
  variant?: Variant;
  className?: string;
}

const COPY: Record<
  Variant,
  { eyebrow: string; title: string; body: string; ctaLabel: string; href: string }
> = {
  tickets: {
    eyebrow: "Celebrating one year of impact",
    title: "Evolution Fest 2026 · Free family festival",
    body: "Our anniversary day out, raising money for our Back to School campaign. Free tickets are limited to 150.",
    ctaLabel: "Sold out",
    href: `/${FESTIVAL.slug}`,
  },
  sponsor: {
    eyebrow: "Lead the campaign",
    title: "Sponsor Evolution Fest 2026",
    body: "Three paths from £50 to £3,000+. Help 500 children in Medway start school with confidence.",
    ctaLabel: "Become a sponsor",
    href: `/${FESTIVAL.slug}/sponsor`,
  },
  volunteer: {
    eyebrow: "Join the team",
    title: "Volunteer at Evolution Fest 2026",
    body: "Help us run our biggest event of the year — setup, AM, PM and packdown shifts available.",
    ctaLabel: "Apply to volunteer",
    href: `/${FESTIVAL.slug}/volunteer`,
  },
  vendor: {
    eyebrow: "Trade at the Fest",
    title: "Vendor applications open",
    body: "Maximum 15 vendors across food, drinks, sweets, retail and community organisations. Deadline 18 July.",
    ctaLabel: "Apply as a vendor",
    href: `/${FESTIVAL.slug}/apply-vendor`,
  },
};

export function FestivalPromoBanner({
  variant = "tickets",
  className = "",
}: FestivalPromoBannerProps) {
  const copy = COPY[variant];

  return (
    <div
      className={`relative bg-brand-dark text-white rounded-2xl overflow-hidden ${className}`}
    >
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-brand-accent rounded-full opacity-15 blur-3xl" />
      <div className="absolute -bottom-12 -right-12 w-60 h-60 bg-brand-blue rounded-full opacity-25 blur-3xl" />

      <div className="relative z-10 p-6 md:p-8 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8">
            <div className="inline-flex items-center gap-2 bg-brand-accent/15 text-brand-accent px-3 py-1 rounded-full text-[10px] font-heading font-semibold uppercase tracking-widest mb-4">
              <Sparkles className="h-3 w-3" />
              {copy.eyebrow}
            </div>
            <h2 className="font-heading font-black text-2xl md:text-3xl lg:text-4xl leading-tight mb-3">
              {copy.title}
            </h2>
            <p className="text-white/70 leading-relaxed mb-5 max-w-xl">
              {copy.body}
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/60 mb-6">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-brand-accent" />
                {FESTIVAL.dateLabel} · {FESTIVAL.timeLabel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-brand-accent" />
                {FESTIVAL.venueName}, {FESTIVAL.venueArea}
              </span>
            </div>
            <Link
              href={copy.href}
              className="inline-flex items-center justify-center gap-2 bg-brand-accent text-brand-dark font-heading font-bold text-sm uppercase tracking-wider px-5 py-3 rounded-md hover:bg-brand-green hover:text-white transition-colors"
            >
              {copy.ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Right: stat tiles */}
          <div className="lg:col-span-4 grid grid-cols-3 lg:grid-cols-1 gap-3">
            <StatTile value="1 yr" label="Anniversary" />
            <StatTile value="12" label="Events" />
            <StatTile value="500" label="Children goal" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-3 lg:p-4 text-center">
      <p className="font-heading font-black text-xl md:text-2xl text-brand-accent leading-none">
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-widest text-white/60 mt-1.5">
        {label}
      </p>
    </div>
  );
}
