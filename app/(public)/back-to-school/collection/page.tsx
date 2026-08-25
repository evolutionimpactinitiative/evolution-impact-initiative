import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  Shirt,
  Users,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  COLLECTION,
  COLLECTION_SLUG,
  COLLECTION_SLOTS,
  slotIso,
  slotLabel,
} from "@/lib/back-to-school/collection";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: `${COLLECTION.title} — ${COLLECTION.dateLabel}`,
  description:
    "A follow-on collection day for families in Medway. Pre-book a 30-minute slot, we pack your bag, you pick up.",
};

export default async function CollectionHubPage() {
  const admin = createAdminClient();

  // Look up the event row so we can show real live slot capacity.
  const { data: eventRow } = await admin
    .from("events")
    .select("id, total_slots")
    .eq("slug", COLLECTION_SLUG)
    .maybeSingle();
  const event = eventRow as { id: string; total_slots: number } | null;

  // Registrations per slot — for the "slots remaining" numbers on the hub.
  const slotCounts = new Map<string, number>();
  if (event) {
    const { data: regs } = await admin
      .from("registrations")
      .select("collection_slot, status")
      .eq("event_id", event.id)
      .in("status", ["approved", "pending"])
      .not("collection_slot", "is", null);
    for (const r of (regs as { collection_slot: string }[] | null) ?? []) {
      slotCounts.set(r.collection_slot, (slotCounts.get(r.collection_slot) ?? 0) + 1);
    }
  }

  const totalBooked = Array.from(slotCounts.values()).reduce((s, n) => s + n, 0);
  const totalCapacity = COLLECTION.slotCapacity * COLLECTION_SLOTS.length;
  const spacesLeft = Math.max(0, totalCapacity - totalBooked);

  return (
    <>
      {/* Hero */}
      <section className="bg-brand-blue text-white py-20 md:py-28 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 bg-brand-accent/20 text-brand-accent px-3 py-1 rounded-full text-xs font-heading font-bold uppercase tracking-widest mb-5">
              <Shirt className="h-3.5 w-3.5" />
              Collection Day · Second Round
            </p>
            <h1 className="font-heading font-black text-4xl md:text-6xl leading-tight mb-6">
              {COLLECTION.title}
            </h1>
            <p className="text-lg md:text-xl text-white/85 leading-relaxed mb-8">
              Our August drive left us with stock spare. This is a follow-on
              collection day for anyone in Medway who still needs uniform for
              their children — including families who missed us in August.
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
                className="bg-brand-accent text-brand-dark hover:bg-brand-green hover:text-white"
              >
                <Link href="/back-to-school/collection/register">
                  Book a collection slot
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white hover:text-brand-dark"
              >
                <Link href="/donate?campaign=back-to-school-collection-2026">
                  Donate to the drive
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Slots overview */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-6">
              <div>
                <p className="text-xs font-heading font-bold uppercase tracking-widest text-brand-blue">
                  Book a slot
                </p>
                <h2 className="text-2xl md:text-3xl font-heading font-black text-brand-dark mt-1">
                  Six 30-minute slots · 20 parents per slot
                </h2>
              </div>
              <p className="text-sm text-gray-600">
                <b>{spacesLeft}</b> of {totalCapacity} spaces still available
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {COLLECTION_SLOTS.map((s) => {
                const iso = slotIso(s);
                const booked = slotCounts.get(iso) ?? 0;
                const remaining = Math.max(0, COLLECTION.slotCapacity - booked);
                const full = remaining === 0;
                return (
                  <div
                    key={s}
                    className={`rounded-2xl border-2 p-4 text-center ${
                      full
                        ? "border-red-200 bg-red-50"
                        : "border-brand-blue/20 bg-white"
                    }`}
                  >
                    <p className="font-heading font-black text-brand-dark text-xl">
                      {slotLabel(s)}
                    </p>
                    <p
                      className={`text-xs mt-1 font-heading font-bold uppercase tracking-widest ${
                        full ? "text-red-700" : "text-brand-blue"
                      }`}
                    >
                      {full ? "Full" : `${remaining} left`}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Rules — plain-language, non-negotiable */}
      <section className="bg-brand-pale/40 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h2 className="text-2xl md:text-3xl font-heading font-black text-brand-dark">
                What you need to know
              </h2>
            </div>
            <ul className="space-y-4 text-brand-dark">
              <RuleRow
                title="You must turn up in your booked slot"
                body={`Arrive within your 30-minute window. If you miss it, you'll need to come back between ${COLLECTION.graceLabel} and wait until everything else has been distributed.`}
              />
              <RuleRow
                title="Miss us twice, and that's it"
                body="If you registered for our August drive and didn't collect, this is your second chance. If you register today and don't collect, you'll be blocked from all our future programs — a lot of prep and money goes into these drives, and other families need the space."
              />
              <RuleRow
                title="One bag per family, packed to your booking"
                body="When you submit, we reserve your items and pack the bag ahead of time. Please only book what you'll actually pick up."
              />
              <RuleRow
                title="Respect for everyone"
                body="Any disrespect toward volunteers or other families will get you asked to leave, and blocked from every future event we run. Zero tolerance."
              />
              <RuleRow
                title="Up to 4 children per family"
                body="If you have more than 4 school-age kids at home, drop us a note by email and we'll sort it out separately."
              />
            </ul>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-brand-dark text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-black mb-4">
            Ready to book?
          </h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto">
            The form takes 3 minutes. Live stock — you&rsquo;ll only be
            shown what we actually have on the shelf.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-brand-accent text-brand-dark hover:bg-brand-green hover:text-white"
            >
              <Link href="/back-to-school/collection/register">
                Book a collection slot
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function RuleRow({ title, body }: { title: string; body: string }) {
  return (
    <li className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5 flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0 mt-0.5">
        <Users className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="font-heading font-bold text-brand-dark">{title}</p>
        <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{body}</p>
      </div>
    </li>
  );
}
