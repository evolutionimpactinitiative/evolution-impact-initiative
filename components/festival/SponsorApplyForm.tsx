"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  SPONSOR_TIERS,
  getSponsorsByPath,
  type SponsorPath,
  type SponsorTier,
} from "@/lib/festival";

interface Props {
  cappedTakenTiers: string[];
}

interface FormState {
  path: SponsorPath;
  tierKey: string | null;
  amountPounds: string; // string in the input
  organisationName: string;
  contactName: string;
  email: string;
  phone: string;
  displayName: string;
  logoUrl: string;
  website: string;
  message: string;
  consent: boolean;
}

const initial: FormState = {
  path: "premium",
  tierKey: null,
  amountPounds: "",
  organisationName: "",
  contactName: "",
  email: "",
  phone: "",
  displayName: "",
  logoUrl: "",
  website: "",
  message: "",
  consent: false,
};

const PATH_LABELS: Record<SponsorPath, string> = {
  premium: "Premium tiers",
  community: "Community ladder",
  activity: "Activity zones",
  custom: "Custom partnership",
};

export function SponsorApplyForm({ cappedTakenTiers }: Props) {
  const router = useRouter();
  const [form, setForm] = React.useState<FormState>(initial);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const isCustom = form.path === "custom";
  const tiers: SponsorTier[] = isCustom
    ? []
    : getSponsorsByPath(form.path);

  const selectedTier =
    form.tierKey && !isCustom
      ? SPONSOR_TIERS.find((t) => t.key === form.tierKey) ?? null
      : null;

  // For the amount input: locked to tier price unless tier allows extra (B2S Champion "£1,000+" or activity "from £X")
  const allowAmountAbove = selectedTier
    ? selectedTier.key === "b2s_champion" ||
      selectedTier.path === "activity"
    : isCustom;
  const minPounds = selectedTier
    ? Math.round(selectedTier.pricePence / 100)
    : isCustom
      ? 0
      : 0;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setPath(path: SponsorPath) {
    setForm((f) => ({
      ...f,
      path,
      tierKey: null,
      amountPounds: "",
    }));
  }

  function setTier(tier: SponsorTier) {
    setForm((f) => ({
      ...f,
      tierKey: tier.key,
      amountPounds: String(Math.round(tier.pricePence / 100)),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isCustom && !form.tierKey) {
      setError("Please choose a tier.");
      return;
    }
    if (
      !form.organisationName.trim() ||
      !form.contactName.trim() ||
      !form.email.trim()
    ) {
      setError(
        "Please fill in organisation name, contact name and email.",
      );
      return;
    }
    if (!form.consent) {
      setError("Please accept the declaration to continue.");
      return;
    }

    const amountPounds = Number(form.amountPounds || "0");
    if (!isCustom && selectedTier) {
      if (amountPounds < minPounds) {
        setError(`Minimum pledge for ${selectedTier.label} is £${minPounds.toLocaleString("en-GB")}.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/festival/sponsors/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: form.path,
          tierKey: isCustom ? "custom" : form.tierKey,
          amountPence:
            isCustom && amountPounds === 0 ? 0 : Math.round(amountPounds * 100),
          organisationName: form.organisationName.trim(),
          contactName: form.contactName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          displayName: form.displayName.trim() || undefined,
          logoUrl: form.logoUrl.trim() || undefined,
          website: form.website.trim() || undefined,
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

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
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

  if (success) {
    return <ReceivedState path={form.path} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* PATH */}
      <Section title="1. Choose a path" required>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(Object.keys(PATH_LABELS) as SponsorPath[]).map((p) => {
            const isActive = form.path === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPath(p)}
                className={[
                  "text-left p-4 rounded-xl border-2 transition-all",
                  isActive
                    ? "bg-brand-blue text-white border-brand-blue"
                    : "bg-white border-brand-blue/15 hover:border-brand-blue",
                ].join(" ")}
              >
                <p className="font-heading font-bold text-base mb-1">
                  {PATH_LABELS[p]}
                </p>
                <p
                  className={`text-sm ${isActive ? "text-white/85" : "text-brand-dark/60"}`}
                >
                  {pathBlurb(p)}
                </p>
              </button>
            );
          })}
        </div>
      </Section>

      {/* TIER (skipped for custom) */}
      {!isCustom && (
        <Section title="2. Choose a tier" required>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tiers.map((tier) => {
              const taken = cappedTakenTiers.includes(tier.key);
              const isSelected = form.tierKey === tier.key;
              return (
                <button
                  key={tier.key}
                  type="button"
                  disabled={taken}
                  onClick={() => setTier(tier)}
                  className={[
                    "text-left p-4 rounded-xl border-2 transition-all",
                    taken
                      ? "bg-brand-pale/30 border-brand-dark/10 opacity-50 cursor-not-allowed"
                      : isSelected
                        ? "bg-brand-blue text-white border-brand-blue"
                        : "bg-white border-brand-blue/15 hover:border-brand-blue",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="font-heading font-bold text-base">
                      {tier.label}
                    </p>
                    {tier.cap !== null && (
                      <span
                        className={[
                          "text-[10px] font-heading font-bold uppercase tracking-widest px-2 py-0.5 rounded-full whitespace-nowrap",
                          taken
                            ? "bg-brand-dark/10 text-brand-dark/50"
                            : isSelected
                              ? "bg-white text-brand-blue"
                              : "bg-brand-accent/15 text-brand-blue",
                        ].join(" ")}
                      >
                        {taken ? "Taken" : "1 available"}
                      </span>
                    )}
                  </div>
                  <p
                    className={`font-heading font-black text-xl mb-2 ${isSelected ? "text-white" : "text-brand-blue"}`}
                  >
                    {tier.priceLabel}
                  </p>
                  <ul className="space-y-1">
                    {tier.perks.slice(0, 3).map((p) => (
                      <li
                        key={p}
                        className={`flex items-start gap-1.5 text-xs ${isSelected ? "text-white/85" : "text-brand-dark/65"}`}
                      >
                        <Check className="h-3 w-3 mt-0.5 shrink-0" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {/* AMOUNT */}
      {(selectedTier || isCustom) && (
        <Section
          title={isCustom ? "2. Your pledge (optional)" : "3. Your pledge"}
        >
          <Field
            label={
              allowAmountAbove
                ? isCustom
                  ? "How much can you pledge? (optional — leave blank to discuss with the team)"
                  : `Pledge amount (minimum £${minPounds.toLocaleString("en-GB")})`
                : "Pledge amount"
            }
          >
            <div className="flex items-center gap-2 max-w-xs">
              <span className="text-brand-dark/60 font-heading font-bold text-lg">
                £
              </span>
              <Input
                type="number"
                min={minPounds}
                step="1"
                value={form.amountPounds}
                disabled={!allowAmountAbove && !!selectedTier}
                onChange={(e) => update("amountPounds", e.target.value)}
                placeholder={
                  isCustom
                    ? "e.g. 200"
                    : String(minPounds)
                }
              />
            </div>
          </Field>
        </Section>
      )}

      {/* ORG */}
      <Section title={isCustom ? "3. Your organisation" : "4. Your organisation"}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Organisation name" required>
            <Input
              value={form.organisationName}
              onChange={(e) => update("organisationName", e.target.value)}
              placeholder="e.g. Acme Co."
              required
            />
          </Field>
          <Field label="Public display name">
            <Input
              value={form.displayName}
              onChange={(e) => update("displayName", e.target.value)}
              placeholder="How you'd like to appear on the website (if different)"
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
          <Field label="Phone">
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="07000 000000"
            />
          </Field>
          <Field label="Website">
            <Input
              type="url"
              value={form.website}
              onChange={(e) => update("website", e.target.value)}
              placeholder="https://"
            />
          </Field>
        </div>

        <Field label="Logo URL">
          <Input
            type="url"
            value={form.logoUrl}
            onChange={(e) => update("logoUrl", e.target.value)}
            placeholder="https://example.com/logo.png (or email it to us later)"
          />
          <p className="text-xs text-brand-dark/50 mt-1">
            Don&rsquo;t have a URL handy? Skip this — we&rsquo;ll email you
            after to request a high-res file.
          </p>
        </Field>

        <Field label={isCustom ? "Tell us about your partnership goals" : "Anything else we should know?"}>
          <Textarea
            rows={4}
            value={form.message}
            onChange={(e) => update("message", e.target.value)}
            placeholder={
              isCustom
                ? "Budget range, what you're hoping to achieve, etc."
                : "Optional"
            }
          />
        </Field>
      </Section>

      {/* SUBMIT */}
      <Section title={isCustom ? "4. Submit" : "5. Submit"}>
        <CheckboxRow
          checked={form.consent}
          onChange={(v) => update("consent", v)}
          label="I'm authorised to commit my organisation to this partnership and consent to be contacted about it."
        />

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
                {isCustom || (form.amountPounds === "" || form.amountPounds === "0")
                  ? "Submitting…"
                  : "Redirecting to checkout…"}
              </>
            ) : isCustom || (form.amountPounds === "" || form.amountPounds === "0") ? (
              "Send sponsorship inquiry"
            ) : (
              `Pledge £${Number(form.amountPounds || 0).toLocaleString("en-GB")} & confirm`
            )}
          </Button>
        </div>
      </Section>
    </form>
  );
}

function pathBlurb(path: SponsorPath): string {
  switch (path) {
    case "premium":
      return "£1,000 to £3,000+. Title billing, banners, named campaign sponsorship.";
    case "community":
      return "£50 to £750 across five tiers. Logo, certificate, optional stall space.";
    case "activity":
      return "£300 to £600+ to brand a single activity zone for the day.";
    case "custom":
      return "Tell us your budget and goals — we'll tailor a package.";
  }
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

function ReceivedState({ path }: { path: SponsorPath }) {
  return (
    <div className="bg-white rounded-2xl p-10 text-center border border-brand-green/30">
      <CheckCircle2 className="h-12 w-12 text-brand-green mx-auto mb-4" />
      <h2 className="font-heading font-black text-2xl text-brand-dark mb-3">
        Inquiry received
      </h2>
      <p className="text-brand-dark/70 mb-2 max-w-md mx-auto">
        Thank you. {path === "custom" ? "Our team will be in touch within 2 working days to discuss." : "We'll confirm your partnership by email within 2 working days."}
      </p>
      <p className="text-sm text-brand-dark/60">
        A confirmation email is on its way.
      </p>
    </div>
  );
}
