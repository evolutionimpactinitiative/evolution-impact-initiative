"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DBS_LEVELS, type DbsLevel } from "@/lib/supabase/types";

type TShirtSize = "XS" | "S" | "M" | "L" | "XL" | "XXL";
type YesNo = "yes" | "no" | "";
type RelationshipChoice = "Parent" | "Guardian" | "Other" | "";

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string; // YYYY-MM-DD
  setup: boolean;
  am: boolean;
  pm: boolean;
  packdown: boolean;
  tShirtSize: TShirtSize | "";
  dietaryRequirements: string;
  accessibilityNeeds: string;
  skills: string;
  priorExperience: string;
  // Safeguarding & DBS
  hasDbs: YesNo;
  dbsLevel: DbsLevel | "";
  hasSafeguardingTraining: YesNo;
  safeguardingTrainingNotes: string;
  // Parental consent (only used if age < 18)
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  parentRelationship: RelationshipChoice;
  parentRelationshipOther: string;
  parentalConsentConfirmed: boolean;
  // Emergency
  emergencyContactName: string;
  emergencyContactPhone: string;
  consent: boolean;
}

const initial: FormState = {
  fullName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  setup: false,
  am: false,
  pm: false,
  packdown: false,
  tShirtSize: "",
  dietaryRequirements: "",
  accessibilityNeeds: "",
  skills: "",
  priorExperience: "",
  hasDbs: "",
  dbsLevel: "",
  hasSafeguardingTraining: "",
  safeguardingTrainingNotes: "",
  parentName: "",
  parentPhone: "",
  parentEmail: "",
  parentRelationship: "",
  parentRelationshipOther: "",
  parentalConsentConfirmed: false,
  emergencyContactName: "",
  emergencyContactPhone: "",
  consent: false,
};

const SHIFT_LABELS: Array<{
  key: "setup" | "am" | "pm" | "packdown";
  label: string;
  hint: string;
}> = [
  { key: "setup", label: "Setup", hint: "10am — 12pm" },
  { key: "am", label: "Festival AM", hint: "12pm — 3pm" },
  { key: "pm", label: "Festival PM", hint: "3pm — 6pm" },
  { key: "packdown", label: "Packdown", hint: "from 6pm" },
];

// Max DOB = today (can't be born in the future).
// Min DOB = 100 years ago (reasonable ceiling for a festival volunteer form).
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
function hundredYearsAgoIso(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 100);
  return d.toISOString().slice(0, 10);
}

function ageFromDob(dob: string): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

