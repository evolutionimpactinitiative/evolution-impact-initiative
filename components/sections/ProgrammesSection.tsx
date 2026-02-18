import Image from "next/image";
import Link from "next/link";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { PolaroidCard } from "@/components/shared/PolaroidCard";
import { programmes } from "@/lib/constants";

const rotations: Array<"rotate-1" | "-rotate-1"> = ["rotate-1", "-rotate-1", "rotate-1", "-rotate-1"];

export function ProgrammesSection() {
  return (
    <section className="bg-white py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <SectionLabel text="What We Do" color="brand-green" className="mb-6 mx-auto" />
          <h2 className="font-heading font-black text-3xl md:text-4xl lg:text-5xl text-brand-dark">
            Our Programmes
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {programmes.map((programme, index) => (
            <PolaroidCard
              key={programme.id}
              rotation={rotations[index]}
              borderColor={programme.borderColor as "brand-blue" | "brand-green" | "brand-dark" | "brand-accent"}
            >
              <div className="relative h-48 overflow-hidden group">
                <Image
                  src={programme.image}
                  alt={programme.title}
                  fill
                  className="object-cover cinematic-filter transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="mt-4 flex-grow">
                <h3
                  className={`font-heading font-bold text-lg uppercase mb-2 text-${programme.headingColor}`}
                >
                  {programme.title}
                </h3>
                <p className="text-brand-dark/70 text-sm leading-relaxed">
                  {programme.description}
                </p>
              </div>
            </PolaroidCard>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/our-work"
            className="inline-flex items-center text-brand-green font-heading font-semibold hover:text-brand-blue transition-colors"
          >
            Explore Our Full Programme →
          </Link>
        </div>
      </div>
    </section>
  );
}
