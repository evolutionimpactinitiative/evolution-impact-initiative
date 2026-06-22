"use client";

import * as React from "react";
import Link from "next/link";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { FESTIVAL } from "@/lib/festival";

function getTimeRemaining(target: Date) {
  const now = new Date();
  const total = target.getTime() - now.getTime();
  if (total <= 0) {
    return { total: 0, days: 0, hours: 0, minutes: 0 };
  }
  return {
    total,
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
  };
}

type Props = {
  // If a number is passed, the festival is in final-release mode and the
  // strip switches to red. The number is the live tickets-remaining count.
  finalRelease?: number | null;
};

export function FestivalCountdownStrip({ finalRelease = null }: Props = {}) {
  const target = React.useMemo(
    () => new Date(`${FESTIVAL.date}T${FESTIVAL.startTime}:00`),
    [],
  );

  const [remaining, setRemaining] = React.useState(() =>
    getTimeRemaining(target),
  );

  React.useEffect(() => {
    const id = setInterval(() => setRemaining(getTimeRemaining(target)), 60_000);
    return () => clearInterval(id);
  }, [target]);

  // Auto-hide after the festival has finished
  if (remaining.total <= 0) return null;

  const isFinalRelease = typeof finalRelease === "number";
  const accent = isFinalRelease ? "text-red-400" : "text-brand-accent";
  const accentIcon = isFinalRelease ? "text-red-400" : "text-brand-accent";
  const ctaClass = isFinalRelease
    ? "bg-red-600 text-white hover:bg-red-700"
    : "bg-brand-accent text-brand-dark hover:bg-brand-green hover:text-white";
  const ctaLabel =
    isFinalRelease && finalRelease > 0
      ? `Final ${finalRelease} tickets`
      : isFinalRelease
        ? "Sold out"
        : "Get free tickets";

  return (
    <section
      className="bg-brand-dark text-white"
      aria-label="Evolution Fest 2026 countdown"
    >
      <div className="container mx-auto px-4 py-4 md:py-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          {/* Left: one-line title + meta */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <p className="font-heading font-black text-lg md:text-xl leading-none">
              <span className={`font-heading text-xs uppercase tracking-widest font-semibold ${accent} mr-2`}>
                Save the date ·
              </span>
              Evolution Fest 2026
            </p>
            <span className="hidden lg:inline h-5 w-px bg-white/20" />
            <span className="inline-flex items-center gap-1.5 text-white/80">
              <Calendar className={`h-4 w-4 ${accentIcon}`} />
              {FESTIVAL.dateLabel} · {FESTIVAL.timeLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 text-white/80">
              <MapPin className={`h-4 w-4 ${accentIcon}`} />
              {FESTIVAL.venueName}, {FESTIVAL.venueArea}
            </span>
          </div>

          {/* Right: countdown + CTA, kept together on one row */}
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="flex items-center gap-2">
              <CountdownUnit value={remaining.days} label="days" accent={accent} />
              <span className="text-white/30 text-xl font-heading font-black">:</span>
              <CountdownUnit value={remaining.hours} label="hrs" accent={accent} />
              <span className="text-white/30 text-xl font-heading font-black">:</span>
              <CountdownUnit value={remaining.minutes} label="min" accent={accent} />
            </div>
            <Link
              href={`/${FESTIVAL.slug}`}
              className={`inline-flex items-center justify-center gap-2 font-heading font-bold text-sm uppercase tracking-wider px-4 py-2.5 rounded-md transition-colors whitespace-nowrap ${ctaClass}`}
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function CountdownUnit({
  value,
  label,
  accent,
}: {
  value: number;
  label: string;
  accent: string;
}) {
  return (
    <div className="text-center min-w-10">
      <p className={`font-heading font-black text-xl md:text-2xl leading-none ${accent}`}>
        {String(value).padStart(2, "0")}
      </p>
      <p className="text-[10px] uppercase tracking-wider text-white/60 mt-0.5">
        {label}
      </p>
    </div>
  );
}
