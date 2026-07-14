"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  COMMUNITY_TIERS,
  PREMIUM_TIERS,
  type SponsorTier,
} from "@/lib/back-to-school";

interface FormState {
  businessName: string;
  contactName: string;
  contactRole: string;
  contactEmail: string;
  contactPhone: string;
  tier: SponsorTier | "";
  customAmount: string;
  message: string;
  consent: boolean;
}

const initial: FormState = {
  businessName: "",
  contactName: "",
  contactRole: "",
  contactEmail: "",
  contactPhone: "",
  tier: "",
  customAmount: "",
  message: "",
  consent: false,
};

interface TierOption {
  value: SponsorTier;
  label: string;
  hint: string;
}

const TIER_OPTIONS: TierOption[] = [
  ...COMMUNITY_TIERS.map((t) => ({
    value: t.value as SponsorTier,
    label: `${t.label} (£${t.amount})`,
    hint: `Kits ~${t.childrenReached} ${t.childrenReached === 1 ? "child" : "children"}`,
  })),
  ...PREMIUM_TIERS.map((t) => ({
    value: t.value,
    label: `${t.label} (${t.priceLabel})`,
    hint: `Kits ~${t.childrenReached} children`,
  })),
  {
    value: "custom",
    label: "Custom amount",
    hint: "Tell us the figure in the message",
  },
  {
    value: "undecided",
    label: "Just exploring — let's chat first",
    hint: "We'll come back with options",
  },
];

export function SponsorInquiryForm() {
  const router = useRouter();
  const [form, setForm] = React.useState<FormState>(initial);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (
      !form.businessName.trim() ||
      !form.contactName.trim() ||
      !form.contactEmail.trim() ||
      !form.contactPhone.trim()
    ) {
      setError(
        "Please fill in business name, your name, email and phone number.",
      );
      return;
    }
    if (!form.tier) {
      setError("Please pick a partnership tier.");
      return;
    }
    if (form.tier === "custom") {
      const n = Number.parseInt(form.customAmount, 10);
      if (!Number.isFinite(n) || n < 1) {
        setError("Please enter a custom amount in pounds.");
        return;
      }
    }
    if (!form.consent) {
      setError("Please tick the box so we can contact you back.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/back-to-school/sponsor-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: form.businessName.trim(),
          contactName: form.contactName.trim(),
          contactRole: form.contactRole.trim() || undefined,
          contactEmail: form.contactEmail.trim(),
          contactPhone: form.contactPhone.trim(),
          tier: form.tier,
          amountGbp:
            form.tier === "custom"
              ? Number.parseInt(form.customAmount, 10)
              : undefined,
          message: form.message.trim() || undefined,
          consent: form.consent,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) return <ReceivedState />;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Business name" required>
          <Input
            value={form.businessName}
            onChange={(e) => update("businessName", e.target.value)}
            required
          />
        </Field>
        <Field label="Your name" required>
          <Input
            value={form.contactName}
            onChange={(e) => update("contactName", e.target.value)}
            required
          />
        </Field>
        <Field label="Role (optional)">
          <Input
            value={form.contactRole}
            onChange={(e) => update("contactRole", e.target.value)}
            placeholder="e.g. Founder, Marketing Lead"
          />
        </Field>
        <Field label="Email" required>
          <Input
            type="email"
            value={form.contactEmail}
            onChange={(e) => update("contactEmail", e.target.value)}
            required
          />
        </Field>
        <Field label="Phone" required>
          <Input
            type="tel"
            value={form.contactPhone}
            onChange={(e) => update("contactPhone", e.target.value)}
            required
          />
        </Field>
      </div>

      <Field label="Partnership level" required>
        <select
          value={form.tier}
          onChange={(e) => update("tier", e.target.value as SponsorTier | "")}
          className="w-full h-10 px-3 py-2 border border-brand-blue/15 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
          required
        >
          <option value="">Choose…</option>
          {TIER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {form.tier && (
          <p className="text-xs text-brand-dark/60 mt-2">
            {TIER_OPTIONS.find((o) => o.value === form.tier)?.hint}
          </p>
        )}
      </Field>

      {form.tier === "custom" && (
        <Field label="Custom amount (£)" required>
          <Input
            type="number"
            min={1}
            value={form.customAmount}
            onChange={(e) => update("customAmount", e.target.value)}
            placeholder="e.g. 400"
            required
          />
        </Field>
      )}

      <Field label="Anything we should know? (optional)">
        <Textarea
          rows={4}
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          placeholder="e.g. we'd like to attend the distribution day, we can only pay by invoice, we'd love to be named on collection points, etc."
        />
      </Field>

      <label className="flex items-start gap-3 cursor-pointer py-2">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(e) => update("consent", e.target.checked)}
          className="mt-1 h-5 w-5 rounded border-brand-blue/30 text-brand-blue focus:ring-brand-blue accent-brand-blue"
        />
        <span className="text-sm text-brand-dark/85 leading-snug">
          I&rsquo;m happy for Evolution Impact Initiative to contact me to
          arrange partnership details. Details used only for this campaign.
        </span>
      </label>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 text-red-800 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={submitting}
        className="w-full sm:w-auto bg-brand-blue text-white hover:bg-brand-dark"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Sending…
          </>
        ) : (
          "Send inquiry"
        )}
      </Button>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="block mb-1.5 text-sm font-heading font-semibold text-brand-dark">
        {label}
        {required && <span className="text-brand-blue ml-1">*</span>}
      </Label>
      {children}
    </div>
  );
}

function ReceivedState() {
  return (
    <div className="bg-white rounded-2xl p-10 text-center border border-brand-green/30">
      <CheckCircle2 className="h-12 w-12 text-brand-green mx-auto mb-4" />
      <h2 className="font-heading font-black text-2xl text-brand-dark mb-3">
        Thanks, we&rsquo;ll be in touch.
      </h2>
      <p className="text-brand-dark/70 mb-2 max-w-md mx-auto">
        Your inquiry is with us. Luke will come back to you within 2 working
        days to arrange the details.
      </p>
    </div>
  );
}
