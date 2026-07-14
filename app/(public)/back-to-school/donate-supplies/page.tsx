import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, MapPin, ArrowLeft, Truck } from "lucide-react";
import { B2S } from "@/lib/back-to-school";
import { backToSchoolMetadata } from "@/lib/back-to-school/meta";
import { SupplyPledgeForm } from "@/components/back-to-school/SupplyPledgeForm";
import { SectionLabel } from "@/components/shared/SectionLabel";

export const metadata: Metadata = backToSchoolMetadata({
  title: "Pledge supplies | Back to School Drive 2026",
  description: `Got brand new uniforms, stationery or school bags? Pledge them for children across Medway. Drop off or free collection across Medway & surrounding areas. Distribution ${B2S.dateLabel} at ${B2S.venueName}, ${B2S.venueArea}.`,
});

export default function BackToSchoolPledgePage() {
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
            <SectionLabel
              text="Pledge supplies"
              color="brand-accent"
              className="mb-4"
            />
            <h1 className="font-heading font-black text-4xl md:text-5xl lg:text-6xl leading-none mb-6">
              Got brand new kit
              <br />you&rsquo;d like to share?
            </h1>
            <p className="text-lg text-white/75 max-w-2xl leading-relaxed mb-6">
              Tell us what you&rsquo;ve got and how to get it to us. We&rsquo;ll
              come and collect from anywhere in Medway and the surrounding areas
              , or you can drop off. Everything goes directly to a family on the
              day.
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/70">
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4 text-brand-accent" />
                {B2S.dateLabel}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-accent" />
                {B2S.venueName}, {B2S.venueArea}
              </span>
              <span className="inline-flex items-center gap-2">
                <Truck className="h-4 w-4 text-brand-accent" />
                Free collection · Medway &amp; surrounding
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FORM */}
      <section className="bg-brand-pale/30 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <SupplyPledgeForm />
          </div>
        </div>
      </section>
    </>
  );
}
