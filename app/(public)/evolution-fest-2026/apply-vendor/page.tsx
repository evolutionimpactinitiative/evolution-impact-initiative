import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, MapPin, AlertCircle } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { VendorApplyForm } from "@/components/festival/VendorApplyForm";
import {
  FESTIVAL,
  FESTIVAL_SLUG,
  VENDOR_CATEGORIES,
  VENDOR_TOTAL_CAP,
  type VendorCategoryKey,
} from "@/lib/festival";
import { festivalMetadata } from "@/lib/festival/meta";

export const metadata: Metadata = festivalMetadata({
  title: "Apply as a vendor · Evolution Fest 2026",
  description:
    "Apply to trade at Evolution Fest 2026 — a free family festival on Saturday 25 July 2026 in Medway. Food, drinks, sweet treats, retail, and community organisations welcome.",
});

// Live capacity per category — never cache
export const revalidate = 0;

interface VendorCountRow {
  category: string;
  active_total: number;
}

export default async function ApplyVendorPage() {
  const supabase = createAdminClient();

  // Load the festival event id (gracefully handle missing)
  const { data: eventRow } = await supabase
    .from("events")
    .select("id")
    .eq("slug", FESTIVAL_SLUG)
    .maybeSingle();
  const eventId = (eventRow as { id: string } | null)?.id ?? null;

  // Load category capacity counts
  const capacity: Record<VendorCategoryKey, number> = {
    food: 0,
    drinks: 0,
    sweet_treats: 0,
    retail: 0,
    community_org: 0,
  };
  if (eventId) {
    const { data: rows } = await supabase.rpc("get_festival_vendor_counts", {
      p_event_id: eventId,
    });
    for (const r of (rows as VendorCountRow[] | null) ?? []) {
      if (r.category in capacity) {
        capacity[r.category as VendorCategoryKey] = r.active_total;
      }
    }
  }
  for (const c of VENDOR_CATEGORIES) {
    capacity[c.key] += c.manualTaken ?? 0;
  }

  // Deadline gate
  const now = new Date();
  const deadline = new Date(`${FESTIVAL.applicationDeadline}T23:59:59`);
  const isClosed = now > deadline;
  const allFull = VENDOR_CATEGORIES.every(
    (c) => capacity[c.key] >= c.cap,
  );

  return (
    <>
      {/* Hero */}
      <section className="relative bg-brand-dark text-white pt-32 pb-16 md:pt-40 md:pb-20 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-brand-accent rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-brand-blue rounded-full opacity-20 blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <p className="font-heading text-xs uppercase tracking-widest text-brand-accent mb-4">
              Vendor application
            </p>
            <h1 className="font-heading font-black text-4xl md:text-6xl leading-none mb-6">
              Trade at the Fest.
            </h1>
            <p className="text-lg text-white/75 max-w-2xl leading-relaxed mb-6">
              A simple, fair contribution to take part — and every penny supports
              the Back to School campaign. Maximum {VENDOR_TOTAL_CAP} vendors
              total.
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
            <div className="mt-6">
              <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1.5 rounded-full text-sm">
                <span className="text-brand-accent font-heading font-bold">
                  Deadline:
                </span>
                <span>{FESTIVAL.applicationDeadlineLabel}</span>
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
          ) : allFull ? (
            <FullState />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8">
                <SectionLabel
                  text="Application form"
                  color="brand-blue"
                  className="mb-5"
                />
                <h2 className="font-heading font-black text-2xl md:text-3xl text-brand-dark mb-2">
                  Choose your category & tell us about your business
                </h2>
                <p className="text-brand-dark/70 mb-8">
                  Paid categories complete checkout straight after submission.
                  Community organisations skip checkout and we&rsquo;ll be in
                  touch within 5 working days.
                </p>

                <VendorApplyForm capacity={capacity} />
              </div>

              <aside className="lg:col-span-4 space-y-4">
                <Sidebar capacity={capacity} />
              </aside>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function Sidebar({ capacity }: { capacity: Record<VendorCategoryKey, number> }) {
  return (
    <>
      <div className="bg-white rounded-2xl p-6 border border-brand-blue/10">
        <p className="font-heading text-xs uppercase tracking-widest text-brand-blue mb-3">
          Live availability
        </p>
        <ul className="space-y-2.5">
          {VENDOR_CATEGORIES.map((cat) => {
            const taken = capacity[cat.key];
            const remaining = Math.max(0, cat.cap - taken);
            const full = remaining === 0;
            return (
              <li
                key={cat.key}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="text-brand-dark">{cat.label}</span>
                <span
                  className={`font-heading font-bold text-xs uppercase tracking-widest ${
                    full ? "text-brand-dark/40" : "text-brand-green"
                  }`}
                >
                  {full ? "Full" : `${remaining}/${cat.cap}`}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="bg-brand-dark text-white rounded-2xl p-6">
        <p className="font-heading text-xs uppercase tracking-widest text-brand-accent mb-3">
          Documents
        </p>
        <p className="text-sm text-white/80 leading-relaxed mb-3">
          You don&rsquo;t need to upload anything now. Once we approve you,
          we&rsquo;ll email a short checklist and you can send PDFs back.
        </p>
        <ul className="text-xs text-white/60 space-y-1.5 leading-relaxed">
          <li>· Public Liability Insurance</li>
          <li>· Food Hygiene Rating (food vendors)</li>
          <li>· Food Hygiene Certificate (food vendors)</li>
          <li>· Risk Assessment</li>
        </ul>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-brand-blue/10">
        <p className="font-heading text-xs uppercase tracking-widest text-brand-blue mb-3">
          Need help?
        </p>
        <p className="text-sm text-brand-dark/70 leading-relaxed">
          Not sure what applies to you?{" "}
          <Link href="/contact" className="text-brand-blue underline">
            Get in touch
          </Link>{" "}
          and we&rsquo;ll happily talk it through.
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
        Applications closed
      </h2>
      <p className="text-brand-dark/70 mb-6">
        Vendor applications for {FESTIVAL.title} closed on{" "}
        {FESTIVAL.applicationDeadlineLabel}. We&rsquo;d love to hear from you
        for next year — let us know via the contact form.
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
        Applications opening soon
      </h2>
      <p className="text-brand-dark/70 mb-6">
        The festival isn&rsquo;t live in our system yet. Check back shortly or
        contact us if you want to get on a priority list.
      </p>
      <Button asChild>
        <Link href={`/${FESTIVAL_SLUG}`}>Back to festival hub</Link>
      </Button>
    </div>
  );
}

function FullState() {
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl p-10 text-center border border-brand-blue/10">
      <h2 className="font-heading font-black text-2xl text-brand-dark mb-3">
        All vendor spaces taken
      </h2>
      <p className="text-brand-dark/70 mb-6">
        Every category is at capacity. If you&rsquo;d like to be added to a
        waiting list in case of cancellations, get in touch.
      </p>
      <Button asChild>
        <Link href="/contact">Join the waitlist</Link>
      </Button>
    </div>
  );
}
