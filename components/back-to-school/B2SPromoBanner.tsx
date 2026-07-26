import Link from "next/link";
import { Sparkles, Calendar, MapPin, ArrowRight } from "lucide-react";
import { B2S } from "@/lib/back-to-school";

type Variant = "register" | "sponsor" | "supplies";

interface B2SPromoBannerProps {
  variant?: Variant;
  className?: string;
}

const COPY: Record<
  Variant,
  { eyebrow: string; title: string; body: string; ctaLabel: string; href: string }
> = {
  register: {
    eyebrow: "Now open · Register your family",
    title: "Back to School Drive 2026",
    body: `Free uniforms, stationery and school bags for ${B2S.goalChildren} children in Medway. Registration closes ${B2S.registrationDeadlineLabel}.`,
    ctaLabel: "Register a family",
    href: "/back-to-school/register",
  },
  sponsor: {
    eyebrow: "Lead the campaign",
    title: "Sponsor the Back to School Drive",
    body: `Three sponsorship paths from £50 to £3,000+. Help ${B2S.goalChildren} children in Medway start school with confidence.`,
    ctaLabel: "Become a sponsor",
    href: "/back-to-school/sponsor",
  },
  supplies: {
    eyebrow: "Give practically",
    title: "Pledge new school supplies",
    body: "Uniforms, stationery, school bags — brand new only. Drop off before distribution day.",
    ctaLabel: "Pledge supplies",
    href: "/back-to-school/donate-supplies",
  },
};

export function B2SPromoBanner({
  variant = "register",
  className = "",
}: B2SPromoBannerProps) {
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
                {B2S.dateLabel} · {B2S.timeLabel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-brand-accent" />
                {B2S.venueName}, {B2S.venueArea}
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
            <StatTile value={String(B2S.goalChildren)} label="Children goal" />
            <StatTile value={`${B2S.minChildAge}–${B2S.maxChildAge}`} label="Age range" />
            <StatTile value="Free" label="For families" />
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
