import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock, MapPin } from "lucide-react";
import { B2S } from "@/lib/back-to-school";
import { RegisterForm } from "@/components/back-to-school/RegisterForm";
import { SectionLabel } from "@/components/shared/SectionLabel";

export const metadata: Metadata = {
  title: `Walk-in registration | ${B2S.title}`,
  robots: { index: false, follow: false },
};

// Always live — the venue QR is scanned on the day and we don't want any
// cached "invalid link" pages showing when we rotate the key.
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ k?: string; s?: string }>;
}

export default async function BackToSchoolWalkInPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const providedKey = (params.k ?? "").trim();
  const expectedKey = (process.env.B2S_WALK_IN_KEY ?? "").trim();
  const keyValid =
    expectedKey.length > 0 && providedKey === expectedKey;
  // Station 1 assisted mode: a volunteer passes their steward token so
  // the success screen can offer Print + Register-another. We don't
  // verify the token here — the print route rejects an invalid one.
  const stewardToken = (params.s ?? "").trim() || undefined;

  return (
    <>
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-brand-blue via-brand-blue to-brand-dark text-white pt-32 pb-14 md:pt-40 md:pb-16 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-brand-accent rounded-full opacity-10 blur-3xl" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <Link
              href="/back-to-school"
              className="flex w-fit items-center gap-1.5 text-sm text-white/70 hover:text-brand-accent transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to the campaign
            </Link>
            <SectionLabel
              text="Walk-in queue"
              color="brand-accent"
              className="mb-4"
            />
            <h1 className="font-heading font-black text-3xl md:text-5xl leading-none mb-5">
              Register on the day
            </h1>
            <p className="text-lg text-white/80 max-w-2xl leading-relaxed mb-4">
              We serve registered families from <strong>12pm to 3pm</strong>.
              Walk-ins are served from{" "}
              <strong className="text-brand-accent">3pm to 4pm</strong> if we
              have stock left — <em>nothing is guaranteed</em>. Register now
              and come back at 3pm.
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/70">
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4 text-brand-accent" />
                Come back at 3pm – 4pm
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-accent" />
                {B2S.venueName}, {B2S.venueArea}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FORM or INVALID */}
      <section className="bg-brand-pale/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {keyValid ? (
              <>
                {stewardToken && <AssistedModeBanner />}
                <FirstComeFirstServedBanner />
                <RegisterForm
                  walkInKey={expectedKey}
                  stewardToken={stewardToken}
                />
              </>
            ) : (
              <InvalidLink />
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function AssistedModeBanner() {
  return (
    <div className="bg-brand-dark text-white rounded-2xl p-4 mb-4">
      <p className="text-xs font-heading font-bold uppercase tracking-widest text-brand-accent mb-1">
        Station 1 · Assisted registration
      </p>
      <p className="text-sm text-white/90">
        You&rsquo;re registering on behalf of a family. When you submit, you
        can <strong>Print</strong> their ticket and <strong>Register another</strong> —
        no page reload.
      </p>
    </div>
  );
}

function FirstComeFirstServedBanner() {
  return (
    <div className="bg-white border-2 border-brand-blue/25 rounded-2xl p-5 md:p-6 mb-6">
      <p className="font-heading font-bold text-brand-dark text-lg mb-1.5">
        Before you start
      </p>
      <ul className="text-sm text-brand-dark/80 space-y-1 leading-relaxed list-disc list-inside">
        <li>
          Walk-ins are served <strong>3pm–4pm today</strong>. Come back at 3pm.
        </li>
        <li>
          Position in line is based on when you register.{" "}
          <strong>First come, first served.</strong>
        </li>
        <li>
          We only serve walk-ins if stock is left after registered families
          have collected. Nothing is guaranteed.
        </li>
        <li>
          You&rsquo;ll get a ticket on the next screen — show it (or tell us
          your name) when you come back.
        </li>
      </ul>
    </div>
  );
}

function InvalidLink() {
  return (
    <div className="bg-white rounded-2xl p-8 md:p-10 border-2 border-red-200 text-center">
      <ArrowRight className="h-8 w-8 text-red-600 mx-auto mb-3 rotate-45" />
      <h2 className="font-heading font-black text-2xl text-brand-dark mb-3">
        This link isn&rsquo;t valid
      </h2>
      <p className="text-brand-dark/70 max-w-md mx-auto mb-6">
        The walk-in registration form is only for families at the venue on the
        day. Please ask a team member at Station 1 to point you to the correct
        QR code.
      </p>
      <Link
        href="/back-to-school"
        className="inline-flex items-center justify-center gap-2 font-heading font-bold text-sm uppercase tracking-widest px-5 py-3 rounded-md bg-brand-dark text-white hover:bg-brand-blue transition-colors"
      >
        Back to the campaign
      </Link>
    </div>
  );
}
