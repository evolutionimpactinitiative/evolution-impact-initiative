import Image from "next/image";
import Link from "next/link";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { HighlightText } from "@/components/shared/HighlightText";
import { PolaroidCard } from "@/components/shared/PolaroidCard";

export function AboutSection() {
  return (
    <section className="bg-brand-pale/30 py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Image collage */}
          <div className="relative">
            <div className="relative flex justify-center">
              {/* First polaroid */}
              <PolaroidCard rotation="rotate-2" tapeStyle="top" className="w-64 md:w-80 -mr-8 z-10">
                <div className="relative h-48 md:h-64 overflow-hidden">
                  <Image
                    src="/about-community.png"
                    alt="Community members working together"
                    fill
                    className="object-cover cinematic-filter"
                  />
                </div>
              </PolaroidCard>

              {/* Second polaroid */}
              <PolaroidCard rotation="-rotate-2" tapeStyle="corner" className="w-64 md:w-80 mt-8 z-0">
                <div className="relative h-48 md:h-64 overflow-hidden">
                  <Image
                    src="/rooted-medway.png"
                    alt="Family enjoying community event"
                    fill
                    className="object-cover cinematic-filter"
                  />
                </div>
                <p className="text-center mt-4 font-heading text-sm text-brand-dark/70">
                  Rooted in Medway
                </p>
              </PolaroidCard>
            </div>
          </div>

          {/* Right: Content */}
          <div>
            <SectionLabel text="About Us" color="brand-blue" className="mb-6" />

            <h2 className="font-heading font-black text-3xl md:text-4xl lg:text-5xl text-brand-dark mb-6 leading-tight">
              We believe real change starts with{" "}
              <HighlightText>showing up.</HighlightText>
            </h2>

            <div className="space-y-4 text-brand-dark/70 leading-relaxed mb-8">
              <p>
                We create inclusive spaces where young people feel seen, families feel supported and communities feel connected. From creative arts workshops and youth sport programmes to food support drives and seasonal community events.
              </p>
              <p>
                We&apos;re not just running events. We&apos;re building relationships. We&apos;re listening to our community. And we&apos;re designing programmes around real needs, not assumptions.
              </p>
            </div>

            <p className="font-heading font-bold text-brand-blue text-lg mb-8">
              Based in Rochester, rooted in Medway, and growing outward.
            </p>

            <Link
              href="/about"
              className="inline-flex items-center text-brand-blue font-heading font-semibold hover:text-brand-green transition-colors"
            >
              Learn More About Us →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
