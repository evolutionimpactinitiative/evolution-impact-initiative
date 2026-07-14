import Link from "next/link";
import { ArrowRight, Calendar, MapPin, Users, Package } from "lucide-react";
import { B2S } from "@/lib/back-to-school";

/**
 * Compact promo strip for the homepage. Sits between the festival countdown
 * and About while Fest 25 July is still upcoming; once Fest is done we'll
 * promote this to the hero position (Phase 2).
 */
export function HomepagePromoStrip() {
  return (
    <section
      aria-label="Back to School Drive 2026"
      className="bg-gradient-to-br from-brand-blue via-brand-blue to-brand-dark text-white"
    >
      <div className="container mx-auto px-4 py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 lg:gap-10 items-center">
          {/* LEFT: headline + meta */}
          <div>
            <p className="font-heading text-xs uppercase tracking-widest text-brand-accent mb-2">
              Next up · Back to School Drive
            </p>
            <h2 className="font-heading font-black text-3xl md:text-4xl lg:text-5xl leading-none mb-4">
              Help {B2S.goalChildren} kids
              <br />
              start school with confidence.
            </h2>
            <p className="text-white/75 leading-relaxed mb-5 max-w-xl">
              Free uniforms, stationery and school bags for families across
              Medway. Register your children, donate, or pledge new supplies.
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/70 mb-1">
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4 text-brand-accent" />
                {B2S.dateLabel} · {B2S.timeLabel}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-accent" />
                {B2S.venueName}, {B2S.venueArea}
              </span>
            </div>
          </div>

          {/* RIGHT: action cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/back-to-school/register"
              className="group bg-white/5 hover:bg-brand-accent hover:text-brand-dark rounded-xl p-4 border border-white/10 transition-all"
            >
              <Users className="h-5 w-5 text-brand-accent group-hover:text-brand-dark mb-3" />
              <p className="font-heading font-bold text-sm uppercase tracking-widest mb-1">
                Register a family
              </p>
              <p className="text-xs text-white/60 group-hover:text-brand-dark/70">
                Closes {B2S.registrationDeadlineLabel}
              </p>
            </Link>
            <Link
              href="/back-to-school#donate-money"
              className="group bg-white/5 hover:bg-brand-green rounded-xl p-4 border border-white/10 transition-all"
            >
              <span className="block h-5 w-5 text-brand-green group-hover:text-white mb-3 font-heading font-black">
                £
              </span>
              <p className="font-heading font-bold text-sm uppercase tracking-widest mb-1">
                Donate
              </p>
              <p className="text-xs text-white/60 group-hover:text-white/85">
                £20 kits one child
              </p>
            </Link>
            <Link
              href="/back-to-school/donate-supplies"
              className="group bg-white/5 hover:bg-white hover:text-brand-dark rounded-xl p-4 border border-white/10 transition-all"
            >
              <Package className="h-5 w-5 text-brand-accent group-hover:text-brand-blue mb-3" />
              <p className="font-heading font-bold text-sm uppercase tracking-widest mb-1">
                Pledge supplies
              </p>
              <p className="text-xs text-white/60 group-hover:text-brand-dark/70">
                Brand new only
              </p>
            </Link>
            <Link
              href="/back-to-school"
              className="group bg-white/5 hover:bg-white/10 rounded-xl p-4 border border-white/10 transition-all inline-flex items-center justify-between"
            >
              <div>
                <p className="font-heading font-bold text-sm uppercase tracking-widest">
                  Full details
                </p>
                <p className="text-xs text-white/60">The campaign hub</p>
              </div>
              <ArrowRight className="h-4 w-4 text-brand-accent" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
