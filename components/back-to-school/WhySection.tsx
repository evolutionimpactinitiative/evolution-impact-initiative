import Link from "next/link";
import { ArrowRight, Banknote, Heart, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/shared/SectionLabel";

/**
 * Emotional context for the Back to School Drive. Sits between the live stats
 * band and the "Three ways to help" action cards.
 *
 * Copy tone: dignified, community-first (not pity/charity framing). UK cost
 * stats are rounded from The Children's Society "Cost of school uniform"
 * research (£287 primary / £422 secondary, 2023). Swap in Medway-specific
 * numbers here if we get them from a local audit.
 */
export function WhySection() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start mb-10 md:mb-14">
          {/* LEFT: the story */}
          <div>
            <SectionLabel
              text="Why we do this"
              color="brand-blue"
              className="mb-6"
            />
            <h2 className="font-heading font-black text-3xl md:text-4xl lg:text-5xl text-brand-dark mb-6 leading-tight">
              Every child deserves to walk in on day one{" "}
              <span className="text-brand-green">feeling ready.</span>
            </h2>
            <div className="space-y-4 text-brand-dark/85 leading-relaxed text-base md:text-lg">
              <p>
                For too many families in Medway, September isn&rsquo;t a fresh
                start. It&rsquo;s a bill they can&rsquo;t afford. The average
                UK family now spends{" "}
                <strong>close to £300 on primary school uniform alone</strong>
                . Add PE kit, stationery, a bag that&rsquo;ll last the year,
                and it lands the same week half the country is still catching
                up on summer&rsquo;s energy bills.
              </p>
              <p className="font-heading font-bold text-brand-dark text-xl md:text-2xl">
                Something has to give. And it&rsquo;s usually the child.
              </p>
              <p>
                Kids notice everything. The too-small blazer. The scuffed
                shoes. The bag that won&rsquo;t zip. It shows up in the
                classroom as embarrassment, absence, and lost focus. Kids who
                walk in properly kitted out show up with their heads high.
                They engage more, miss less, and don&rsquo;t spend their day
                worrying about how they look.
              </p>
              <p>
                <strong>That&rsquo;s what this drive is for.</strong> One less
                thing on a parent&rsquo;s plate. One more child ready on Monday
                morning. Not charity. Just Medway looking after Medway.
              </p>
            </div>
          </div>

          {/* RIGHT: three beat cards */}
          <div className="space-y-3">
            <BeatCard
              icon={Banknote}
              eyebrow="The cost"
              headline="~£300 per child"
              body="What the average UK family now spends kitting a primary child out, before backpacks, PE and stationery. Secondary is over £420."
            />
            <BeatCard
              icon={Heart}
              eyebrow="The impact"
              headline="Confidence, attendance, focus"
              body="Children who start school properly kitted out engage more, miss less, and don't spend their day worrying about how they look."
            />
            <BeatCard
              icon={Handshake}
              eyebrow="The response"
              headline="Neighbours, not charity"
              body="This drive is Medway looking after Medway, one uniform, one backpack, one Monday morning at a time."
            />
          </div>
        </div>

        {/* Dual CTA bar */}
        <div className="bg-brand-pale/50 rounded-2xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-6 items-center border border-brand-blue/10">
          <div>
            <p className="font-heading text-xs uppercase tracking-widest text-brand-blue mb-2">
              Two ways to change a September
            </p>
            <p className="font-heading text-lg md:text-xl lg:text-2xl text-brand-dark leading-snug">
              Register a child. Donate £20. Either way, someone starts school
              ready.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 md:justify-end">
            <Button
              asChild
              size="lg"
              className="bg-brand-blue text-white hover:bg-brand-dark"
            >
              <Link href="/back-to-school/register">
                Register a family
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="bg-brand-green text-white hover:bg-brand-dark"
            >
              <Link href="#donate-money">
                Donate £20
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function BeatCard({
  icon: Icon,
  eyebrow,
  headline,
  body,
}: {
  icon: typeof Banknote;
  eyebrow: string;
  headline: string;
  body: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 md:p-6 border-2 border-brand-blue/10 flex gap-4">
      <div className="shrink-0 h-12 w-12 rounded-xl bg-brand-blue/10 flex items-center justify-center">
        <Icon className="h-5 w-5 text-brand-blue" />
      </div>
      <div className="min-w-0">
        <p className="font-heading text-[10px] uppercase tracking-widest text-brand-blue mb-1 font-bold">
          {eyebrow}
        </p>
        <p className="font-heading font-semibold text-lg md:text-xl text-brand-dark mb-1 leading-tight">
          {headline}
        </p>
        <p className="text-sm text-brand-dark/70 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}
