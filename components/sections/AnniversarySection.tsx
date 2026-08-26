import Link from "next/link";
import { ArrowRight, Calendar, Clock, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { FIRST_YEAR_STATS } from "@/lib/festival";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  COLLECTION,
  COLLECTION_SLUG,
  COLLECTION_SLOTS,
} from "@/lib/back-to-school/collection";

// Fetches live slot availability on every render (public homepage is
// force-dynamic already via its top-level `dynamic = "force-dynamic"`
// on other data-driven paths). Card auto-hides after the drive.
export async function AnniversarySection() {
  const collection = await loadCollectionCardData();

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

        {/* Collection Day card — only renders during the booking window */}
        {collection && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-10 lg:p-12 backdrop-blur-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 bg-brand-accent/15 text-brand-accent px-3 py-1 rounded-full text-xs font-heading font-semibold uppercase tracking-wider mb-5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Collection Day, second round
                </div>

                <h3 className="font-heading font-black text-2xl md:text-4xl lg:text-5xl leading-tight mb-4">
                  {COLLECTION.title}
                </h3>
                <p className="text-brand-accent font-heading font-semibold text-lg md:text-xl mb-5">
                  {collection.spacesLeft > 0
                    ? `${collection.spacesLeft} of ${collection.totalCapacity} slots still available.`
                    : "All slots are full — thank you Medway."}
                </p>

                <p className="text-white/70 mb-6 leading-relaxed max-w-xl">
                  A follow-on collection day using stock from our August
                  drive. Pre-book a 30-minute slot, we pack your bag, you
                  pick up. Open to any family in Medway who still needs
                  uniform for their children.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 text-sm text-white/80 mb-8">
                  <span className="inline-flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-brand-accent" />
                    {COLLECTION.dateLabel}
                  </span>
                  <span className="hidden sm:inline text-white/30">·</span>
                  <span className="inline-flex items-center gap-2">
                    <Clock className="h-4 w-4 text-brand-accent" />
                    {COLLECTION.timeLabel}
                  </span>
                  <span className="hidden sm:inline text-white/30">·</span>
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-brand-accent" />
                    {COLLECTION.venueName}, {COLLECTION.venueArea}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    asChild
                    size="lg"
                    disabled={collection.spacesLeft === 0}
                    className="bg-brand-accent text-brand-dark hover:bg-brand-green hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Link
                      href={
                        collection.spacesLeft > 0
                          ? "/back-to-school/collection/register"
                          : "/back-to-school/collection"
                      }
                    >
                      {collection.spacesLeft > 0
                        ? "Book a slot"
                        : "See details"}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white hover:text-brand-dark"
                  >
                    <Link href="/back-to-school/collection">Full details</Link>
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
                    href="/donate?campaign=back-to-school-collection-2026"
                    title="Donate to the drive"
                    subtitle="Every £20 kits one child head to toe"
                  />
                  <CampaignCtaRow
                    href="/back-to-school/collection"
                    title="Read the rules"
                    subtitle="Slot policy, no-show policy, code of conduct"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Data ───────────────────────────────────────────────────────

interface CollectionCardData {
  spacesLeft: number;
  totalCapacity: number;
}

async function loadCollectionCardData(): Promise<CollectionCardData | null> {
  // Retire the card the day AFTER the drive so it doesn't advertise
  // a past date. Compares by ISO date (no time zone drift).
  const cutoff = new Date(COLLECTION.date + "T23:59:59+01:00");
  if (Date.now() > cutoff.getTime()) return null;

  try {
    const admin = createAdminClient();
    const { data: eventRow } = await admin
      .from("events")
      .select("id")
      .eq("slug", COLLECTION_SLUG)
      .maybeSingle();
    if (!eventRow) return null;

    const { data: regs } = await admin
      .from("registrations")
      .select("collection_slot, status")
      .eq("event_id", (eventRow as { id: string }).id)
      .in("status", ["approved", "pending"])
      .not("collection_slot", "is", null);

    const booked =
      ((regs as { collection_slot: string }[] | null) ?? []).length;
    const totalCapacity = COLLECTION.slotCapacity * COLLECTION_SLOTS.length;
    return {
      spacesLeft: Math.max(0, totalCapacity - booked),
      totalCapacity,
    };
  } catch {
    // If the DB is unreachable, don't kill the homepage. Show nothing.
    return null;
  }
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
