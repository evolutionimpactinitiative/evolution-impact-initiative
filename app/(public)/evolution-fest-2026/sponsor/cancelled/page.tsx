import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FESTIVAL } from "@/lib/festival";
import { festivalMetadata } from "@/lib/festival/meta";

export const metadata: Metadata = festivalMetadata({
  title: "Sponsorship checkout cancelled · Evolution Fest 2026",
  description:
    "Your sponsorship checkout was cancelled. You can return to finish at any time.",
  noindex: true,
});

export default function SponsorCancelledPage() {
  return (
    <section className="min-h-screen bg-brand-pale/40 pt-32 pb-16 md:pt-40 md:pb-24">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl p-8 md:p-12 border border-brand-blue/15 text-center">
          <AlertCircle className="h-12 w-12 text-brand-blue mx-auto mb-5" />
          <h1 className="font-heading font-black text-3xl md:text-4xl text-brand-dark mb-3 leading-tight">
            Checkout cancelled
          </h1>
          <p className="text-brand-dark/70 mb-8 max-w-md mx-auto">
            No payment was taken and your sponsorship hasn&rsquo;t been
            confirmed. You can go back and finish at any time, or pick the
            Custom path if you&rsquo;d rather have a chat first.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button asChild>
              <Link href={`/${FESTIVAL.slug}/sponsor`}>
                Return to sponsor form
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/${FESTIVAL.slug}`}>Back to festival hub</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
