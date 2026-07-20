import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, MapPin, AlertCircle } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { VolunteerApplyForm } from "@/components/festival/VolunteerApplyForm";
import { FESTIVAL, FESTIVAL_SLUG } from "@/lib/festival";
import { festivalMetadata } from "@/lib/festival/meta";

export const metadata: Metadata = festivalMetadata({
  title: "Volunteer at Evolution Fest 2026",
  description:
    "Volunteer at Evolution Fest 2026 — Saturday 25 July 2026, Strood Youth Centre. Setup, AM, PM and packdown shifts available. T-shirt and refreshments provided.",
});

// Reflects live event status — never cache
export const revalidate = 0;

export default async function VolunteerPage() {
  const supabase = createAdminClient();

  const { data: eventRow } = await supabase
    .from("events")
    .select("id")
    .eq("slug", FESTIVAL_SLUG)
    .maybeSingle();
  const eventId = (eventRow as { id: string } | null)?.id ?? null;

  const now = new Date();
  const deadline = new Date(`${FESTIVAL.volunteerDeadline}T23:59:59`);
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
              Volunteer
            </p>
            <h1 className="font-heading font-black text-4xl md:text-6xl leading-none mb-6">
              Join the team.
            </h1>
            <p className="text-lg text-white/75 max-w-2xl leading-relaxed mb-6">
              We&rsquo;re building the team that makes the day work. Setup,
              kids&rsquo; zone, check-in, packdown — tell us what you can do
              and we&rsquo;ll match you to a role.
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
                  text="Volunteer form"
                  color="brand-green"
                  className="mb-5"
                />
                <h2 className="font-heading font-black text-2xl md:text-3xl text-brand-dark mb-2">
                  Tell us about yourself
                </h2>
                <p className="text-brand-dark/70 mb-8">
                  Takes about 3 minutes. We&rsquo;ll come back to you within 5
                  working days with a role and a shift.
                </p>

                <VolunteerApplyForm />
              </div>

              <aside className="lg:col-span-4 space-y-4">
                <Sidebar />
              </aside>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function Sidebar() {
  return (
    <>
      <div className="bg-white rounded-2xl p-6 border border-brand-blue/10">
        <p className="font-heading text-xs uppercase tracking-widest text-brand-blue mb-3">
          What you get
        </p>
        <ul className="space-y-2.5 text-sm text-brand-dark/85">
          <li>Free Evolution Impact T-shirt</li>
          <li>Refreshments throughout the day</li>
          <li>A reference from a registered CIC</li>
          <li>Real impact on local children & families</li>
        </ul>
      </div>

      <div className="bg-brand-dark text-white rounded-2xl p-6">
        <p className="font-heading text-xs uppercase tracking-widest text-brand-accent mb-3">
          Shifts available
        </p>
        <ul className="space-y-2 text-sm text-white/85">
          <li>
            <strong className="text-white">Setup</strong> 10am — 12pm
          </li>
          <li>
            <strong className="text-white">Festival AM</strong> 12pm — 3pm
          </li>
          <li>
            <strong className="text-white">Festival PM</strong> 3pm — 6pm
          </li>
          <li>
            <strong className="text-white">Packdown</strong> from 6pm
          </li>
        </ul>
        <p className="text-xs text-white/60 mt-4">
          Tick whichever you can do. We&rsquo;ll match you to the right role.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-brand-blue/10">
        <p className="font-heading text-xs uppercase tracking-widest text-brand-blue mb-3">
          Questions?
        </p>
        <p className="text-sm text-brand-dark/70 leading-relaxed">
          Email{" "}
          <a
            href="mailto:hello@evolutionimpactinitiative.co.uk"
            className="text-brand-blue underline"
          >
            hello@evolutionimpactinitiative.co.uk
          </a>{" "}
          and we&rsquo;ll get back to you.
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
        Volunteer applications closed
      </h2>
      <p className="text-brand-dark/70 mb-6">
        Applications for {FESTIVAL.title} closed on{" "}
        {FESTIVAL.volunteerDeadlineLabel}. We&rsquo;d love to hear from you
        for next year.
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
        Volunteer signups opening soon
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
