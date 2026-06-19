import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, MapPin, AlertCircle } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { SponsorApplyForm } from "@/components/festival/SponsorApplyForm";
import { FESTIVAL, FESTIVAL_SLUG, SPONSOR_TIERS } from "@/lib/festival";
import { festivalMetadata } from "@/lib/festival/meta";

export const metadata: Metadata = festivalMetadata({
  title: "Become a sponsor · Evolution Fest 2026",
  description:
    "Sponsor Evolution Fest 2026 and the Back to School campaign — premium tiers, community ladder (£50–£750), and activity zones (from £300).",
});

// Live capacity for capped tiers (Title Partner + activity zones)
export const revalidate = 0;

export default async function SponsorPage() {
  const supabase = createAdminClient();

  const { data: eventRow } = await supabase
    .from("events")
    .select("id")
    .eq("slug", FESTIVAL_SLUG)
    .maybeSingle();
  const eventId = (eventRow as { id: string } | null)?.id ?? null;

  // Count tier_keys that are already taken (active applications)
  // so we can disable capped tiers (Title Partner + activity zones).
  const takenTierKeys = new Set<string>();
  if (eventId) {
    const { data: rows } = await supabase
      .from("festival_sponsors")
      .select("tier_key")
      .eq("event_id", eventId)
      .in("status", ["pending_payment", "pending_review", "confirmed"]);
    for (const r of (rows as { tier_key: string }[] | null) ?? []) {
      takenTierKeys.add(r.tier_key);
    }
  }

  // Filter to ONLY capped tiers — others have no constraint
  const cappedTakenTiers = SPONSOR_TIERS.filter(
    (t) => t.cap !== null && takenTierKeys.has(t.key),
  ).map((t) => t.key);

  // Deadline gate
  const now = new Date();
  const deadline = new Date(`${FESTIVAL.applicationDeadline}T23:59:59`);
  const isClosed = now > deadline;

  return (
    <>
      {/* Hero */}
      <section className="relative bg-brand-dark text-white pt-32 pb-16 md:pt-40 md:pb-20 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-brand-accent rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-brand-blue rounded-full opacity-20 blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <p className="font-heading text-xs uppercase tracking-widest text-brand-accent mb-4">
              Sponsorship
            </p>
            <h1 className="font-heading font-black text-4xl md:text-6xl leading-none mb-6">
              Lead the campaign.
            </h1>
            <p className="text-lg text-white/75 max-w-2xl leading-relaxed mb-6">
              Three paths — premium partnerships, a community ladder from £50 to
              £750, and activity-zone sponsorships from £300. Every partner is
              recognised and celebrated.
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/70">
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

      {/* Body */}
      <section className="bg-brand-pale/40 py-16 md:py-24">
        <div className="container mx-auto px-4">
          {isClosed ? (
            <ClosedState />
          ) : !eventId ? (
            <NotReadyState />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8">
                <SectionLabel
                  text="Sponsor application"
                  color="brand-blue"
                  className="mb-5"
                />
                <h2 className="font-heading font-black text-2xl md:text-3xl text-brand-dark mb-2">
                  Pick a path & tier
                </h2>
                <p className="text-brand-dark/70 mb-8">
                  Fixed-price tiers go straight to checkout. Custom partnerships
                  go to our team for a personal call within 2 working days.
                </p>

                <SponsorApplyForm cappedTakenTiers={cappedTakenTiers} />
              </div>

              <aside className="lg:col-span-4 space-y-4">
                <Sidebar cappedTakenTiers={cappedTakenTiers} />
              </aside>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function Sidebar({ cappedTakenTiers }: { cappedTakenTiers: string[] }) {
  const titleTaken = cappedTakenTiers.includes("title_partner");
  return (
    <>
      <div className="bg-white rounded-2xl p-6 border border-brand-blue/10">
        <p className="font-heading text-xs uppercase tracking-widest text-brand-blue mb-3">
          Why partner with us
        </p>
        <ul className="space-y-3 text-sm text-brand-dark/85">
          <li>
            <strong className="text-brand-dark">Local impact you can see.</strong>{" "}
            500 children walking into class with the kit they need.
          </li>
          <li>
            <strong className="text-brand-dark">Real visibility.</strong>{" "}
            Banners, social, web — across hundreds of attendees and beyond.
          </li>
          <li>
            <strong className="text-brand-dark">A CSR story you can tell.</strong>{" "}
            Numbers attached. We&rsquo;ll share usable photos & coverage after the day.
          </li>
        </ul>
      </div>

      {titleTaken && (
        <div className="bg-brand-dark text-white rounded-2xl p-6">
          <p className="font-heading text-xs uppercase tracking-widest text-brand-accent mb-3">
            Title Partner taken
          </p>
          <p className="text-sm text-white/80 leading-relaxed">
            Our headline £3,000 Title Partner spot is reserved. Community
            Impact Partner (£1,500) and Back to School Champion (£1,000+) are
            still open.
          </p>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 border border-brand-blue/10">
        <p className="font-heading text-xs uppercase tracking-widest text-brand-blue mb-3">
          Want to talk first?
        </p>
        <p className="text-sm text-brand-dark/70 leading-relaxed mb-3">
          Pick the <strong>Custom partnership</strong> path — tell us your
          budget and goals and we&rsquo;ll tailor a package around them.
        </p>
        <p className="text-sm text-brand-dark/70 leading-relaxed">
          Or drop a line to{" "}
          <a
            href="mailto:macram@evolutionimpactinitiative.co.uk"
            className="text-brand-blue underline"
          >
            macram@evolutionimpactinitiative.co.uk
          </a>
          .
        </p>
      </div>
    </>
  );
}

function ClosedState() {
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl p-10 text-center border border-brand-blue/10">
      <AlertCircle className="h-10 w-10 text-brand-blue mx-auto mb-4" />
      <h2 className="font-heading font-black text-2xl text-brand-dark mb-3">
        Sponsorship applications closed
      </h2>
      <p className="text-brand-dark/70 mb-6">
        Sponsorship applications for {FESTIVAL.title} closed on{" "}
        {FESTIVAL.applicationDeadlineLabel}. Get in touch and we&rsquo;d love
        to talk about next year.
      </p>
      <Button asChild>
        <Link href="/contact">Get in touch</Link>
      </Button>
    </div>
  );
}

function NotReadyState() {
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl p-10 text-center border border-brand-blue/10">
      <h2 className="font-heading font-black text-2xl text-brand-dark mb-3">
        Sponsorship opening soon
      </h2>
      <p className="text-brand-dark/70 mb-6">
        The festival isn&rsquo;t live in our system yet. Check back shortly.
      </p>
      <Button asChild>
        <Link href={`/${FESTIVAL_SLUG}`}>Back to festival hub</Link>
      </Button>
    </div>
  );
}
