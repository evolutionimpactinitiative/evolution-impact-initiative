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

export function FestivalCountdownStrip() {
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

  return (
    <section
      className="bg-brand-dark text-white"
      aria-label="Evolution Fest 2026 countdown"
    >
      <div className="container mx-auto px-4 py-5 md:py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: title + meta */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
            <div>
              <p className="font-heading text-xs uppercase tracking-widest text-brand-accent">
                Save the date
              </p>
              <p className="font-heading font-black text-xl md:text-2xl leading-tight">
                Evolution Fest 2026
              </p>
            </div>
            <div className="hidden lg:block h-10 w-px bg-white/20" />
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/80">
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

          {/* Middle: countdown */}
          <div className="flex items-center gap-3">
            <CountdownUnit value={remaining.days} label="days" />
            <span className="text-white/30 text-2xl font-heading font-black">:</span>
            <CountdownUnit value={remaining.hours} label="hrs" />
            <span className="text-white/30 text-2xl font-heading font-black">:</span>
            <CountdownUnit value={remaining.minutes} label="min" />
          </div>

          {/* Right: CTA */}
          <Link
            href={`/${FESTIVAL.slug}`}
            className="inline-flex items-center justify-center gap-2 bg-brand-accent text-brand-dark font-heading font-bold text-sm uppercase tracking-wider px-5 py-3 rounded-md hover:bg-brand-green hover:text-white transition-colors"
          >
            Get free tickets
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center min-w-12">
      <p className="font-heading font-black text-2xl md:text-3xl text-brand-accent leading-none">
        {String(value).padStart(2, "0")}
      </p>
      <p className="text-[10px] uppercase tracking-wider text-white/60 mt-1">
        {label}
      </p>
    </div>
  );
}
