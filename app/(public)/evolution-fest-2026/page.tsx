import type { Metadata } from "next";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  ArrowRight,
  Sparkles,
  PlayCircle,
  Megaphone,
  Heart,
  HandHelping,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/shared/SectionLabel";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { createAdminClient } from "@/lib/supabase/admin";
import { FestivalProgressBar } from "@/components/festival/FestivalProgressBar";
import { FestivalSponsorWall } from "@/components/festival/FestivalSponsorWall";
import {
  FESTIVAL,
  FESTIVAL_FAQ,
  FESTIVAL_HIGHLIGHTS,
  FIRST_YEAR_STATS,
  SPONSOR_TIERS,
  VENDOR_CATEGORIES,
  VENDOR_TOTAL_CAP,
  getSponsorsByPath,
} from "@/lib/festival";

export const metadata: Metadata = {
  title: "Evolution Fest 2026 | Free Family Festival, Medway",
  description:
    "A free family festival celebrating one year of Evolution Impact Initiative. Saturday 25 July 2026, 12pm–6pm at Strood Youth Centre. Get free tickets, become a vendor, sponsor or volunteer.",
};

// Reflects live event status + ticket availability + sponsor wall on every request
export const revalidate = 0;

interface VendorCountRow {
  category: string;
  active_total: number;
}

