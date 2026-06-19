import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Calendar, MapPin, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FESTIVAL } from "@/lib/festival";
import { festivalMetadata } from "@/lib/festival/meta";

export const metadata: Metadata = festivalMetadata({
  title: "Application received · Evolution Fest 2026",
  description:
    "Your vendor application for Evolution Fest 2026 has been received and is pending review.",
  noindex: true,
});

export default function VendorSuccessPage() {
  return (
    <section className="min-h-screen bg-brand-pale/40 pt-32 pb-16 md:pt-40 md:pb-24">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl p-8 md:p-12 border border-brand-green/30 text-center">
          <CheckCircle2 className="h-14 w-14 text-brand-green mx-auto mb-5" />
          <h1 className="font-heading font-black text-3xl md:text-4xl text-brand-dark mb-3 leading-tight">
            Payment received — you&rsquo;re in the queue.
          </h1>
          <p className="text-brand-dark/70 mb-8 max-w-md mx-auto">
            Thanks for supporting the Back to School campaign. Your vendor
            application is now pending review.
          </p>

          <div className="bg-brand-pale/40 rounded-xl p-5 mb-8 text-left">
            <p className="font-heading text-[10px] uppercase tracking-widest text-brand-blue mb-3 text-center">
              The festival
            </p>
            <ul className="space-y-2 text-sm text-brand-dark/85">
              <li className="flex items-center gap-2 justify-center">
                <Calendar className="h-4 w-4 text-brand-blue" />
                {FESTIVAL.dateLabel} · {FESTIVAL.timeLabel}
              </li>
              <li className="flex items-center gap-2 justify-center">
                <MapPin className="h-4 w-4 text-brand-blue" />
                {FESTIVAL.venueName}, {FESTIVAL.venueArea}
              </li>
            </ul>
          </div>

          <div className="bg-brand-dark text-white rounded-xl p-5 mb-8 text-left">
            <p className="font-heading text-[10px] uppercase tracking-widest text-brand-accent mb-3">
              What happens next
            </p>
            <ol className="space-y-2 text-sm text-white/85 list-decimal list-inside">
              <li>We&rsquo;ll review your application within 5 working days.</li>
              <li>
                You&rsquo;ll get a confirmation email with pitch details and a
                checklist of documents to send back.
              </li>
              <li>
                If for any reason we can&rsquo;t accept your application,
                we&rsquo;ll refund your contribution in full.
              </li>
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button asChild>
              <Link href={`/${FESTIVAL.slug}`}>Back to festival hub</Link>
            </Button>
            <Button asChild variant="outline">
              <a
                href="mailto:hello@evolutionimpactinitiative.co.uk"
                className="inline-flex items-center"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send our team a note
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
