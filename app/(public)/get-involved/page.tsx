import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PageHero } from "@/components/shared/PageHero";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { Button } from "@/components/ui/button";
import { PolaroidCard } from "@/components/shared/PolaroidCard";
import { Users, Building2, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Volunteer & Partner | Evolution Impact Initiative",
  description:
    "Join as a volunteer or partner. Support communities through sport, creativity and outreach.",
};

const volunteerOpportunities = [
  "Event Support",
  "Youth Mentoring",
  "Creative Workshop Assistance",
  "Sport Session Support",
  "Admin & Coordination",
  "Fundraising & Outreach",
];

const whatWeProvide = [
  "Full induction and training",
  "DBS check (funded by us)",
  "Ongoing support and supervision",
  "References for future opportunities",
  "Meaningful, rewarding experience",
];

const partnerTypes = [
  "Local businesses",
  "Schools & education providers",
  "Community organisations",
  "Local authorities & commissioners",
  "Funders & grant-makers",
];

const keyNetworks = [
  "Medway Voluntary Action (MVA)",
  "Creative Medway",
  "Kent & Medway Violence Reduction Unit",
  "Medway Council Youth Services",
  "Active Kent & Medway",
];

export default function GetInvolvedPage() {
  return (
    <>
      <PageHero
        title="Your Time. Your Skills. Real Impact."
        subtitle="There are many ways to support what we do, and none of them require a cape."
      />

      {/* Volunteer With Us */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <Users className="h-8 w-8 text-brand-blue" />
                <SectionLabel text="Volunteer" color="brand-blue" />
              </div>
              <h2 className="font-heading font-black text-3xl md:text-4xl text-brand-dark mb-6">
                Volunteer With Us
              </h2>
              <p className="text-brand-dark/70 leading-relaxed mb-8">
                Whether you have an hour a week or a day a month, your time matters. Our volunteers are at the heart of everything we do: supporting events, mentoring young people, and helping deliver programmes that change lives.
              </p>

              <div className="mb-8">
                <h3 className="font-heading font-bold text-lg text-brand-dark mb-4">
                  Opportunities Include:
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {volunteerOpportunities.map((opportunity) => (
                    <div
                      key={opportunity}
                      className="flex items-center gap-2 text-brand-dark/70"
                    >
                      <CheckCircle className="h-4 w-4 text-brand-green flex-shrink-0" />
                      <span className="text-sm">{opportunity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <h3 className="font-heading font-bold text-lg text-brand-dark mb-4">
                  What We Provide:
                </h3>
                <div className="space-y-2">
                  {whatWeProvide.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 text-brand-dark/70"
                    >
                      <CheckCircle className="h-4 w-4 text-brand-blue flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button asChild size="lg">
                <Link href="/contact">Apply to Volunteer</Link>
              </Button>
            </div>

            <div className="flex justify-center">
              <PolaroidCard rotation="rotate-2" tapeStyle="top" className="w-full max-w-md">
                <div className="relative h-80 overflow-hidden">
                  <Image
                    src="/volunteer-team.png"
                    alt="Volunteers working together"
                    fill
                    className="object-cover cinematic-filter"
                  />
                </div>
                <p className="text-center mt-4 font-heading text-sm text-brand-dark/70">
                  Our amazing volunteer team
                </p>
              </PolaroidCard>
            </div>
          </div>
        </div>
      </section>

      {/* Partner With Us */}
      <section id="partner" className="bg-brand-pale/30 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 flex justify-center">
              <PolaroidCard rotation="-rotate-2" tapeStyle="corner" className="w-full max-w-md">
                <div className="relative h-80 overflow-hidden">
                  <Image
                    src="/volunteer-team.png"
                    alt="Community partnership"
                    fill
                    className="object-cover cinematic-filter"
                  />
                </div>
                <p className="text-center mt-4 font-heading text-sm text-brand-dark/70">
                  Stronger together
                </p>
              </PolaroidCard>
            </div>

            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-4 mb-6">
                <Building2 className="h-8 w-8 text-brand-green" />
                <SectionLabel text="Partnership" color="brand-green" />
              </div>
              <h2 className="font-heading font-black text-3xl md:text-4xl text-brand-dark mb-6">
                Partner With Us
              </h2>
              <p className="text-brand-dark/70 leading-relaxed mb-8">
                We believe in the power of collaboration. Local businesses, schools, and community organisations: we&apos;d love to work alongside you to create even greater impact.
              </p>

              <div className="mb-8">
                <h3 className="font-heading font-bold text-lg text-brand-dark mb-4">
                  We Partner With:
                </h3>
                <div className="space-y-2">
                  {partnerTypes.map((type) => (
                    <div
                      key={type}
                      className="flex items-center gap-2 text-brand-dark/70"
                    >
                      <CheckCircle className="h-4 w-4 text-brand-green flex-shrink-0" />
                      <span>{type}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-8 bg-white p-6 rounded-lg">
                <h3 className="font-heading font-bold text-lg text-brand-dark mb-4">
                  Key Local Networks:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {keyNetworks.map((network) => (
                    <span
                      key={network}
                      className="bg-brand-pale text-brand-dark text-sm px-3 py-1 rounded-full"
                    >
                      {network}
                    </span>
                  ))}
                </div>
              </div>

              <Button asChild size="lg" variant="secondary">
                <Link href="/contact">Enquire About Partnership</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-dark py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading font-black text-2xl md:text-3xl text-white mb-4">
            Not Sure Where to Start?
          </h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto">
            Get in touch and let&apos;s have a conversation about how you can be part of the Evolution.
          </p>
          <Button asChild size="lg" className="bg-brand-accent text-brand-dark hover:bg-brand-green hover:text-white">
            <Link href="/contact">Contact Us</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
