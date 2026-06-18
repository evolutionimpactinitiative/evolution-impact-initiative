"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  VENDOR_CATEGORIES,
  type VendorCategoryKey,
} from "@/lib/festival";

interface Props {
  capacity: Record<VendorCategoryKey, number>;
}

interface FormState {
  category: VendorCategoryKey | null;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  description: string;
  whatSelling: string;
  website: string;
  instagram: string;
  facebook: string;
  powerNeeded: boolean;
  powerNotes: string;
  gazeboSize: string;
  hasPublicLiability: boolean;
  hasFoodHygieneRating: boolean;
  foodHygieneScore: string;
  hasRiskAssessment: boolean;
  consent: boolean;
}

const initial: FormState = {
  category: null,
  businessName: "",
  contactName: "",
  email: "",
  phone: "",
  description: "",
  whatSelling: "",
  website: "",
  instagram: "",
  facebook: "",
  powerNeeded: false,
  powerNotes: "",
  gazeboSize: "",
  hasPublicLiability: false,
  hasFoodHygieneRating: false,
  foodHygieneScore: "",
  hasRiskAssessment: false,
  consent: false,
};

export function VendorApplyForm({ capacity }: Props) {
  const router = useRouter();
  const [form, setForm] = React.useState<FormState>(initial);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<null | "free">(null);

  const selected = form.category
    ? VENDOR_CATEGORIES.find((c) => c.key === form.category) ?? null
    : null;
  const isFood = form.category === "food";
  const isCommunityOrg = form.category === "community_org";
  const isPaid = selected !== null && selected.contributionPence > 0;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.category) {
      setError("Please choose a vendor category.");
      return;
    }
    if (
      !form.businessName.trim() ||
      !form.contactName.trim() ||
      !form.email.trim() ||
      !form.phone.trim()
    ) {
      setError("Please fill in business name, contact name, email and phone.");
      return;
    }
    if (!form.consent) {
      setError("Please accept the declaration to continue.");
      return;
    }

    setSubmitting(true);
    try {
      const socialHandles: Record<string, string> = {};
      if (form.instagram.trim()) socialHandles.instagram = form.instagram.trim();
      if (form.facebook.trim()) socialHandles.facebook = form.facebook.trim();

      const res = await fetch("/api/festival/vendors/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: form.category,
          businessName: form.businessName.trim(),
          contactName: form.contactName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          description: form.description.trim() || undefined,
          whatSelling: form.whatSelling.trim() || undefined,
          website: form.website.trim() || undefined,
          socialHandles,
          powerNeeded: form.powerNeeded,
          powerNotes: form.powerNotes.trim() || undefined,
          gazeboSize: form.gazeboSize.trim() || undefined,
          hasPublicLiability: form.hasPublicLiability,
          hasFoodHygieneRating: form.hasFoodHygieneRating,
          foodHygieneScore: form.foodHygieneScore.trim()
            ? Number(form.foodHygieneScore.trim())
            : undefined,
          hasRiskAssessment: form.hasRiskAssessment,
          consent: form.consent,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      // Free path — show success
      setSuccess("free");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  if (success === "free") {
    return <FreeSuccessState />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* CATEGORY */}
      <Section title="1. Choose your category" required>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {VENDOR_CATEGORIES.map((cat) => {
            const taken = capacity[cat.key];
            const remaining = Math.max(0, cat.cap - taken);
            const full = remaining === 0;
            const isSelected = form.category === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                disabled={full}
                onClick={() => update("category", cat.key)}
                className={[
                  "text-left p-4 rounded-xl border-2 transition-all",
                  full
                    ? "bg-brand-pale/30 border-brand-dark/10 opacity-50 cursor-not-allowed"
                    : isSelected
                      ? "bg-brand-blue text-white border-brand-blue"
                      : "bg-white border-brand-blue/15 hover:border-brand-blue",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="font-heading font-bold text-base">
                    {cat.label}
                  </p>
                  <span
                    className={[
                      "text-[10px] font-heading font-bold uppercase tracking-widest px-2 py-0.5 rounded-full whitespace-nowrap",
                      full
                        ? "bg-brand-dark/10 text-brand-dark/50"
                        : isSelected
                          ? "bg-white text-brand-blue"
                          : "bg-brand-green/10 text-brand-green",
                    ].join(" ")}
                  >
                    {full ? "Full" : `${remaining}/${cat.cap} left`}
                  </span>
                </div>
                <p
                  className={`text-sm ${isSelected ? "text-white/85" : "text-brand-dark/65"}`}
                >
                  {cat.examples.slice(0, 4).join(" · ")}
                </p>
                <p
                  className={`mt-3 font-heading font-black text-xl ${
                    isSelected
                      ? "text-white"
                      : cat.contributionPence === 0
                        ? "text-brand-green"
                        : "text-brand-blue"
                  }`}
                >
                  {cat.contributionLabel}
                </p>
              </button>
            );
          })}
        </div>
      </Section>

      {/* BUSINESS */}
      <Section title="2. About your business">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Business name" required>
            <Input
              value={form.businessName}
              onChange={(e) => update("businessName", e.target.value)}
              placeholder="e.g. Sunshine Smoothies"
              required
            />
          </Field>
          <Field label="Contact name" required>
            <Input
              value={form.contactName}
              onChange={(e) => update("contactName", e.target.value)}
              placeholder="Your full name"
              required
            />
          </Field>
          <Field label="Email" required>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@example.com"
              required
            />
          </Field>
          <Field label="Phone" required>
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="07000 000000"
              required
            />
          </Field>
        </div>

        <Field label="Tell us about your business">
          <Textarea
            rows={3}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="What do you do? How long have you been trading?"
          />
        </Field>

        <Field label="What you'll be selling on the day">
          <Textarea
            rows={2}
            value={form.whatSelling}
            onChange={(e) => update("whatSelling", e.target.value)}
            placeholder={`e.g. ${selected?.examples.slice(0, 3).join(", ") ?? "menu / products / services"}`}
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Website">
            <Input
              type="url"
              value={form.website}
              onChange={(e) => update("website", e.target.value)}
              placeholder="https://"
            />
          </Field>
          <Field label="Instagram">
            <Input
              value={form.instagram}
              onChange={(e) => update("instagram", e.target.value)}
              placeholder="@yourhandle"
            />
          </Field>
          <Field label="Facebook">
            <Input
              value={form.facebook}
              onChange={(e) => update("facebook", e.target.value)}
              placeholder="facebook.com/..."
            />
          </Field>
        </div>
      </Section>

      {/* LOGISTICS */}
      <Section title="3. On the day">
        <Field label="Gazebo size (if bringing one)">
          <Input
            value={form.gazeboSize}
            onChange={(e) => update("gazeboSize", e.target.value)}
            placeholder="e.g. 3m x 3m"
          />
        </Field>

        <CheckboxRow
          checked={form.powerNeeded}
          onChange={(v) => update("powerNeeded", v)}
          label="I need access to power"
        />
        {form.powerNeeded && (
          <Field label="What do you need power for?">
            <Textarea
              rows={2}
              value={form.powerNotes}
              onChange={(e) => update("powerNotes", e.target.value)}
              placeholder="e.g. coffee machine, lights"
            />
          </Field>
        )}
      </Section>

      {/* DECLARATIONS */}
      <Section title="4. Compliance declarations">
        <p className="text-sm text-brand-dark/70 mb-4">
          Just confirm what you have. You&rsquo;ll email actual documents to us
          once your application is approved — don&rsquo;t upload anything now.
        </p>

        <CheckboxRow
          checked={form.hasPublicLiability}
          onChange={(v) => update("hasPublicLiability", v)}
          label="I have valid Public Liability Insurance"
        />
        <CheckboxRow
          checked={form.hasRiskAssessment}
          onChange={(v) => update("hasRiskAssessment", v)}
          label="I have / can provide a Risk Assessment"
        />

        {isFood && (
          <>
            <CheckboxRow
              checked={form.hasFoodHygieneRating}
              onChange={(v) => update("hasFoodHygieneRating", v)}
              label="I have a Food Hygiene Rating"
            />
            {form.hasFoodHygieneRating && (
              <Field label="What's your Food Hygiene Rating? (0–5)">
                <Input
                  type="number"
                  min="0"
                  max="5"
                  step="1"
                  value={form.foodHygieneScore}
                  onChange={(e) =>
                    update("foodHygieneScore", e.target.value)
                  }
                  placeholder="5"
                  className="max-w-32"
                />
              </Field>
            )}
          </>
        )}
      </Section>

      {/* SUBMIT */}
      <Section title="5. Submit">
        <CheckboxRow
          checked={form.consent}
          onChange={(v) => update("consent", v)}
          label="I confirm the information above is correct and I'll provide any required documents on request."
        />

        {selected && (
          <div className="bg-brand-pale/40 border border-brand-blue/15 rounded-lg p-4 text-sm">
            {isCommunityOrg ? (
              <p className="text-brand-dark/80">
                As a <strong>community organisation</strong>, your stall is free
                of charge. You&rsquo;ll receive an email confirmation
                immediately and we&rsquo;ll review within 5 working days.
              </p>
            ) : isPaid ? (
              <p className="text-brand-dark/80">
                You&rsquo;ll be redirected to Stripe to pay your{" "}
                <strong>{selected.contributionLabel}</strong> contribution. Your
                application is finalised when payment succeeds.
              </p>
            ) : null}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 text-red-800 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {isPaid ? "Redirecting to checkout…" : "Submitting…"}
              </>
            ) : isPaid ? (
              `Pay ${selected?.contributionLabel} & apply`
            ) : (
              "Submit application"
            )}
          </Button>
          <p className="text-xs text-brand-dark/60">
            You can email documents to{" "}
            <a
              href="mailto:hello@evolutionimpactinitiative.co.uk"
              className="underline"
            >
              hello@evolutionimpactinitiative.co.uk
            </a>{" "}
            any time.
          </p>
        </div>
      </Section>
    </form>
  );
}

function Section({
  title,
  required,
  children,
}: {
  title: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 border border-brand-blue/10 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-heading font-bold text-lg text-brand-dark">
          {title}
        </h3>
        {required && (
          <span className="text-[10px] uppercase tracking-widest text-brand-blue font-heading font-bold">
            Required
          </span>
        )}
      </div>
      {children}
    </div>
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

function CheckboxRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer py-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-5 w-5 rounded border-brand-blue/30 text-brand-blue focus:ring-brand-blue accent-brand-blue"
      />
      <span className="text-sm text-brand-dark/85 leading-snug">{label}</span>
    </label>
  );
}

function FreeSuccessState() {
  return (
    <div className="bg-white rounded-2xl p-10 text-center border border-brand-green/30">
      <CheckCircle2 className="h-12 w-12 text-brand-green mx-auto mb-4" />
      <h2 className="font-heading font-black text-2xl text-brand-dark mb-3">
        Application received
      </h2>
      <p className="text-brand-dark/70 mb-2 max-w-md mx-auto">
        Thanks — we&rsquo;ll review your application within 5 working days and
        be in touch by email with pitch details and the document checklist.
      </p>
      <p className="text-sm text-brand-dark/60">
        A confirmation email is on its way.
      </p>
    </div>
  );
}