export default async function FestivalHubPage() {
  const supabase = createAdminClient();

  // Try to find the festival event row. If migration hasn't run yet,
  // we degrade gracefully and use FESTIVAL constants only.
  const { data: eventRow } = await supabase
    .from("events")
    .select("id, status, total_slots, publish_at")
    .eq("slug", FESTIVAL.slug)
    .maybeSingle();

  const eventId = eventRow?.id ?? null;
  const now = new Date();
  const publishAt = eventRow?.publish_at
    ? new Date(eventRow.publish_at as string)
    : null;
  const isScheduled = !!publishAt && publishAt > now;
  // Treat as "live" only when status=published AND publish_at has passed (or is null)
  const isPublished = eventRow?.status === "published" && !isScheduled;

  // Ticket availability — count registered attendees if event exists
  let ticketsRemaining: number = FESTIVAL.totalTickets;
  if (eventId) {
    const { data: regs } = await supabase
      .from("registrations")
      .select("id, registration_children (id), registration_attendees (id)")
      .eq("event_id", eventId)
      .eq("status", "confirmed");

    type RegRow = {
      id: string;
      registration_children: { id: string }[] | null;
      registration_attendees: { id: string }[] | null;
    };
    const taken = ((regs as RegRow[] | null) || []).reduce(
      (sum, r) =>
        sum +
        1 + // lead booker
        (r.registration_children?.length || 0) +
        (r.registration_attendees?.length || 0),
      0,
    );
    ticketsRemaining = Math.max(
      0,
      (eventRow?.total_slots ?? FESTIVAL.totalTickets) - taken,
    );
  }

  // Sponsors (confirmed only)
  let sponsors: Awaited<ReturnType<typeof loadSponsors>> = [];
  if (eventId) {
    sponsors = await loadSponsors(eventId);
  }

  // Vendor counts by category (for "X spaces left")
  let vendorCounts: Record<string, number> = {};
  if (eventId) {
    const { data: counts } = await supabase.rpc("get_festival_vendor_counts", {
      p_event_id: eventId,
    });
    const rows = (counts as VendorCountRow[] | null) || [];
    vendorCounts = rows.reduce(
      (acc, r) => ({ ...acc, [r.category]: r.active_total }),
      {} as Record<string, number>,
    );
  }

  // Donations raised for Back to School campaign
  let raisedPence = 0;
  const { data: donations } = await supabase
    .from("donations")
    .select("amount")
    .eq("campaign", FESTIVAL.campaignKey)
    .eq("status", "completed");
  if (donations) {
    raisedPence = (donations as { amount: number }[]).reduce(
      (sum, d) => sum + d.amount,
      0,
    );
  }

  const ticketsCtaHref = isPublished
    ? `/events/${FESTIVAL.slug}/register`
    : `/${FESTIVAL.slug}#tickets`;

  const scheduledLabel = publishAt
    ? publishAt.toLocaleString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  const ticketsButtonLabel = isPublished
    ? "Book free tickets"
    : isScheduled && scheduledLabel
      ? `Tickets open ${scheduledLabel}`
      : "Tickets opening soon";

  return (
    <>
      {/* ============================================
          HERO
          ============================================ */}
      <section className="relative bg-brand-dark text-white pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-brand-accent rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-[28rem] h-[28rem] bg-brand-blue rounded-full opacity-20 blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl">
            <p className="font-heading text-xs uppercase tracking-widest text-brand-accent mb-4">
              The festival · CIC · Medway
            </p>

            <h1 className="font-heading font-black text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-none mb-6">
              EVOLUTION
              <br />
              FEST 2026
            </h1>

            <p className="font-heading font-bold text-brand-accent text-xl md:text-2xl mb-6">
              {FESTIVAL.tagline}
            </p>

            <p className="text-lg text-white/70 max-w-2xl mb-10 leading-relaxed">
              A free family festival celebrating one year of impact — supporting
              our campaign to help{" "}
              <span className="text-white font-semibold">
                {FIRST_YEAR_STATS.goalChildren} children in Medway
              </span>{" "}
              start school with confidence.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <Pill icon={<Calendar className="h-4 w-4" />} text={FESTIVAL.dateLabel} />
              <Pill icon={<Clock className="h-4 w-4" />} text={FESTIVAL.timeLabel} />
              <Pill
                icon={<MapPin className="h-4 w-4" />}
                text={`${FESTIVAL.venueName}, ${FESTIVAL.venueArea}`}
              />
              <Pill
                icon={<Users className="h-4 w-4" />}
                text={`${FESTIVAL.expectedAttendance} expected`}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                size="lg"
                className="bg-brand-accent text-brand-dark hover:bg-brand-green hover:text-white"
              >
                <Link href={ticketsCtaHref}>
                  Get free tickets
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white hover:text-brand-dark"
              >
                <Link href="#vendors">Apply as a vendor</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          WHAT TO EXPECT
          ============================================ */}
      <section className="bg-white py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mb-12">
            <SectionLabel text="The day itself" color="brand-blue" className="mb-6" />
            <h2 className="font-heading font-black text-3xl md:text-4xl lg:text-5xl text-brand-dark mb-4">
              A free, family day out for all of Medway
            </h2>
            <p className="text-brand-dark/70 leading-relaxed">
              A celebration of community — and a fundraiser with heart.
              Here&apos;s what families can look forward to on the day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {FESTIVAL_HIGHLIGHTS.map((item) => (
              <div
                key={item.title}
                className="bg-brand-pale/30 rounded-xl p-6 border border-brand-blue/10 hover:border-brand-blue/30 transition-colors"
              >
                <h3 className="font-heading font-bold text-lg text-brand-dark mb-2">
                  {item.title}
                </h3>
                <p className="text-brand-dark/70 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          WATCH OUR STORY (placeholder)
          ============================================ */}
      <section className="bg-brand-pale/40 py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-brand-dark rounded-2xl overflow-hidden text-white">
            <div className="grid grid-cols-1 md:grid-cols-2 items-center">
              <div className="p-8 md:p-12">
                <SectionLabel
                  text="One year of impact"
                  color="brand-accent"
                  className="mb-5"
                />
                <h3 className="font-heading font-black text-3xl md:text-4xl mb-4 leading-tight">
                  See what a year of showing up looks like.
                </h3>
                <p className="text-white/70 mb-2">
                  749 people supported. 12 community events. 114 uniforms
                  handed out. 200 turkeys distributed. We&apos;re only just
                  beginning.
                </p>
                <p className="text-xs text-white/40 mt-4">
                  Film coming soon — check back nearer to the day.
                </p>
              </div>
              <div className="relative bg-brand-blue/40 aspect-video md:aspect-auto md:h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <PlayCircle className="h-20 w-20 text-brand-accent" />
                  <p className="text-sm text-white/60 font-heading uppercase tracking-widest">
                    Story film
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          TICKETS
          ============================================ */}
      <section id="tickets" className="bg-white py-20 md:py-32 scroll-mt-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <SectionLabel text="Tickets" color="brand-green" className="mb-6" />
              <h2 className="font-heading font-black text-3xl md:text-4xl lg:text-5xl text-brand-dark mb-6">
                Free tickets · book your spot
              </h2>
              <p className="text-brand-dark/70 leading-relaxed mb-6">
                The festival is free, but capacity is limited to{" "}
                {FESTIVAL.totalTickets} people. Book one ticket per person —
                including children. A family of four = four tickets.
              </p>
              <ul className="space-y-3 mb-8 text-brand-dark/80">
                <Bullet>One ticket per person, including children</Bullet>
                <Bullet>QR code for fast check-in on the day</Bullet>
                <Bullet>Email confirmation with all tickets together</Bullet>
                <Bullet>Reminders 7 days, 24h and 1h before the festival</Bullet>
              </ul>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg">
                  <Link href={ticketsCtaHref}>
                    {ticketsButtonLabel}
                    <Ticket className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="bg-brand-pale/40 border border-brand-blue/10 rounded-2xl p-8 md:p-10">
              <p className="font-heading text-xs uppercase tracking-widest text-brand-blue mb-3">
                Capacity
              </p>
              <p className="font-heading font-black text-5xl md:text-6xl text-brand-dark mb-2 leading-none">
                {ticketsRemaining}
                <span className="text-2xl md:text-3xl text-brand-dark/40">
                  {" "}
                  / {FESTIVAL.totalTickets}
                </span>
              </p>
              <p className="text-brand-dark/70 mb-6">tickets available</p>

              <div className="h-2 bg-brand-blue/10 rounded-full overflow-hidden mb-6">
                <div
                  className="h-full bg-brand-blue rounded-full transition-all"
                  style={{
                    width: `${Math.max(0, Math.min(100, ((FESTIVAL.totalTickets - ticketsRemaining) / FESTIVAL.totalTickets) * 100))}%`,
                  }}
                />
              </div>

              <p className="text-sm text-brand-dark/60 leading-relaxed">
                Tickets are transferable — you can share with friends or family
                if your plans change.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          CAMPAIGN PROGRESS
          ============================================ */}
      <section className="bg-brand-dark text-white py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <FestivalProgressBar raisedPence={raisedPence} />
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button asChild className="bg-brand-accent text-brand-dark hover:bg-brand-green hover:text-white">
                <Link href="/donate">
                  Donate to the campaign
                  <Heart className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          VENDORS
          ============================================ */}
      <section
        id="vendors"
        className="bg-brand-pale/40 py-20 md:py-32 scroll-mt-24"
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
            <div className="lg:col-span-2">
              <SectionLabel text="Vendors" color="brand-blue" className="mb-6" />
              <h2 className="font-heading font-black text-3xl md:text-4xl lg:text-5xl text-brand-dark mb-4">
                Trade at the Fest
              </h2>
              <p className="text-brand-dark/70 leading-relaxed mb-3">
                A simple, fair contribution to take part — and every penny
                supports the Back to School campaign. Maximum {VENDOR_TOTAL_CAP}{" "}
                vendors across all categories.
              </p>
              <p className="text-brand-dark/70 text-sm">
                Applications close{" "}
                <span className="font-heading font-bold text-brand-blue">
                  {FESTIVAL.applicationDeadlineLabel}
                </span>
                .
              </p>
            </div>
            <div className="flex lg:items-end lg:justify-end">
              <Button asChild size="lg">
                <Link href={`/${FESTIVAL.slug}/apply-vendor`}>
                  Apply as a vendor
                  <Megaphone className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {VENDOR_CATEGORIES.map((cat) => {
              const taken = vendorCounts[cat.key] ?? 0;
              const remaining = Math.max(0, cat.cap - taken);
              const full = remaining === 0;
              return (
                <div
                  key={cat.key}
                  className="bg-white rounded-xl p-6 border border-brand-blue/10"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-heading font-bold text-lg text-brand-dark">
                      {cat.label}
                    </h3>
                    <span
                      className={`text-[10px] uppercase tracking-widest font-heading font-bold px-2 py-1 rounded-full whitespace-nowrap ${
                        full
                          ? "bg-brand-dark/10 text-brand-dark/50"
                          : "bg-brand-green/10 text-brand-green"
                      }`}
                    >
                      {full ? "Full" : `${remaining} of ${cat.cap} left`}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {cat.examples.map((ex) => (
                      <span
                        key={ex}
                        className="text-xs bg-brand-pale text-brand-blue px-2.5 py-1 rounded-full"
                      >
                        {ex}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`font-heading font-black text-2xl ${
                        cat.contributionPence === 0
                          ? "text-brand-green"
                          : "text-brand-blue"
                      }`}
                    >
                      {cat.contributionLabel}
                    </span>
                    {cat.contributionPence > 0 && (
                      <span className="text-xs text-brand-dark/50">
                        community contribution
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================
          SPONSORS
          ============================================ */}
      <section
        id="sponsors"
        className="bg-brand-dark text-white py-20 md:py-32 scroll-mt-24"
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
            <div className="lg:col-span-2">
              <SectionLabel
                text="Sponsors & partners"
                color="brand-accent"
                className="mb-6"
              />
              <h2 className="font-heading font-black text-3xl md:text-4xl lg:text-5xl mb-4">
                Lead the campaign
              </h2>
              <p className="text-white/70 leading-relaxed">
                Three paths — from £50 to £3,000+. Every partner is recognised
                and celebrated, with real, measurable impact attached to their
                name.
              </p>
            </div>
            <div className="flex lg:items-end lg:justify-end">
              <Button
                asChild
                size="lg"
                className="bg-brand-accent text-brand-dark hover:bg-brand-green hover:text-white"
              >
                <Link href={`/${FESTIVAL.slug}/sponsor`}>
                  Become a sponsor
                  <Sparkles className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Premium tiers */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-12">
            {getSponsorsByPath("premium").map((tier) => (
              <SponsorTierCard key={tier.key} tier={tier} />
            ))}
          </div>

          {/* Community + activity teaser */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <p className="font-heading text-xs uppercase tracking-widest text-brand-accent mb-3">
                Community ladder · from £50
              </p>
              <p className="font-heading font-bold text-lg mb-2">
                Family Fun · Gold · Silver · Bronze · Friend
              </p>
              <p className="text-sm text-white/70">
                Five tiers from £50 to £750 — a level for every local business.
                Logo placement, banner billing and community stall space scale
                with the tier.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <p className="font-heading text-xs uppercase tracking-widest text-brand-accent mb-3">
                Activity zones · from £300
              </p>
              <p className="font-heading font-bold text-lg mb-2">
                Put your name on the fun
              </p>
              <p className="text-sm text-white/70">
                Sponsor a single activity — Children&apos;s Zone, Ice Cream,
                Arts & Crafts, Sports, or Face Painting. Your brand becomes the
                proud host of that moment.
              </p>
            </div>
          </div>

          {/* Logo wall */}
          <h3 className="font-heading text-sm uppercase tracking-widest text-white/60 mb-6">
            With thanks to our partners
          </h3>
          <FestivalSponsorWall sponsors={sponsors} />
        </div>
      </section>

      {/* ============================================
          VOLUNTEERS
          ============================================ */}
      <section
        id="volunteer"
        className="bg-brand-pale/40 py-20 md:py-32 scroll-mt-24"
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <SectionLabel text="Volunteer" color="brand-green" className="mb-6" />
              <h2 className="font-heading font-black text-3xl md:text-4xl lg:text-5xl text-brand-dark mb-6">
                Join the on-day team
              </h2>
              <p className="text-brand-dark/70 leading-relaxed mb-8">
                We&apos;re building the team that makes the day work — from
                setting up the tents to running the kids&apos; zone to packing
                everything down at the end. Tell us when you can help and what
                you&apos;d enjoy doing.
              </p>
              <ul className="space-y-3 mb-8 text-brand-dark/80">
                <Bullet>Free Evolution Impact T-shirt for every volunteer</Bullet>
                <Bullet>Flexible shifts — setup, AM, PM, packdown</Bullet>
                <Bullet>Refreshments throughout the day</Bullet>
                <Bullet>A reference from a registered CIC</Bullet>
              </ul>
              <Button asChild size="lg" variant="secondary">
                <Link href={`/${FESTIVAL.slug}/volunteer`}>
                  Apply to volunteer
                  <HandHelping className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
            <div className="bg-white rounded-2xl p-8 md:p-10 border border-brand-blue/10">
              <p className="font-heading text-xs uppercase tracking-widest text-brand-blue mb-5">
                What we&apos;ll ask
              </p>
              <div className="space-y-4 text-brand-dark/80 text-sm">
                <p>
                  <span className="font-heading font-bold text-brand-dark">
                    Your availability
                  </span>{" "}
                  — setup, festival AM (12pm–3pm), PM (3pm–6pm), packdown.
                </p>
                <p>
                  <span className="font-heading font-bold text-brand-dark">
                    T-shirt size
                  </span>{" "}
                  — so we can have yours ready on the day.
                </p>
                <p>
                  <span className="font-heading font-bold text-brand-dark">
                    Skills or experience
                  </span>{" "}
                  — anything from face painting to first aid to crowd handling.
                </p>
                <p>
                  <span className="font-heading font-bold text-brand-dark">
                    Emergency contact
                  </span>{" "}
                  — standard safeguarding for all our volunteers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          FAQ
          ============================================ */}
      <section className="bg-white py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <SectionLabel
              text="Frequently asked"
              color="brand-blue"
              className="mb-6"
            />
            <h2 className="font-heading font-black text-3xl md:text-4xl text-brand-dark mb-10">
              Anything else?
            </h2>

            <Accordion type="single" collapsible className="space-y-2">
              {FESTIVAL_FAQ.map((item, idx) => (
                <AccordionItem
                  key={idx}
                  value={`item-${idx}`}
                  className="border border-brand-blue/10 rounded-lg px-5 bg-brand-pale/20"
                >
                  <AccordionTrigger className="text-left text-brand-dark hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-brand-dark/70 leading-relaxed pt-1">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* ============================================
          FINAL CTA
          ============================================ */}
      <section className="bg-brand-dark text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <p className="font-heading text-xs uppercase tracking-widest text-brand-accent mb-4">
            Don&apos;t miss out
          </p>
          <h2 className="font-heading font-black text-3xl md:text-5xl mb-4 leading-tight">
            Save the date · {FESTIVAL.dateLabel}
          </h2>
          <p className="text-white/70 max-w-xl mx-auto mb-8">
            Free tickets are limited to {FESTIVAL.totalTickets}. Book early to
            secure your spot.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-brand-accent text-brand-dark hover:bg-brand-green hover:text-white"
            >
              <Link href={ticketsCtaHref}>
                Get free tickets
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white hover:text-brand-dark"
            >
              <Link href="/our-first-year">See our first year</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

// ----------------------------------------------
// Helpers / sub-components
// ----------------------------------------------

async function loadSponsors(eventId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("festival_sponsors")
    .select("id, organisation_name, display_name, logo_url, website, path, tier_key")
    .eq("event_id", eventId)
    .eq("status", "confirmed")
    .order("amount_pledged", { ascending: false });

  type SponsorRow = {
    id: string;
    organisation_name: string;
    display_name: string | null;
    logo_url: string | null;
    website: string | null;
    path: "premium" | "community" | "activity" | "custom";
    tier_key: string;
  };
  return (data as SponsorRow[] | null) || [];
}

function Pill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 bg-white/5 border border-white/15 text-white/90 px-4 py-2 rounded-full text-sm">
      <span className="text-brand-accent">{icon}</span>
      {text}
    </span>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-2 h-1.5 w-1.5 bg-brand-green rounded-full shrink-0" />
      <span>{children}</span>
    </li>
  );
}

function SponsorTierCard({
  tier,
}: {
  tier: (typeof SPONSOR_TIERS)[number];
}) {
  return (
    <div
      className={`rounded-2xl p-6 md:p-7 flex flex-col ${
        tier.highlight
          ? "bg-brand-accent/10 border border-brand-accent/40"
          : "bg-white/5 border border-white/10"
      }`}
    >
      {tier.badge && (
        <span
          className={`text-[10px] uppercase tracking-widest font-heading font-bold px-2.5 py-1 rounded-full w-fit mb-4 ${
            tier.highlight
              ? "bg-brand-accent text-brand-dark"
              : "bg-white/10 text-white/80"
          }`}
        >
          {tier.badge}
        </span>
      )}
      <h3 className="font-heading font-black text-xl md:text-2xl mb-1">
        {tier.label}
      </h3>
      <p
        className={`font-heading font-black text-3xl md:text-4xl mb-5 ${
          tier.highlight ? "text-brand-accent" : "text-white"
        }`}
      >
        {tier.priceLabel}
      </p>
      <ul className="space-y-2 mb-5 text-sm text-white/80 flex-1">
        {tier.perks.map((p) => (
          <li key={p} className="flex items-start gap-2">
            <span
              className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${
                tier.highlight ? "bg-brand-accent" : "bg-brand-green"
              }`}
            />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      {tier.impactLabel && (
        <p
          className={`text-xs font-heading font-semibold ${
            tier.highlight ? "text-brand-accent" : "text-brand-green"
          }`}
        >
          {tier.impactLabel}
        </p>
      )}
    </div>
  );
}
