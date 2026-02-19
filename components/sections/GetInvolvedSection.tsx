import Image from "next/image";
import Link from "next/link";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { PolaroidCard } from "@/components/shared/PolaroidCard";

export function GetInvolvedSection() {
  return (
    <section className="bg-brand-pale/50 py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Content */}
          <div>
            <SectionLabel text="Join Us" color="brand-green" className="mb-6" />
            <h2 className="font-heading font-black text-3xl md:text-4xl lg:text-5xl text-brand-dark mb-6">
              Be Part of the Evolution
            </h2>
            <p className="text-brand-dark/70 leading-relaxed mb-8">
              There are many ways to support what we do, and none of them require a cape. Whether you have an hour a week or a day a month, your time matters.
            </p>

            <div className="space-y-6">
              {/* Volunteer card */}
              <div className="bg-white rounded-lg p-6 border-l-4 border-brand-blue shadow-sm">
                <h3 className="font-heading font-bold text-xl text-brand-dark mb-2">
                  Volunteer With Us
                </h3>
                <p className="text-brand-dark/70 mb-4">
                  Support events, mentor young people, help run workshops or assist behind the scenes.
                </p>
                <Link
                  href="/get-involved"
                  className="text-brand-blue font-heading font-semibold hover:text-brand-green transition-colors"
                >
                  Apply to Volunteer →
                </Link>
              </div>

              {/* Partner card */}
              <div className="bg-white rounded-lg p-6 border-l-4 border-brand-green shadow-sm">
                <h3 className="font-heading font-bold text-xl text-brand-dark mb-2">
                  Partner With Us
                </h3>
                <p className="text-brand-dark/70 mb-4">
                  Local businesses, schools, or community organisations: we&apos;d love to work alongside you.
                </p>
                <Link
                  href="/get-involved#partner"
                  className="text-brand-green font-heading font-semibold hover:text-brand-blue transition-colors"
                >
                  Enquire About Partnership →
                </Link>
              </div>
            </div>
          </div>

          {/* Right: Polaroid image */}
          <div className="flex justify-center">
            <PolaroidCard rotation="-rotate-2" tapeStyle="corner" className="w-full max-w-md">
              <div className="relative h-72 md:h-96 overflow-hidden">
                <Image
                  src="/volunteer-team.png"
                  alt="Volunteers working together"
                  fill
                  className="object-cover cinematic-filter"
                />
                <div className="absolute bottom-4 left-4 bg-brand-accent text-brand-dark px-4 py-2 rounded-full font-heading font-bold text-sm">
                  Join the Team
                </div>
              </div>
            </PolaroidCard>
          </div>
        </div>
      </div>
    </section>
  );
}
