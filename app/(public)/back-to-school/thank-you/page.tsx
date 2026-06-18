import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  Heart,
  Share2,
  ArrowRight,
  Calendar,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FESTIVAL, FIRST_YEAR_STATS } from "@/lib/festival";

export const metadata: Metadata = {
  title: "Thank you · Back to School Campaign 2026",
  description:
    "Thank you for donating to the Back to School Campaign 2026 — helping 500 children in Medway start school with confidence.",
  robots: { index: false, follow: false },
};

export default function BackToSchoolThankYouPage() {
  return (
    <section className="min-h-screen bg-brand-pale/40 pt-32 pb-16 md:pt-40 md:pb-24">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl p-8 md:p-12 border border-brand-green/30 text-center">
            <CheckCircle2 className="h-16 w-16 text-brand-green mx-auto mb-5" />
            <h1 className="font-heading font-black text-3xl md:text-5xl text-brand-dark mb-4 leading-tight">
              You just put a uniform on a child&rsquo;s back.
            </h1>
            <p className="text-brand-dark/70 mb-8 max-w-md mx-auto leading-relaxed">
              Thank you for donating to the{" "}
              <strong className="text-brand-dark">
                Back to School Campaign 2026
              </strong>
              . Every pound counts toward helping{" "}
              {FIRST_YEAR_STATS.goalChildren} children in Medway start the
              school year with confidence.
            </p>

            <div className="bg-brand-pale/40 rounded-xl p-5 mb-8 text-left">
              <p className="font-heading text-[10px] uppercase tracking-widest text-brand-blue mb-3 text-center">
                What happens now
              </p>
              <ul className="space-y-2.5 text-sm text-brand-dark/85">
                <li className="flex items-start gap-2.5">
                  <Heart className="h-4 w-4 text-brand-green shrink-0 mt-0.5" />
                  <span>
                    Your receipt is on its way by email — check your inbox (and
                    spam folder).
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Heart className="h-4 w-4 text-brand-green shrink-0 mt-0.5" />
                  <span>
                    Your contribution is now counted toward the £10,000 goal
                    on the campaign page.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Heart className="h-4 w-4 text-brand-green shrink-0 mt-0.5" />
                  <span>
                    We&rsquo;ll share photos and a report once uniforms have
                    been distributed in August.
                  </span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 mb-8">
              <Button asChild>
                <Link href="/back-to-school">
                  Back to campaign page
                </Link>
              </Button>
              <Button asChild variant="outline">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    "I just donated to Evolution Impact Initiative's Back to School Campaign 2026 — helping 500 children in Medway start school with confidence. Join me: https://www.evolutionimpactinitiative.co.uk/back-to-school",
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share on WhatsApp
                </a>
              </Button>
            </div>
          </div>

          {/* Festival tie-in */}
          <div className="bg-brand-dark text-white rounded-2xl p-6 md:p-8 mt-6 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-accent rounded-full opacity-15 blur-3xl" />
            <div className="relative z-10">
              <p className="font-heading text-[10px] uppercase tracking-widest text-brand-accent mb-2">
                Celebrate with us
              </p>
              <h2 className="font-heading font-black text-xl md:text-2xl mb-3">
                Come to {FESTIVAL.title} — it&rsquo;s free.
              </h2>
              <p className="text-white/70 text-sm mb-5 leading-relaxed">
                The campaign culminates at our anniversary festival. Free
                tickets, family-friendly, all day.
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/60 mb-5">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-brand-accent" />
                  {FESTIVAL.dateLabel} · {FESTIVAL.timeLabel}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-brand-accent" />
                  {FESTIVAL.venueName}
                </span>
              </div>
              <Link
                href={`/${FESTIVAL.slug}`}
                className="inline-flex items-center gap-2 bg-brand-accent text-brand-dark font-heading font-bold text-xs uppercase tracking-widest px-4 py-2.5 rounded-md hover:bg-brand-green hover:text-white transition-colors"
              >
                Get free tickets
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
