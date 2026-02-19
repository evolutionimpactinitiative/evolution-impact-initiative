import { SectionLabel } from "@/components/shared/SectionLabel";
import { PolaroidCard } from "@/components/shared/PolaroidCard";
import { TestimonialCard } from "@/components/shared/TestimonialCard";
import { impactStats, testimonials } from "@/lib/constants";

export function ImpactSection() {
  return (
    <section className="bg-brand-dark py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left: Impact stats */}
          <div>
            <SectionLabel text="Our Impact" color="brand-accent" className="mb-6" />
            <h2 className="font-heading font-black text-3xl md:text-4xl lg:text-5xl text-white mb-6">
              The Difference We&apos;re Making
            </h2>
            <p className="text-white/70 leading-relaxed mb-8">
              We measure our impact not just in numbers, but in confidence, connection and growth.
            </p>

            <div className="glass-card p-6 md:p-8">
              <ul className="space-y-4">
                {impactStats.map((stat) => (
                  <li key={stat.label} className="flex items-center justify-between">
                    <span className="text-white/80">{stat.label}</span>
                    <span className="font-heading font-bold text-brand-accent text-xl">
                      {stat.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: Testimonials */}
          <div>
            <PolaroidCard rotation="rotate-1" tapeStyle="top" className="bg-brand-pale">
              <div className="p-4 md:p-6">
                <h3 className="font-heading font-bold text-xl uppercase text-brand-dark mb-6">
                  Community Voices
                </h3>
                <div className="space-y-6">
                  {testimonials.map((testimonial) => (
                    <TestimonialCard
                      key={testimonial.id}
                      quote={testimonial.quote}
                      author={testimonial.author}
                      borderColor={testimonial.borderColor as "brand-blue" | "brand-green" | "brand-dark"}
                    />
                  ))}
                </div>
              </div>
            </PolaroidCard>
          </div>
        </div>
      </div>
    </section>
  );
}
