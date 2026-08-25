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
  title: `${COLLECTION.title}, ${COLLECTION.dateLabel}`,
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
              Collection Day, second round
            </p>
            <h1 className="font-heading font-black text-4xl md:text-6xl leading-tight mb-6">
              {COLLECTION.title}
            </h1>
            <p className="text-lg md:text-xl text-white/85 leading-relaxed mb-8">
              Our August drive left us with stock available. This is a
              follow-on collection day for anyone in Medway who still
              needs uniform for their children, including families who
              missed us in August.
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
                <p className="text-xs font-heading font-semibold uppercase tracking-widest text-brand-blue">
                  Book a slot
                </p>
                <h2 className="text-xl md:text-2xl font-heading font-bold text-brand-dark mt-1">
                  Six 30-minute slots, {COLLECTION.slotCapacity} parents per slot
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
                    className={`rounded-xl border p-3 text-center ${
                      full
                        ? "border-red-200 bg-red-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <p className="font-heading text-brand-dark text-base font-semibold">
                      {slotLabel(s)}
                    </p>
                    <p
                      className={`text-xs mt-1 font-medium ${
                        full ? "text-red-700" : "text-gray-500"
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
                title="Please attend during your booked slot"
                body={`The day runs on a strict schedule. Please arrive within your 30-minute window. If you arrive late, you can return between ${COLLECTION.graceLabel}, where remaining items will be distributed after all pre-booked slots have been served.`}
              />
              <RuleRow
                title="Final-chance policy for repeat no-shows"
                body="If you registered for our August drive and did not attend, this is your final opportunity to collect from us. If you register for Collection Day and do not attend, you will be unable to take part in future EII programs. A significant amount of preparation and funding goes into each drive, and every unclaimed booking prevents another family from being helped."
              />
              <RuleRow
                title="One bag per family, packed to your booking"
                body="Submitting the form reserves your items so we can pack your bag in advance. Please only book what you intend to collect. If your plans change, contact us so we can release the items to another family."
              />
              <RuleRow
                title="Code of conduct"
                body="Every family, volunteer and staff member should be treated with respect. Any disrespectful or aggressive behaviour towards our team or other visitors will result in you being asked to leave, and being permanently excluded from all future EII events."
              />
              <RuleRow
                title="Up to 4 children per family"
                body="If you have more than 4 school-age children in your household, please email us and we will make separate arrangements."
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
            The form takes 3 minutes and only shows items we currently
            have in stock for your child&rsquo;s size.
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
