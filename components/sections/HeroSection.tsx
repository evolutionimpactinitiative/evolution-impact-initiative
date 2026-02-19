import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatCounter } from "@/components/shared/StatCounter";
import { stats } from "@/lib/constants";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center bg-white overflow-hidden">
      {/* Decorative blur orbs */}
      <div className="absolute top-20 left-10 w-24 h-24 md:w-48 md:h-48 bg-brand-pale rounded-full opacity-60 blur-3xl" />
      <div className="absolute bottom-20 right-10 w-32 h-32 md:w-64 md:h-64 bg-brand-accent rounded-full opacity-30 blur-3xl" />

      <div className="container mx-auto px-4 pt-32 pb-16 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center border border-brand-blue text-brand-blue px-4 py-2 rounded-full text-sm font-heading font-semibold mb-8">
            Est. 2025 · Medway, UK
          </div>

          {/* Main heading */}
          <h1 className="font-heading font-black text-5xl md:text-7xl lg:text-8xl xl:text-9xl leading-none mb-8">
            <span className="text-brand-dark block">SMALL ACTS.</span>
            <span className="text-brand-blue block">BIG IMPACT.</span>
            <span className="text-stroke block">REAL CHANGE.</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-brand-dark/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            We are a community-led organisation creating safe, inspiring and empowering spaces for young people, families and individuals across Medway.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button asChild size="lg">
              <Link href="/get-involved">Get Involved</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/donate">Donate Today</Link>
            </Button>
          </div>

          {/* Stats bar */}
          <div className="border-t border-brand-dark/10 pt-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {stats.map((stat) => (
                <StatCounter key={stat.label} value={stat.value} label={stat.label} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
