import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/shared/PageHero";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { DonationTierCard } from "@/components/shared/DonationTierCard";
import { Button } from "@/components/ui/button";
import { fullDonationTiers } from "@/lib/constants";
import { Heart, Building, BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  title: "Donate — Support Community Impact in Medway",
  description:
    "Your donation supports free workshops, youth sport, food drives and community events in Medway.",
};

export default function DonatePage() {
  return (
    <>
      <PageHero
        title="Your Generosity Powers Real Change"
        subtitle="Every donation — no matter the size — directly supports our work in Medway."
      />

      {/* Intro */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-lg text-brand-dark/70 leading-relaxed mb-8">
              As a Community Interest Company, we are legally required to reinvest all profits into the community. Your money doesn&apos;t go to shareholders. It goes to workshops, resources, events and the people who need them most.
            </p>

            {/* Donation tiers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {fullDonationTiers.map((tier, index) => (
                <DonationTierCard
                  key={tier.amount}
                  amount={tier.amount}
                  description={tier.description}
                  color={index % 3 === 0 ? "brand-blue" : index % 3 === 1 ? "brand-green" : "brand-dark"}
                />
              ))}
            </div>

            <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
              <Link href="#">Donate Now</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Donate */}
      <section className="bg-brand-pale/30 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Heart className="h-8 w-8 text-brand-green" />
              <SectionLabel text="Why Donate" color="brand-green" />
            </div>
            <h2 className="font-heading font-black text-3xl md:text-4xl text-brand-dark mb-6">
              Because Every Donation Has a Story
            </h2>
            <div className="prose prose-lg max-w-none text-brand-dark/70">
              <p>
                Because behind every statistic is a young person who found their voice in a creative workshop. A parent who felt less alone at a family event. A child who started the school year with everything they needed.
              </p>
              <p>
                Your donation doesn&apos;t just fund activities — it funds opportunity, connection and hope.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Corporate & Business Support */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Building className="h-8 w-8 text-brand-blue" />
              <SectionLabel text="Business Support" color="brand-blue" />
            </div>
            <h2 className="font-heading font-black text-3xl md:text-4xl text-brand-dark mb-6">
              Corporate & Business Support
            </h2>
            <p className="text-brand-dark/70 leading-relaxed mb-8">
              We welcome partnerships with local businesses and organisations who share our values. There are many ways to support our work:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {[
                "Sponsorship opportunities",
                "In-kind donations",
                "Employee volunteering days",
                "Co-branded initiatives",
              ].map((item) => (
                <div
                  key={item}
                  className="bg-brand-pale/50 p-4 rounded-lg flex items-center gap-3"
                >
                  <span className="text-brand-green font-bold">✓</span>
                  <span className="text-brand-dark">{item}</span>
                </div>
              ))}
            </div>

            <p className="text-brand-dark/70 mb-6">
              All supporters receive impact reports showing exactly how their contribution has made a difference.
            </p>

            <Button asChild variant="outline">
              <Link href="/contact">Enquire About Partnership</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Transparency Commitment */}
      <section className="bg-brand-dark py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-4 mb-6">
              <BarChart3 className="h-8 w-8 text-brand-accent" />
              <SectionLabel text="Transparency" color="brand-accent" />
            </div>
            <h2 className="font-heading font-black text-3xl md:text-4xl text-white mb-6">
              Our Transparency Commitment
            </h2>
            <p className="text-white/70 leading-relaxed mb-8">
              We publish our annual CIC community interest report with Companies House and are committed to sharing impact data with all donors and supporters. You&apos;ll always know where your money goes.
            </p>

            <div className="glass-card p-8 text-left">
              <h3 className="font-heading font-bold text-xl text-white mb-4">
                As a CIC, we guarantee:
              </h3>
              <ul className="space-y-3 text-white/80">
                <li className="flex items-start gap-3">
                  <span className="text-brand-accent">✓</span>
                  All profits reinvested into community programmes
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-accent">✓</span>
                  Annual community interest reports filed with the CIC Regulator
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-accent">✓</span>
                  Regular impact updates to all donors
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-accent">✓</span>
                  Complete financial transparency
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-brand-green py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading font-black text-2xl md:text-3xl text-white mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-white/90 mb-8 max-w-xl mx-auto">
            Your support helps us continue creating safe, empowering spaces for young people and families across Medway.
          </p>
          <Button asChild size="lg" className="bg-white text-brand-green hover:bg-brand-pale">
            <Link href="#">Donate Now</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
