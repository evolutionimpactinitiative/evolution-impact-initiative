"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { DonationForm } from "@/components/donations/DonationForm";
import { COMMUNITY_TIERS, type CommunityTierDef } from "@/lib/back-to-school";

interface Props {
  campaign: string;
}

const BENEFIT_LABELS: Array<{
  key: keyof CommunityTierDef["benefits"];
  label: string;
}> = [
  { key: "socialThankYou", label: "Social thank-you" },
  { key: "certificate", label: "Certificate" },
  { key: "logoWebsite", label: "Logo on website" },
  { key: "logoCampaign", label: "Logo on materials" },
  { key: "namedCollectionPoint", label: "Named collection point" },
  { key: "impactReportFeature", label: "Featured in impact report" },
];

export function SponsorNowSection({ campaign }: Props) {
  const [selectedAmount, setSelectedAmount] = React.useState<number>(
    COMMUNITY_TIERS[1].amount, // Bronze — nice mid-range default
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-8 lg:gap-12 items-start">
      {/* LEFT — tier picker */}
      <div>
        <p className="font-heading text-xs uppercase tracking-widest text-brand-green mb-3">
          Sponsor now, card payment
        </p>
        <h3 className="font-heading font-black text-2xl md:text-3xl text-brand-dark mb-3 leading-tight">
          Pick your community tier
        </h3>
        <p className="text-brand-dark/70 mb-6 max-w-lg text-sm md:text-base leading-relaxed">
          Every gift is counted toward the £10,000 goal on the campaign
          progress bar. Payment is card-only, one-time, via Stripe.
        </p>

        <div className="space-y-3">
          {COMMUNITY_TIERS.map((tier) => {
            const isActive = selectedAmount === tier.amount;
            const activeBenefits = BENEFIT_LABELS.filter(
              (b) => tier.benefits[b.key],
            );
            return (
              <button
                type="button"
                key={tier.value}
                onClick={() => setSelectedAmount(tier.amount)}
                aria-pressed={isActive}
                className={[
                  "w-full text-left rounded-2xl p-4 md:p-5 border-2 transition-all",
                  isActive
                    ? "border-brand-green bg-brand-green/5 shadow-sm"
                    : "border-brand-blue/15 bg-white hover:border-brand-blue",
                ].join(" ")}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3 mb-2">
                  <div className="flex items-baseline gap-3">
                    <span
                      className={[
                        "font-heading font-semibold text-2xl md:text-3xl leading-none",
                        isActive ? "text-brand-green" : "text-brand-dark",
                      ].join(" ")}
                    >
                      £{tier.amount}
                    </span>
                    <span className="font-heading font-bold uppercase tracking-widest text-xs text-brand-blue">
                      {tier.label}
                    </span>
                  </div>
                  <span className="text-xs text-brand-dark/60">
                    Kits ~{tier.childrenReached}{" "}
                    {tier.childrenReached === 1 ? "child" : "children"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {activeBenefits.map((b) => (
                    <span
                      key={b.key}
                      className="inline-flex items-center gap-1 text-xs text-brand-dark/70"
                    >
                      <Check className="h-3 w-3 text-brand-green" />
                      {b.label}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-brand-dark/60 mt-4">
          Looking for Champion, Major or Title Partner (£1,000+)?{" "}
          <a
            href="#inquire"
            className="text-brand-blue font-semibold underline"
          >
            Fill in the inquiry form
          </a>{" "}
          and we&rsquo;ll come back to arrange invoicing and logos.
        </p>
      </div>

      {/* RIGHT — payment form */}
      <div className="bg-brand-pale/40 rounded-2xl p-5 md:p-6 border border-brand-blue/10 lg:sticky lg:top-24">
        <p className="font-heading font-bold text-xs uppercase tracking-widest text-brand-blue mb-4">
          Complete your sponsorship
        </p>
        <DonationForm
          campaign={campaign}
          defaultAmount={selectedAmount}
          hideAmountPresets
          summaryTheme="blue"
        />
      </div>
    </div>
  );
}
