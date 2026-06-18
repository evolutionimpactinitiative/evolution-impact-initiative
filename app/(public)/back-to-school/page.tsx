import type { Metadata } from "next";
import Link from "next/link";
import {
  Phone,
  Mail,
  Calendar,
  MapPin,
  ArrowRight,
  Package,
  Truck,
  Sparkles,
  Check,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { DonationForm } from "@/components/donations/DonationForm";
import { FestivalProgressBar } from "@/components/festival/FestivalProgressBar";
import { FESTIVAL, FIRST_YEAR_STATS } from "@/lib/festival";

export const metadata: Metadata = {
  title: "Back to School Campaign 2026 | Help 500 children in Medway",
  description:
    "Help 500 children in Medway start school with confidence. Donate money or new supplies — uniforms, shoes, stationery, bags. Drop-off and collection available in Medway.",
};

// Live campaign progress on every request
export const revalidate = 0;

const SUPPLY_ITEMS = [
  "White shirts",
  "White polo shirts",
  "Grey & black trousers",
  "Black & grey skirts",
  "Black school shoes",
  "Pencil cases",
  "Pens, pencils & stationery",
  "Tights & socks",
  "Lunch boxes",
  "School bags",
];

export default async function BackToSchoolPage() {
  const supabase = createAdminClient();

  // Live donation total for the campaign
  let raisedPence = 0;
  const { data: donations } = await supabase
    .from("donations")
    .select("amount")
    .eq("campaign", FESTIVAL.campaignKey)
    .eq("status", "completed");
  if (donations) {
    raisedPence = (donations as { amount: number }[]).reduce(
      (sum, d) => sum + d.amount,
      0,
    );
  }

  return (
    <>
      {/* ============================================
          HERO
          ============================================ */}
      <section className="relative bg-brand-dark text-white pt-32 pb-20 md:pt-40 md:pb-24 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-brand-accent rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-brand-blue rounded-full opacity-20 blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl">
            <p className="font-heading text-xs uppercase tracking-widest text-brand-accent mb-4">
              The campaign · 2026
            </p>
            <h1 className="font-heading font-black text-4xl md:text-6xl lg:text-7xl leading-none mb-6">
              Help 500 children
              <br />
              start school
              <br />
              with confidence.
            </h1>
            <p className="text-lg md:text-xl text-white/75 max-w-2xl leading-relaxed mb-6">
              Last year we supported{" "}
              <span className="text-white font-semibold">
                {FIRST_YEAR_STATS.uniformsGiven} children
              </span>{" "}
              across Medway with uniforms, shoes and essentials in two weeks.
              This year, we&rsquo;re aiming for{" "}
              <span className="text-brand-accent font-semibold">500</span>.
            </p>
            <p className="text-white/60 max-w-2xl leading-relaxed">
              You can support in two ways: donate money so we can buy what
              families need, or donate brand new supplies you have spare.
              Every contribution counts.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
          PROGRESS BAR
          ============================================ */}
      <section className="bg-brand-dark text-white pb-16 md:pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <FestivalProgressBar raisedPence={raisedPence} />
          </div>
        </div>
      </section>

      {/* ============================================
          TWO PATHS
          ============================================ */}
      <section className="bg-brand-pale/40 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mb-12">
            <SectionLabel text="Two ways to help" color="brand-blue" className="mb-6" />
            <h2 className="font-heading font-black text-3xl md:text-4xl lg:text-5xl text-brand-dark mb-4">
              Money or supplies — both make a real difference.
            </h2>
            <p className="text-brand-dark/70 leading-relaxed">
              £25 covers a full uniform package for one child. £10,000 reaches
              all 500. But if you&rsquo;d rather donate brand new supplies,
              we&rsquo;ll happily come and collect from anywhere in Medway.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* DONATE MONEY */}
            <div
              id="donate-money"
              className="bg-white rounded-2xl p-6 md:p-8 border border-brand-blue/10"
            >
              <div className="inline-flex items-center gap-2 bg-brand-green/10 text-brand-green px-3 py-1 rounded-full text-xs font-heading font-bold uppercase tracking-widest mb-4">
                <Sparkles className="h-3 w-3" />
                Donate money
              </div>
              <h3 className="font-heading font-black text-2xl text-brand-dark mb-2">
                Every £25 puts a full uniform on a child&rsquo;s back.
              </h3>
              <p className="text-brand-dark/70 mb-6 text-sm">
                Tagged to the <strong>Back to School 2026</strong> campaign —
                100% of what you give counts toward the £10,000 goal.
              </p>
              <DonationForm campaign={FESTIVAL.campaignKey} />
            </div>

            {/* DONATE SUPPLIES */}
            <div
              id="donate-supplies"
              className="bg-white rounded-2xl p-6 md:p-8 border border-brand-blue/10 flex flex-col"
            >
              <div className="inline-flex items-center gap-2 bg-brand-accent/15 text-brand-blue px-3 py-1 rounded-full text-xs font-heading font-bold uppercase tracking-widest mb-4">
                <Package className="h-3 w-3" />
                Donate new supplies
              </div>
              <h3 className="font-heading font-black text-2xl text-brand-dark mb-2">
                Got brand new kit you&rsquo;d like to share?
              </h3>
              <p className="text-brand-dark/70 mb-6 text-sm">
                We accept <strong>brand new</strong> supplies only. Sizes for
                ages 4–12. Get in touch first — we&rsquo;ll arrange drop-off or
                come collect if you&rsquo;re in Medway.
              </p>

              <div className="bg-brand-pale/40 rounded-xl p-5 mb-6 flex-1">
                <p className="font-heading font-bold text-xs uppercase tracking-widest text-brand-blue mb-3">
                  What we need
                </p>
                <ul className="space-y-2">
                  {SUPPLY_ITEMS.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-brand-dark/85"
                    >
                      <Check className="h-4 w-4 text-brand-green shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-brand-dark/60 mt-4 italic">
                  …and many more — get in touch if you&rsquo;re not sure.
                </p>
              </div>

              {/* Contact actions */}
              <div className="bg-brand-dark text-white rounded-xl p-5 mb-4">
                <p className="font-heading font-bold text-xs uppercase tracking-widest text-brand-accent mb-3">
                  Schedule pickup or drop-off
                </p>
                <div className="space-y-2.5">
                  <a
                    href="tel:+447874059644"
                    className="flex items-center gap-2.5 text-white hover:text-brand-accent transition-colors"
                  >
                    <Phone className="h-4 w-4 text-brand-accent shrink-0" />
                    <span className="font-heading font-bold">07874 059644</span>
                  </a>
                  <a
                    href="mailto:info@evolutionimpactinitiative.co.uk"
                    className="flex items-center gap-2.5 text-white hover:text-brand-accent transition-colors break-all"
                  >
                    <Mail className="h-4 w-4 text-brand-accent shrink-0" />
                    <span className="text-sm">
                      info@evolutionimpactinitiative.co.uk
                    </span>
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-brand-dark/70">
                <div className="bg-brand-pale/30 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Truck className="h-3.5 w-3.5 text-brand-blue" />
                    <span className="font-heading font-bold text-brand-blue uppercase tracking-widest text-[10px]">
                      Collection
                    </span>
                  </div>
                  <p>Free pick-up across Medway</p>
                </div>
                <div className="bg-brand-pale/30 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Package className="h-3.5 w-3.5 text-brand-blue" />
                    <span className="font-heading font-bold text-brand-blue uppercase tracking-widest text-[10px]">
                      Sizes
                    </span>
                  </div>
                  <p>Ages 4 – 12</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          BREAKDOWN
          ============================================ */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mb-10">
            <SectionLabel
              text="Where your support goes"
              color="brand-blue"
              className="mb-6"
            />
            <h2 className="font-heading font-black text-3xl md:text-4xl text-brand-dark mb-4">
              £10,000 target · every pound accounted for
            </h2>
            <p className="text-brand-dark/70 leading-relaxed">
              The majority goes directly to children. The rest keeps the
              campaign running and ready for emergencies.
            </p>
          </div>

          <div className="space-y-3 max-w-2xl">
            <BreakdownRow label="School uniforms" amount="£5,000" pct={50} />
            <BreakdownRow label="School shoes" amount="£2,000" pct={20} />
            <BreakdownRow label="Backpacks" amount="£1,500" pct={15} />
            <BreakdownRow label="Stationery" amount="£1,000" pct={10} />
            <BreakdownRow
              label="Emergency support"
              amount="£500"
              pct={5}
              tone="green"
            />
          </div>

          <p className="text-xs text-brand-dark/50 mt-6">
            <span className="text-brand-blue font-semibold">£9,500</span>{" "}
            direct to children (95%) ·{" "}
            <span className="text-brand-green font-semibold">£500</span>{" "}
            emergency contingency (5%)
          </p>
        </div>
      </section>

      {/* ============================================
          FESTIVAL TIE-IN
          ============================================ */}
      <section className="bg-brand-dark text-white py-16 md:py-20 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-brand-accent rounded-full opacity-10 blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <SectionLabel
              text="Celebrate with us"
              color="brand-accent"
              className="mb-6"
            />
            <h2 className="font-heading font-black text-3xl md:text-4xl lg:text-5xl mb-4">
              {FESTIVAL.title} · {FESTIVAL.dateLabel}
            </h2>
            <p className="text-white/70 leading-relaxed mb-6 text-lg">
              The Back to School campaign culminates at Evolution Fest 2026 —
              a free family festival celebrating one year of impact.
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/60 mb-8">
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4 text-brand-accent" />
                {FESTIVAL.dateLabel} · {FESTIVAL.timeLabel}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-accent" />
                {FESTIVAL.venueName}, {FESTIVAL.venueArea}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                size="lg"
                className="bg-brand-accent text-brand-dark hover:bg-brand-green hover:text-white"
              >
                <Link href={`/${FESTIVAL.slug}`}>
                  About the festival
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function BreakdownRow({
  label,
  amount,
  pct,
  tone = "blue",
}: {
  label: string;
  amount: string;
  pct: number;
  tone?: "blue" | "green";
}) {
  const fillClass = tone === "green" ? "bg-brand-green" : "bg-brand-blue";
  const bgClass = "bg-brand-blue/10";

  return (
    <div className="flex items-center gap-4">
      <span className="font-heading font-semibold text-brand-dark text-sm md:text-base w-32 md:w-40 shrink-0">
        {label}
      </span>
      <div className={`flex-1 h-3 rounded-full overflow-hidden ${bgClass}`}>
        <div
          className={`h-full rounded-full ${fillClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-heading font-bold text-brand-dark text-sm md:text-base w-16 text-right shrink-0">
        {amount}
      </span>
    </div>
  );
}