export function VolunteerApplyForm() {
  const router = useRouter();
  const [form, setForm] = React.useState<FormState>(initial);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const age = ageFromDob(form.dateOfBirth);
  const isMinor = age !== null && age < 18;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.emergencyContactName.trim() ||
      !form.emergencyContactPhone.trim()
    ) {
      setError(
        "Please complete name, email, phone and emergency contact details.",
      );
      return;
    }
    if (!form.dateOfBirth) {
      setError("Please enter your date of birth.");
      return;
    }
    if (age === null || age < 0 || age > 120) {
      setError("Please enter a valid date of birth.");
      return;
    }
    if (form.hasDbs === "yes" && !form.dbsLevel) {
      setError("Please select your DBS level.");
      return;
    }
    if (isMinor) {
      if (
        !form.parentName.trim() ||
        !form.parentPhone.trim() ||
        !form.parentEmail.trim() ||
        !form.parentRelationship ||
        (form.parentRelationship === "Other" &&
          !form.parentRelationshipOther.trim()) ||
        !form.parentalConsentConfirmed
      ) {
        setError(
          "You're under 18, so we need your parent/guardian's details and their consent to continue.",
        );
        return;
      }
    }
    if (!form.consent) {
      setError("Please tick the declaration to continue.");
      return;
    }

    const relationship =
      form.parentRelationship === "Other"
        ? form.parentRelationshipOther.trim()
        : form.parentRelationship;

    setSubmitting(true);
    try {
      const res = await fetch("/api/festival/volunteers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          dateOfBirth: form.dateOfBirth,
          availability: {
            setup: form.setup,
            am: form.am,
            pm: form.pm,
            packdown: form.packdown,
          },
          tShirtSize: form.tShirtSize || undefined,
          dietaryRequirements: form.dietaryRequirements.trim() || undefined,
          accessibilityNeeds: form.accessibilityNeeds.trim() || undefined,
          skills: form.skills.trim() || undefined,
          priorExperience: form.priorExperience.trim() || undefined,
          hasDbs: form.hasDbs === "" ? undefined : form.hasDbs === "yes",
          dbsLevel: form.hasDbs === "yes" ? form.dbsLevel : undefined,
          hasSafeguardingTraining:
            form.hasSafeguardingTraining === ""
              ? undefined
              : form.hasSafeguardingTraining === "yes",
          safeguardingTrainingNotes:
            form.hasSafeguardingTraining === "yes"
              ? form.safeguardingTrainingNotes.trim() || undefined
              : undefined,
          parentGuardianName: isMinor ? form.parentName.trim() : undefined,
          parentGuardianPhone: isMinor ? form.parentPhone.trim() : undefined,
          parentGuardianEmail: isMinor ? form.parentEmail.trim() : undefined,
          parentGuardianRelationship: isMinor ? relationship : undefined,
          parentalConsentConfirmed: isMinor
            ? form.parentalConsentConfirmed
            : undefined,
          emergencyContactName: form.emergencyContactName.trim(),
          emergencyContactPhone: form.emergencyContactPhone.trim(),
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
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* PERSONAL */}
      <Section title="1. About you">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Full name" required>
            <Input
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              required
            />
          </Field>
          <Field label="Email" required>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
          </Field>
          <Field label="Phone" required>
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              required
            />
          </Field>
          <Field label="Date of birth" required>
            <Input
              type="date"
              value={form.dateOfBirth}
              min={hundredYearsAgoIso()}
              max={todayIso()}
              onChange={(e) => update("dateOfBirth", e.target.value)}
              required
            />
          </Field>
          <Field label="T-shirt size">
            <select
              value={form.tShirtSize}
              onChange={(e) =>
                update("tShirtSize", e.target.value as TShirtSize | "")
              }
              className="w-full h-10 px-3 py-2 border border-brand-blue/15 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <option value="">Choose…</option>
              {(["XS", "S", "M", "L", "XL", "XXL"] as TShirtSize[]).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {age !== null && (
          <p className="text-xs text-brand-dark/60">
            Age: <span className="font-bold text-brand-dark">{age}</span>
            {isMinor && (
              <>
                {" · "}
                <span className="text-brand-blue font-bold">
                  Parental consent needed below
                </span>
              </>
            )}
          </p>
        )}
      </Section>

      {/* AVAILABILITY */}
      <Section title="2. When can you help?">
        <p className="text-sm text-brand-dark/70 mb-3">
          Tick all shifts you can do — even one is great.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SHIFT_LABELS.map((s) => {
            const isOn = form[s.key];
            return (
              <button
                type="button"
                key={s.key}
                onClick={() => update(s.key, !isOn)}
                className={[
                  "text-left p-4 rounded-xl border-2 transition-all",
                  isOn
                    ? "bg-brand-green text-white border-brand-green"
                    : "bg-white border-brand-blue/15 hover:border-brand-blue",
                ].join(" ")}
              >
                <p className="font-heading font-bold text-base mb-1">
                  {s.label}
                </p>
                <p
                  className={`text-xs ${isOn ? "text-white/85" : "text-brand-dark/60"}`}
                >
                  {s.hint}
                </p>
              </button>
            );
          })}
        </div>
      </Section>

      {/* SKILLS */}
      <Section title="3. Anything useful we should know?">
        <Field label="Skills or things you'd enjoy doing">
          <Textarea
            rows={3}
            value={form.skills}
            onChange={(e) => update("skills", e.target.value)}
            placeholder="e.g. face painting, first aid, photography, crowd handling, kids' games, IT, registration desk"
          />
        </Field>

        <Field label="Prior volunteering or relevant experience">
          <Textarea
            rows={2}
            value={form.priorExperience}
            onChange={(e) => update("priorExperience", e.target.value)}
            placeholder="Optional"
          />
        </Field>

        <Field label="Any dietary requirements?">
          <Input
            value={form.dietaryRequirements}
            onChange={(e) => update("dietaryRequirements", e.target.value)}
            placeholder="e.g. vegetarian, halal, gluten-free"
          />
        </Field>

        <Field label="Any accessibility needs we should know about?">
          <Input
            value={form.accessibilityNeeds}
            onChange={(e) => update("accessibilityNeeds", e.target.value)}
            placeholder="Optional"
          />
        </Field>
      </Section>

      {/* SAFEGUARDING & DBS */}
      <Section title="4. Safeguarding & DBS">
        <p className="text-sm text-brand-dark/70 mb-1">
          Optional — helps us match you to the right role. Most volunteers
          don&rsquo;t have these, and that&rsquo;s completely fine.
        </p>

        <Field label="Do you have a valid DBS check?">
          <YesNoRadio
            name="hasDbs"
            value={form.hasDbs}
            onChange={(v) => {
              update("hasDbs", v);
              if (v !== "yes") update("dbsLevel", "");
            }}
          />
        </Field>

        {form.hasDbs === "yes" && (
          <Field label="What level?" required>
            <select
              value={form.dbsLevel}
              onChange={(e) =>
                update("dbsLevel", e.target.value as DbsLevel | "")
              }
              className="w-full h-10 px-3 py-2 border border-brand-blue/15 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              required
            >
              <option value="">Choose…</option>
              {DBS_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Have you completed safeguarding training?">
          <YesNoRadio
            name="hasSafeguardingTraining"
            value={form.hasSafeguardingTraining}
            onChange={(v) => {
              update("hasSafeguardingTraining", v);
              if (v !== "yes") update("safeguardingTrainingNotes", "");
            }}
          />
        </Field>

        {form.hasSafeguardingTraining === "yes" && (
          <Field label="Provider & date (optional)">
            <Input
              value={form.safeguardingTrainingNotes}
              onChange={(e) =>
                update("safeguardingTrainingNotes", e.target.value)
              }
              placeholder="e.g. Kent Safeguarding Board · Mar 2025"
            />
          </Field>
        )}
      </Section>

      {/* PARENTAL CONSENT (conditional) */}
      {isMinor && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 md:p-8 space-y-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-6 w-6 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-heading font-bold text-lg text-amber-900 mb-1">
                5. Parental / guardian consent
              </h3>
              <p className="text-sm text-amber-900/85">
                You&rsquo;ve told us you&rsquo;re under 18. We&rsquo;d love to
                have you — we just need your parent or guardian to confirm.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Parent/guardian full name" required>
              <Input
                value={form.parentName}
                onChange={(e) => update("parentName", e.target.value)}
                required={isMinor}
              />
            </Field>
            <Field label="Relationship" required>
              <select
                value={form.parentRelationship}
                onChange={(e) =>
                  update(
                    "parentRelationship",
                    e.target.value as RelationshipChoice,
                  )
                }
                className="w-full h-10 px-3 py-2 border border-brand-blue/15 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                required={isMinor}
              >
                <option value="">Choose…</option>
                <option value="Parent">Parent</option>
                <option value="Guardian">Guardian</option>
                <option value="Other">Other</option>
              </select>
            </Field>
            {form.parentRelationship === "Other" && (
              <Field label="Please specify" required>
                <Input
                  value={form.parentRelationshipOther}
                  onChange={(e) =>
                    update("parentRelationshipOther", e.target.value)
                  }
                  placeholder="e.g. Aunt, Grandparent"
                  required={isMinor}
                />
              </Field>
            )}
            <Field label="Parent/guardian phone" required>
              <Input
                type="tel"
                value={form.parentPhone}
                onChange={(e) => update("parentPhone", e.target.value)}
                required={isMinor}
              />
            </Field>
            <Field label="Parent/guardian email" required>
              <Input
                type="email"
                value={form.parentEmail}
                onChange={(e) => update("parentEmail", e.target.value)}
                required={isMinor}
              />
            </Field>
          </div>

          <CheckboxRow
            checked={form.parentalConsentConfirmed}
            onChange={(v) => update("parentalConsentConfirmed", v)}
            label="I confirm my parent/guardian has read the volunteer info and consents to me taking part. We may contact them to verify before the day."
          />
        </div>
      )}

      {/* EMERGENCY */}
      <Section title={`${isMinor ? "6" : "5"}. Emergency contact`}>
        <p className="text-sm text-brand-dark/70 mb-3">
          We ask all volunteers for an emergency contact. Standard safeguarding
          and only used if needed on the day.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Emergency contact name" required>
            <Input
              value={form.emergencyContactName}
              onChange={(e) =>
                update("emergencyContactName", e.target.value)
              }
              required
            />
          </Field>
          <Field label="Emergency contact phone" required>
            <Input
              type="tel"
              value={form.emergencyContactPhone}
              onChange={(e) =>
                update("emergencyContactPhone", e.target.value)
              }
              required
            />
          </Field>
        </div>
      </Section>

      {/* SUBMIT */}
      <Section title={`${isMinor ? "7" : "6"}. Submit`}>
        <CheckboxRow
          checked={form.consent}
          onChange={(v) => update("consent", v)}
          label="I'm happy to be contacted about my role and the festival, and I confirm the information above is correct."
        />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 text-red-800 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Button
            type="submit"
            size="lg"
            variant="secondary"
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting…
              </>
            ) : (
              "Submit application"
            )}
          </Button>
        </div>
      </Section>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 border border-brand-blue/10 space-y-4">
      <h3 className="font-heading font-bold text-lg text-brand-dark mb-2">
        {title}
      </h3>
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

function YesNoRadio({
  name,
  value,
  onChange,
}: {
  name: string;
  value: YesNo;
  onChange: (v: YesNo) => void;
}) {
  return (
    <div className="flex gap-2">
      {(["yes", "no"] as const).map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(active ? "" : opt)}
            className={[
              "px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest border-2 transition-all",
              active
                ? "bg-brand-blue text-white border-brand-blue"
                : "bg-white text-brand-dark border-brand-blue/15 hover:border-brand-blue",
            ].join(" ")}
            aria-pressed={active}
            aria-label={`${name} ${opt}`}
          >
            {opt === "yes" ? "Yes" : "No"}
          </button>
        );
      })}
    </div>
  );
}

function ReceivedState() {
  return (
    <div className="bg-white rounded-2xl p-10 text-center border border-brand-green/30">
      <CheckCircle2 className="h-12 w-12 text-brand-green mx-auto mb-4" />
      <h2 className="font-heading font-black text-2xl text-brand-dark mb-3">
        You&rsquo;re on the team
      </h2>
      <p className="text-brand-dark/70 mb-2 max-w-md mx-auto">
        Thanks for putting your hand up. We&rsquo;ll come back to you with a
        role and shift within 5 working days.
      </p>
      <p className="text-sm text-brand-dark/60">
        A confirmation email is on its way.
      </p>
    </div>
  );
}
