import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, MapPin, Clock, AlertTriangle, ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { B2S, B2S_SLUG } from "@/lib/back-to-school";
import { backToSchoolMetadata } from "@/lib/back-to-school/meta";
import { RegisterForm } from "@/components/back-to-school/RegisterForm";
import { SectionLabel } from "@/components/shared/SectionLabel";

export const metadata: Metadata = backToSchoolMetadata({
  title: "Register your children | Back to School Drive 2026",
  description: `Register up to ${B2S.maxChildrenPerRegistration} children (${B2S.minChildAge}–${B2S.maxChildAge}) for free uniforms, stationery and school bags. Distribution ${B2S.dateLabel}, ${B2S.timeLabel} at ${B2S.venueName}, ${B2S.venueArea}. First come, first served. Registration doesn't guarantee supplies.`,
});

// Live capacity + deadline check on every request.
export const revalidate = 0;

export default async function BackToSchoolRegisterPage() {
  const supabase = createAdminClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, total_slots")
    .eq("slug", B2S_SLUG)
    .maybeSingle();

  let registeredCount = 0;
  if (event) {
    const { count } = await supabase
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", (event as { id: string }).id)
      .in("status", ["pending", "approved", "confirmed"]);
    registeredCount = count ?? 0;
  }

  const totalSlots =
    (event as { total_slots?: number } | null)?.total_slots ?? B2S.totalSlots;
  const isFull = event ? registeredCount >= totalSlots : false;
  const deadline = new Date(B2S.registrationDeadline);
  const isPastDeadline = new Date() > deadline;
  const isClosed = !event || isFull || isPastDeadline;

  return (
    <>
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-brand-blue via-brand-blue to-brand-dark text-white pt-32 pb-16 md:pt-40 md:pb-20 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-brand-accent rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-white rounded-full opacity-10 blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <Link
              href="/back-to-school"
              className="flex w-fit items-center gap-1.5 text-sm text-white/70 hover:text-brand-accent transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to the campaign
            </Link>
            <SectionLabel text="Register your children" color="brand-accent" className="mb-4" />
            <h1 className="font-heading font-black text-4xl md:text-5xl lg:text-6xl leading-none mb-6">
              Free school uniforms
              <br />& supplies for {B2S.goalChildren} children.
            </h1>
            <p className="text-lg text-white/75 max-w-2xl leading-relaxed mb-6">
              Register up to {B2S.maxChildrenPerRegistration} children (ages{" "}
              {B2S.minChildAge}–{B2S.maxChildAge}). We&rsquo;ll email you an
              approval with a QR code on{" "}
              <span className="text-brand-accent font-semibold">
                {B2S.approvalEmailLabel}
              </span>{" "}
              (bring it on the day).
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/70">
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4 text-brand-accent" />
                {B2S.dateLabel}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4 text-brand-accent" />
                {B2S.timeLabel}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-accent" />
                {B2S.venueName}, {B2S.venueArea}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FORM or CLOSED STATE */}
      <section className="bg-brand-pale/30 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {isClosed ? (
              <ClosedState
                reason={
                  !event
                    ? "not-configured"
                    : isPastDeadline
                      ? "past-deadline"
                      : "full"
                }
                registeredCount={registeredCount}
                totalSlots={totalSlots}
              />
            ) : (
              <>
                <CapacityStrip
                  registeredCount={registeredCount}
                  totalSlots={totalSlots}
                />
                <RegisterForm />
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function CapacityStrip({
  registeredCount,
  totalSlots,
}: {
  registeredCount: number;
  totalSlots: number;
}) {
  const pct = totalSlots > 0 ? (registeredCount / totalSlots) * 100 : 0;
  const remaining = Math.max(0, totalSlots - registeredCount);
  return (
    <div className="bg-white rounded-2xl p-4 md:p-5 border border-brand-blue/10 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <p className="text-sm font-heading font-bold text-brand-dark">
          {registeredCount} / {totalSlots} families registered
        </p>
        <p className="text-xs text-brand-dark/60 uppercase tracking-widest">
          {remaining} spots left
        </p>
      </div>
      <div className="h-2 rounded-full bg-brand-blue/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-brand-green"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

function ClosedState({
  reason,
  registeredCount,
  totalSlots,
}: {
  reason: "not-configured" | "past-deadline" | "full";
  registeredCount: number;
  totalSlots: number;
}) {
  const copy = {
    "not-configured": {
      title: "Registration isn't open yet",
      body: "The drive event hasn't been set up in the system. Please check back shortly.",
    },
    "past-deadline": {
      title: "Registration has closed",
      body: `Registration closed on ${B2S.registrationDeadlineLabel}. Approval emails go out today, so check your inbox if you registered, or come and see us on ${B2S.dateLabel} anyway (${B2S.venueName}, ${B2S.venueArea}).`,
    },
    full: {
      title: "We're at capacity",
      body: `All ${totalSlots} spots are taken (${registeredCount} families registered). If you'd still like to help, please come and see us on ${B2S.dateLabel}. If there are supplies left after everyone approved has collected, you're welcome.`,
    },
  }[reason];

  return (
    <div className="bg-white rounded-2xl p-8 md:p-10 border-2 border-brand-blue/25 text-center">
      <AlertTriangle className="h-10 w-10 text-brand-blue mx-auto mb-4" />
      <h2 className="font-heading font-black text-2xl md:text-3xl text-brand-dark mb-3">
        {copy.title}
      </h2>
      <p className="text-brand-dark/70 max-w-lg mx-auto mb-6">{copy.body}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/back-to-school"
          className="inline-flex items-center justify-center gap-2 font-heading font-bold text-sm uppercase tracking-widest px-5 py-3 rounded-md bg-brand-dark text-white hover:bg-brand-blue transition-colors"
        >
          Back to the campaign
        </Link>
        <Link
          href="/back-to-school/donate-supplies"
          className="inline-flex items-center justify-center gap-2 font-heading font-bold text-sm uppercase tracking-widest px-5 py-3 rounded-md bg-brand-green text-white hover:bg-brand-blue transition-colors"
        >
          Pledge supplies instead
        </Link>
      </div>
    </div>
  );
}
