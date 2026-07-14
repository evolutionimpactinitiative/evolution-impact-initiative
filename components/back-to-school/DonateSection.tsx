"use client";

import * as React from "react";
import Link from "next/link";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { DonationForm } from "@/components/donations/DonationForm";

interface Tier {
  amount: number;
  amountLabel: string;
  label: string;
  highlight?: boolean;
}

const TIERS: Tier[] = [
  { amount: 20, amountLabel: "£20", label: "One child kit" },
  { amount: 100, amountLabel: "£100", label: "5 children" },
  { amount: 200, amountLabel: "£200", label: "10 children" },
  { amount: 1000, amountLabel: "£1,000", label: "50 children", highlight: true },
];

interface Props {
  campaign: string;
  campaignTitle: string;
}

export function DonateSection({ campaign, campaignTitle }: Props) {
  const [selectedAmount, setSelectedAmount] = React.useState<number>(20);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-12 items-start max-w-6xl mx-auto">
      <div>
        <SectionLabel
          text="Donate now"
          color="brand-green"
          className="mb-6"
        />
        <h2 className="font-heading font-black text-3xl md:text-4xl lg:text-5xl text-brand-dark mb-4 leading-tight">
          Every £20 kits
          <br />a child.
        </h2>
        <p className="text-brand-dark/70 leading-relaxed mb-6 max-w-md">
          Tagged to the <strong>{campaignTitle}</strong> campaign. 100% of
          what you give counts toward the £{(10000).toLocaleString()} goal.
        </p>

        <div className="grid grid-cols-2 gap-3 max-w-md">
          {TIERS.map((t) => {
            const isActive = selectedAmount === t.amount;
            return (
              <button
                type="button"
                key={t.amount}
                onClick={() => setSelectedAmount(t.amount)}
                aria-pressed={isActive}
                className={[
                  "text-left rounded-xl p-4 border-2 transition-all",
                  isActive
                    ? t.highlight
                      ? "border-brand-green bg-brand-green text-white shadow-md"
                      : "border-brand-green bg-brand-green/10"
                    : t.highlight
                      ? "border-brand-green bg-brand-green/5 hover:border-brand-green hover:bg-brand-green/10"
                      : "border-brand-blue/15 bg-white hover:border-brand-blue",
                ].join(" ")}
              >
                <p
                  className={[
                    "font-heading font-semibold text-2xl md:text-3xl leading-none",
                    isActive
                      ? t.highlight
                        ? "text-white"
                        : "text-brand-green"
                      : t.highlight
                        ? "text-brand-green"
                        : "text-brand-dark",
                  ].join(" ")}
                >
                  {t.amountLabel}
                </p>
                <p
                  className={[
                    "text-xs uppercase tracking-widest mt-2 font-heading font-semibold",
                    isActive && t.highlight
                      ? "text-white/85"
                      : "text-brand-dark/60",
                  ].join(" ")}
                >
                  {t.label}
                </p>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-brand-dark/60 mt-6 max-w-md">
          Prefer to give supplies?{" "}
          <Link
            href="/back-to-school/donate-supplies"
            className="text-brand-blue font-semibold underline"
          >
            Pledge new items instead
          </Link>
          .
        </p>
      </div>

      <div className="bg-brand-pale/40 rounded-2xl p-5 md:p-6 border border-brand-blue/10">
        <p className="font-heading font-bold text-xs uppercase tracking-widest text-brand-blue mb-4">
          Choose an amount
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
