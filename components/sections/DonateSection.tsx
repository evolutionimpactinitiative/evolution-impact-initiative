import Link from "next/link";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { DonationTierCard } from "@/components/shared/DonationTierCard";
import { Button } from "@/components/ui/button";
import { donationTiers } from "@/lib/constants";

export function DonateSection() {
  return (
    <section className="bg-white py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <SectionLabel text="Support Us" color="brand-blue" className="mb-6 mx-auto" />
          <h2 className="font-heading font-black text-3xl md:text-4xl lg:text-5xl text-brand-dark mb-6">
            Every Contribution Fuels Change
          </h2>
          <p className="text-brand-dark/70 leading-relaxed">
            As a Community Interest Company, every penny we receive is reinvested back into the community. That&apos;s not just a promise — it&apos;s written into our legal structure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {donationTiers.map((tier) => (
            <DonationTierCard
              key={tier.amount}
              amount={tier.amount}
              description={tier.description}
              color={tier.color as "brand-blue" | "brand-green" | "brand-dark"}
            />
          ))}
        </div>

        <div className="text-center">
          <Button asChild size="lg" variant="secondary">
            <Link href="/donate">Donate Now</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
