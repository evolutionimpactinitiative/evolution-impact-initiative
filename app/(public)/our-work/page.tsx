import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/shared/PageHero";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { pillars } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Our Programmes | Creative, Sport, Outreach & Events · Evolution Impact",
  description:
    "Creative workshops, youth boxing, community support and family events in Medway.",
};

const pillarColors = {
  "brand-blue": {
    border: "border-brand-blue",
    bg: "bg-brand-blue",
    text: "text-brand-blue",
  },
  "brand-green": {
    border: "border-brand-green",
    bg: "bg-brand-green",
    text: "text-brand-green",
  },
  "brand-dark": {
    border: "border-brand-dark",
    bg: "bg-brand-dark",
    text: "text-brand-dark",
  },
  "brand-accent": {
    border: "border-brand-accent",
    bg: "bg-brand-accent",
    text: "text-brand-dark",
  },
};

export default function OurWorkPage() {
  return (
    <>
      <PageHero
        title="Our Programmes & Initiatives"
        subtitle="We deliver structured programmes across four core pillars, each one designed with our community, measured for impact and delivered with care."
      />

      {/* Pillars */}
      {pillars.map((pillar, index) => {
        const colors = pillarColors[pillar.color as keyof typeof pillarColors];
        const isEven = index % 2 === 0;

        return (
          <section
            key={pillar.id}
            className={isEven ? "bg-white py-16 md:py-24" : "bg-brand-pale/30 py-16 md:py-24"}
          >
            <div className="container mx-auto px-4">
              <div
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                  isEven ? "" : "lg:flex-row-reverse"
                }`}
              >
                {/* Image */}
                <div className={isEven ? "order-1 lg:order-1" : "order-1 lg:order-2"}>
                  <div className="relative h-80 md:h-96 rounded-lg overflow-hidden shadow-xl">
                    <Image
                      src={pillar.image}
                      alt={pillar.title}
                      fill
                      className="object-cover cinematic-filter"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className={isEven ? "order-2 lg:order-2" : "order-2 lg:order-1"}>
                  <SectionLabel
                    text={`Pillar ${index + 1}`}
                    color={pillar.color === "brand-accent" ? "brand-green" : pillar.color as "brand-blue" | "brand-green" | "brand-dark"}
                    className="mb-4"
                  />
                  <h2 className="font-heading font-black text-3xl md:text-4xl text-brand-dark mb-2">
                    {pillar.title}
                  </h2>
                  <p className={`font-heading font-semibold text-lg mb-4 ${colors.text}`}>
                    {pillar.tagline}
                  </p>
                  <p className="text-brand-dark/70 leading-relaxed mb-6">
                    {pillar.description}
                  </p>

                  {/* Programmes */}
                  <div className="mb-6">
                    <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-brand-dark/60 mb-3">
                      Programmes
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {pillar.programmes.map((programme) => (
                        <span
                          key={programme}
                          className={`px-3 py-1 rounded-full text-sm ${colors.bg} ${
                            pillar.color === "brand-dark" ? "text-white" : pillar.color === "brand-accent" ? "text-brand-dark" : "text-white"
                          }`}
                        >
                          {programme}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Outcomes */}
                  <div>
                    <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-brand-dark/60 mb-3">
                      Outcomes
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {pillar.outcomes.map((outcome) => (
                        <span
                          key={outcome}
                          className="px-3 py-1 rounded-full text-sm bg-brand-pale text-brand-dark"
                        >
                          {outcome}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* Programme Development & Quality */}
      <section className="bg-brand-dark py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <SectionLabel text="Our Standards" color="brand-accent" className="mb-6 mx-auto" />
            <h2 className="font-heading font-black text-3xl md:text-4xl text-white mb-12">
              Programme Development & Quality
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                "Co-designed with local families",
                "Safeguarded with DBS-checked staff",
                "Inclusive and accessible",
                "Impact-measured",
                "Continuously improved",
              ].map((item) => (
                <div key={item} className="glass-card p-6">
                  <p className="text-white font-heading font-semibold">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
