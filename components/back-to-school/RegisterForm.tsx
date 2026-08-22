"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  B2S,
  UNIFORM_SIZES,
  CHILD_SEX_OPTIONS,
  NEED_OPTIONS,
  UNIFORM_COLOURS,
  BOTTOM_TYPES,
  POLO_COLOURS,
  SLEEVE_OPTIONS,
  type UniformSize,
  type ChildSex,
  type NeedCategory,
  type UniformColour,
  type BottomType,
  type PoloColour,
  type SleeveLength,
} from "@/lib/back-to-school";

interface ChildForm {
  key: string;
  name: string;
  age: string; // stored as string in the input; validated to int on submit
  uniformSize: UniformSize | "";
  sex: ChildSex | "";
  school: string;
  needs: NeedCategory[];
  notes: string;
  // Uniform choices — only used when needs includes "uniform"
  bottomType: BottomType | "";
  bottomColour: UniformColour | "";
  wantsPolo: boolean;
  poloColour: PoloColour | "";
  poloSleeve: SleeveLength | "";
  wantsShirt: boolean;
  shirtSleeve: SleeveLength | "";
}

interface FormState {
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  postcode: string;
  children: ChildForm[];
  disclaimersAccepted: boolean;
}

function newChild(): ChildForm {
  return {
    key: crypto.randomUUID(),
    name: "",
    age: "",
    uniformSize: "",
    sex: "",
    school: "",
    needs: [],
    notes: "",
    bottomType: "",
    bottomColour: "",
    wantsPolo: false,
    poloColour: "",
    poloSleeve: "",
    wantsShirt: false,
    shirtSleeve: "",
  };
}

const initial: FormState = {
  parentName: "",
  parentEmail: "",
  parentPhone: "",
  postcode: "",
  children: [newChild()],
  disclaimersAccepted: false,
};

interface WalkInResult {
  qrToken: string | null;
  registrationId: string;
  parentName: string;
  registeredAt: string;
}

interface RegisterFormProps {
  // Enables walk-in mode. When set:
  //  - form POSTs walkIn+walkInKey to /api/back-to-school/register
  //  - intro copy changes (no "we'll email you Friday" language)
  //  - success screen shows a walk-in ticket with QR
  walkInKey?: string;
  // Optional steward token — present when Station 1 volunteer opens the
  // walk-in URL with ?s=<token> to register a family for someone without
  // a phone. Unlocks the Print ticket button on the success screen.
  stewardToken?: string;
}

export function RegisterForm({ walkInKey, stewardToken }: RegisterFormProps = {}) {
  const router = useRouter();
  const isWalkIn = Boolean(walkInKey);
  const [form, setForm] = React.useState<FormState>(initial);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [walkInResult, setWalkInResult] = React.useState<WalkInResult | null>(
    null,
  );

  // Whenever we flip into the success state, jump to the top so the ticket
  // is immediately visible — the form is tall and the button that flips
  // this is at the very bottom.
  React.useEffect(() => {
    if (success) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [success]);

  // Resets the form back to blank so a Station 1 volunteer can enter the
  // next family without a page reload. Also clears the success flag so the
  // form re-renders.
  function registerAnother() {
    setForm(initial);
    setError(null);
    setWalkInResult(null);
    setSuccess(false);
  }

  function updateParent<K extends "parentName" | "parentEmail" | "parentPhone" | "postcode">(
    key: K,
    value: string,
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateChild(index: number, patch: Partial<ChildForm>) {
    setForm((f) => ({
      ...f,
      children: f.children.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    }));
  }

  function toggleNeed(index: number, need: NeedCategory) {
    setForm((f) => ({
      ...f,
      children: f.children.map((c, i) => {
        if (i !== index) return c;
        const has = c.needs.includes(need);
        return {
          ...c,
          needs: has ? c.needs.filter((n) => n !== need) : [...c.needs, need],
        };
      }),
    }));
  }

  function addChild() {
    setForm((f) => {
      if (f.children.length >= B2S.maxChildrenPerRegistration) return f;
      return { ...f, children: [...f.children, newChild()] };
    });
  }

  function removeChild(index: number) {
    setForm((f) => {
      if (f.children.length <= 1) return f;
      return { ...f, children: f.children.filter((_, i) => i !== index) };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (
      !form.parentName.trim() ||
      !form.parentEmail.trim() ||
      !form.parentPhone.trim() ||
      !form.postcode.trim()
    ) {
      setError("Please fill in your name, email, phone and postcode.");
      return;
    }

    for (let i = 0; i < form.children.length; i++) {
      const c = form.children[i];
      if (!c.name.trim()) {
        setError(`Please enter a name for child ${i + 1}.`);
        return;
      }
      const age = Number.parseInt(c.age, 10);
      if (
        !Number.isFinite(age) ||
        age < B2S.minChildAge ||
        age > B2S.maxChildAge
      ) {
        setError(
          `Age for ${c.name || `child ${i + 1}`} must be between ${B2S.minChildAge} and ${B2S.maxChildAge}.`,
        );
        return;
      }
      if (!c.uniformSize) {
        setError(`Please choose a uniform size for ${c.name}.`);
        return;
      }
      if (c.needs.length === 0) {
        setError(`Please tick at least one thing you need for ${c.name}.`);
        return;
      }
      // Uniform choices required if uniform is ticked
      if (c.needs.includes("uniform")) {
        if (!c.bottomType || !c.bottomColour) {
          setError(
            `Please choose a bottom garment (type + colour) for ${c.name}.`,
          );
          return;
        }
        if (c.wantsPolo && (!c.poloColour || !c.poloSleeve)) {
          setError(
            `Please choose polo colour and sleeve length for ${c.name}, or untick the polo option.`,
          );
          return;
        }
        if (c.wantsShirt && !c.shirtSleeve) {
          setError(
            `Please choose shirt sleeve length for ${c.name}, or untick the shirt option.`,
          );
          return;
        }
      }
    }

    if (!form.disclaimersAccepted) {
      setError("Please tick the box to confirm you've read the important info.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/back-to-school/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentName: form.parentName.trim(),
          parentEmail: form.parentEmail.trim(),
          parentPhone: form.parentPhone.trim(),
          postcode: form.postcode.trim().toUpperCase(),
          disclaimersAccepted: form.disclaimersAccepted,
          walkIn: isWalkIn,
          walkInKey: walkInKey ?? undefined,
          children: form.children.map((c) => ({
            name: c.name.trim(),
            age: Number.parseInt(c.age, 10),
            uniformSize: c.uniformSize,
            sex: c.sex || undefined,
            school: c.school.trim() || undefined,
            needs: c.needs,
            notes: c.notes.trim() || undefined,
            uniformChoices: c.needs.includes("uniform")
              ? {
                  bottom: {
                    type: c.bottomType,
                    colour: c.bottomColour,
                  },
                  polo: c.wantsPolo
                    ? { colour: c.poloColour, sleeve: c.poloSleeve }
                    : null,
                  shirt: c.wantsShirt ? { sleeve: c.shirtSleeve } : null,
                }
              : undefined,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      if (isWalkIn && data?.walkIn) {
        setWalkInResult({
          qrToken: data.walkIn.qrToken ?? null,
          registrationId: data.registrationId,
          parentName: data.walkIn.parentName ?? form.parentName.trim(),
          registeredAt: data.walkIn.registeredAt ?? new Date().toISOString(),
        });
      }
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  if (success && isWalkIn)
    return (
      <WalkInTicket
        result={walkInResult}
        stewardToken={stewardToken ?? null}
        onRegisterAnother={registerAnother}
      />
    );
  if (success) return <ReceivedState />;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* PARENT */}
      <Section title="1. About you">
        <p className="text-sm text-brand-dark/70 mb-3">
          {isWalkIn ? (
            <>
              We&rsquo;ll use these details to register you for today&rsquo;s
              walk-in queue. Come back to see us between{" "}
              <strong>3pm and 4pm</strong>.
            </>
          ) : (
            <>
              We&rsquo;ll use these details to send your approval email on{" "}
              <strong>{B2S.approvalEmailLabel}</strong>.
            </>
          )}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Your full name" required>
            <Input
              value={form.parentName}
              onChange={(e) => updateParent("parentName", e.target.value)}
              required
            />
          </Field>
          <Field label="Email" required>
            <Input
              type="email"
              value={form.parentEmail}
              onChange={(e) => updateParent("parentEmail", e.target.value)}
              required
            />
          </Field>
          <Field label="Phone" required>
            <Input
              type="tel"
              value={form.parentPhone}
              onChange={(e) => updateParent("parentPhone", e.target.value)}
              required
            />
          </Field>
          <Field label="Postcode" required>
            <Input
              value={form.postcode}
              onChange={(e) => updateParent("postcode", e.target.value)}
              placeholder="e.g. ME7 1LX"
              required
            />
          </Field>
        </div>
      </Section>

      {/* CHILDREN */}
      <Section title="2. Your children">
        <p className="text-sm text-brand-dark/70 mb-4">
          Add up to {B2S.maxChildrenPerRegistration} children ({B2S.minChildAge}–
          {B2S.maxChildAge} years old). Please give the uniform size you&rsquo;d
          like. This might be different from your child&rsquo;s actual age.
        </p>

        <div className="space-y-6">
          {form.children.map((c, i) => (
            <div
              key={c.key}
              className="bg-brand-pale/40 rounded-xl p-5 md:p-6 border border-brand-blue/10 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-bold text-brand-dark">
                  Child {i + 1}
                </h4>
                {form.children.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeChild(i)}
                    className="text-brand-dark/50 hover:text-red-600 transition-colors inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Child's name" required>
                  <Input
                    value={c.name}
                    onChange={(e) => updateChild(i, { name: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Age" required>
                  <select
                    value={c.age}
                    onChange={(e) => updateChild(i, { age: e.target.value })}
                    className="w-full h-10 px-3 py-2 border border-brand-blue/15 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    required
                  >
                    <option value="">Choose…</option>
                    {Array.from(
                      {
                        length: B2S.maxChildAge - B2S.minChildAge + 1,
                      },
                      (_, k) => B2S.minChildAge + k,
                    ).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Uniform size (by age)" required>
                  <select
                    value={c.uniformSize}
                    onChange={(e) =>
                      updateChild(i, {
                        uniformSize: e.target.value as UniformSize | "",
                      })
                    }
                    className="w-full h-10 px-3 py-2 border border-brand-blue/15 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    required
                  >
                    <option value="">Choose…</option>
                    {UNIFORM_SIZES.map((s) => (
                      <option key={s} value={s}>
                        Age {s}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Sex">
                  <select
                    value={c.sex}
                    onChange={(e) =>
                      updateChild(i, { sex: e.target.value as ChildSex | "" })
                    }
                    className="w-full h-10 px-3 py-2 border border-brand-blue/15 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    <option value="">Choose…</option>
                    {CHILD_SEX_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="School (optional)">
                  <Input
                    value={c.school}
                    onChange={(e) =>
                      updateChild(i, { school: e.target.value })
                    }
                    placeholder="Helps us match uniform colours"
                  />
                </Field>
              </div>

              <div>
                <Label className="block mb-2 text-sm font-heading font-semibold text-brand-dark">
                  What do you need?{" "}
                  <span className="text-brand-blue">*</span>
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {NEED_OPTIONS.map((n) => {
                    const isOn = c.needs.includes(n.value);
                    return (
                      <button
                        type="button"
                        key={n.value}
                        onClick={() => toggleNeed(i, n.value)}
                        className={[
                          "text-left p-3 rounded-lg border-2 transition-all",
                          isOn
                            ? "bg-brand-green text-white border-brand-green"
                            : "bg-white border-brand-blue/15 hover:border-brand-blue",
                        ].join(" ")}
                        aria-pressed={isOn}
                      >
                        <p className="font-heading font-bold text-sm">
                          {n.label}
                        </p>
                        <p
                          className={`text-[11px] ${isOn ? "text-white/85" : "text-brand-dark/60"}`}
                        >
                          {n.hint}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Uniform preferences — only when "uniform" is ticked */}
              {c.needs.includes("uniform") && (
                <div className="bg-white rounded-xl p-4 md:p-5 border border-brand-blue/10 space-y-4">
                  <div>
                    <p className="font-heading font-bold text-sm text-brand-dark mb-0.5">
                      Uniform preferences
                    </p>
                    <p className="text-xs text-brand-dark/60">
                      We stock uniforms in Grey, Black and Blue. Polos in
                      White or Blue. Shirts in White.
                    </p>
                  </div>

                  {/* Bottom garment */}
                  <div>
                    <Label className="block mb-2 text-sm font-heading font-semibold text-brand-dark">
                      Bottom garment{" "}
                      <span className="text-brand-blue">*</span>
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                      {BOTTOM_TYPES.map((b) => {
                        const isOn = c.bottomType === b.value;
                        return (
                          <button
                            type="button"
                            key={b.value}
                            onClick={() =>
                              updateChild(i, { bottomType: b.value })
                            }
                            aria-pressed={isOn}
                            className={[
                              "p-2.5 rounded-lg border-2 text-sm font-heading font-bold transition-all",
                              isOn
                                ? "bg-brand-blue text-white border-brand-blue"
                                : "bg-white border-brand-blue/15 hover:border-brand-blue text-brand-dark",
                            ].join(" ")}
                          >
                            {b.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {UNIFORM_COLOURS.map((col) => {
                        const isOn = c.bottomColour === col.value;
                        const swatch =
                          col.value === "grey"
                            ? "bg-gray-500"
                            : col.value === "black"
                              ? "bg-black"
                              : "bg-brand-blue";
                        return (
                          <button
                            type="button"
                            key={col.value}
                            onClick={() =>
                              updateChild(i, { bottomColour: col.value })
                            }
                            aria-pressed={isOn}
                            className={[
                              "p-2.5 rounded-lg border-2 text-sm font-heading font-bold transition-all inline-flex items-center justify-center gap-2",
                              isOn
                                ? "bg-brand-blue text-white border-brand-blue"
                                : "bg-white border-brand-blue/15 hover:border-brand-blue text-brand-dark",
                            ].join(" ")}
                          >
                            <span
                              className={`h-4 w-4 rounded-full border ${swatch} ${isOn ? "border-white/60" : "border-brand-dark/20"}`}
                            />
                            {col.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Polo (optional) */}
                  <div className="pt-2 border-t border-brand-blue/10">
                    <CheckboxRow
                      checked={c.wantsPolo}
                      onChange={(v) => {
                        updateChild(i, { wantsPolo: v });
                        if (!v) {
                          updateChild(i, { poloColour: "", poloSleeve: "" });
                        }
                      }}
                      label="Include a polo shirt"
                    />
                    {c.wantsPolo && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                        <Field label="Polo colour" required>
                          <div className="grid grid-cols-2 gap-2">
                            {POLO_COLOURS.map((col) => {
                              const isOn = c.poloColour === col.value;
                              const swatch =
                                col.value === "white"
                                  ? "bg-white border-brand-dark/30"
                                  : "bg-brand-blue border-brand-blue";
                              return (
                                <button
                                  type="button"
                                  key={col.value}
                                  onClick={() =>
                                    updateChild(i, { poloColour: col.value })
                                  }
                                  aria-pressed={isOn}
                                  className={[
                                    "p-2 rounded-lg border-2 text-sm font-heading font-bold transition-all inline-flex items-center justify-center gap-2",
                                    isOn
                                      ? "bg-brand-blue text-white border-brand-blue"
                                      : "bg-white border-brand-blue/15 hover:border-brand-blue text-brand-dark",
                                  ].join(" ")}
                                >
                                  <span
                                    className={`h-4 w-4 rounded-full border ${swatch}`}
                                  />
                                  {col.label}
                                </button>
                              );
                            })}
                          </div>
                        </Field>
                        <Field label="Sleeve length" required>
                          <div className="grid grid-cols-2 gap-2">
                            {SLEEVE_OPTIONS.map((s) => {
                              const isOn = c.poloSleeve === s.value;
                              return (
                                <button
                                  type="button"
                                  key={s.value}
                                  onClick={() =>
                                    updateChild(i, { poloSleeve: s.value })
                                  }
                                  aria-pressed={isOn}
                                  className={[
                                    "p-2 rounded-lg border-2 text-sm font-heading font-bold transition-all",
                                    isOn
                                      ? "bg-brand-blue text-white border-brand-blue"
                                      : "bg-white border-brand-blue/15 hover:border-brand-blue text-brand-dark",
                                  ].join(" ")}
                                >
                                  {s.label}
                                </button>
                              );
                            })}
                          </div>
                        </Field>
                      </div>
                    )}
                  </div>

                  {/* Shirt (optional) */}
                  <div className="pt-2 border-t border-brand-blue/10">
                    <CheckboxRow
                      checked={c.wantsShirt}
                      onChange={(v) => {
                        updateChild(i, { wantsShirt: v });
                        if (!v) updateChild(i, { shirtSleeve: "" });
                      }}
                      label="Include a white school shirt"
                    />
                    {c.wantsShirt && (
                      <div className="mt-3 max-w-sm">
                        <Field label="Sleeve length" required>
                          <div className="grid grid-cols-2 gap-2">
                            {SLEEVE_OPTIONS.map((s) => {
                              const isOn = c.shirtSleeve === s.value;
                              return (
                                <button
                                  type="button"
                                  key={s.value}
                                  onClick={() =>
                                    updateChild(i, { shirtSleeve: s.value })
                                  }
                                  aria-pressed={isOn}
                                  className={[
                                    "p-2 rounded-lg border-2 text-sm font-heading font-bold transition-all",
                                    isOn
                                      ? "bg-brand-blue text-white border-brand-blue"
                                      : "bg-white border-brand-blue/15 hover:border-brand-blue text-brand-dark",
                                  ].join(" ")}
                                >
                                  {s.label}
                                </button>
                              );
                            })}
                          </div>
                        </Field>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Field label="Anything else? (optional)">
                <Textarea
                  rows={2}
                  value={c.notes}
                  onChange={(e) => updateChild(i, { notes: e.target.value })}
                  placeholder="e.g. specific colour school requires, additional needs"
                />
              </Field>
            </div>
          ))}
        </div>

        {form.children.length < B2S.maxChildrenPerRegistration && (
          <button
            type="button"
            onClick={addChild}
            className="mt-4 inline-flex items-center gap-2 font-heading font-bold text-sm uppercase tracking-widest text-brand-blue hover:text-brand-dark transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add another child
          </button>
        )}
      </Section>

      {/* DISCLAIMERS */}
      <div className="bg-brand-pale/50 border-2 border-brand-blue/25 rounded-2xl p-6 md:p-8 space-y-4">
        <h3 className="font-heading font-bold text-lg text-brand-blue mb-1">
          3. Important: please read
        </h3>
        <ul className="text-sm text-brand-dark/80 space-y-2 list-disc pl-5">
          <li>
            Registration <strong>does not guarantee supplies.</strong> Stock is
            limited. It&rsquo;s first come, first served on the day, so please
            arrive early.
          </li>
          <li>
            We stock uniforms across a range of ages, but we may not have every
            requested size or item on the day.
          </li>
          <li>
            You&rsquo;ll get an approval email on{" "}
            <strong>{B2S.approvalEmailLabel}</strong> with a QR code. Please
            bring it (printed or on your phone).
          </li>
          <li>
            Your details are used only for this campaign and safeguarding
            follow-up. See our privacy policy.
          </li>
        </ul>

        <CheckboxRow
          checked={form.disclaimersAccepted}
          onChange={(v) =>
            setForm((f) => ({ ...f, disclaimersAccepted: v }))
          }
          label="I've read and understood the above, and I confirm the information I've given is correct."
        />
      </div>

      {/* SUBMIT */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-brand-blue/10 space-y-4">
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
              "Register my children"
            )}
          </Button>
          <p className="text-xs text-brand-dark/60">
            Registration closes {B2S.registrationDeadlineLabel}
          </p>
        </div>
      </div>
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

function ReceivedState() {
  return (
    <div className="bg-white rounded-2xl p-10 text-center border border-brand-green/30">
      <CheckCircle2 className="h-12 w-12 text-brand-green mx-auto mb-4" />
      <h2 className="font-heading font-black text-2xl text-brand-dark mb-3">
        Your registration is in
      </h2>
      <p className="text-brand-dark/70 mb-2 max-w-md mx-auto">
        Thanks, we&rsquo;ve sent you a confirmation email. You&rsquo;ll hear
        back from us on <strong>{B2S.approvalEmailLabel}</strong> with your
        approval and QR code.
      </p>
      <p className="text-sm text-brand-dark/60">
        Come see us at {B2S.venueName}, {B2S.venueArea} on {B2S.dateLabel},{" "}
        {B2S.timeLabel}.
      </p>
    </div>
  );
}

function WalkInTicket({
  result,
  stewardToken,
  onRegisterAnother,
}: {
  result: WalkInResult | null;
  stewardToken: string | null;
  onRegisterAnother: () => void;
}) {
  const [qrSrc, setQrSrc] = React.useState<string | null>(null);
  const assistedMode = Boolean(stewardToken);

  React.useEffect(() => {
    if (!result?.qrToken) return;
    let cancelled = false;
    // Dynamically import so the qrcode dependency doesn't ship with the
    // form until the walk-in success screen is actually shown.
    import("qrcode").then((QRCode) => {
      const url = `${window.location.origin}/b2s/verify/${result.qrToken}`;
      QRCode.toDataURL(url, {
        width: 480,
        margin: 1,
        errorCorrectionLevel: "M",
        color: { dark: "#1E1E1E", light: "#FFFFFF" },
      }).then((src: string) => {
        if (!cancelled) setQrSrc(src);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [result?.qrToken]);

  const shortCode = (result?.registrationId ?? "").slice(0, 8).toUpperCase();
  const registeredAt = result
    ? new Date(result.registeredAt).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="bg-white rounded-2xl p-8 md:p-10 border-2 border-brand-blue text-center">
      <CheckCircle2 className="h-10 w-10 text-brand-green mx-auto mb-3" />
      <p className="text-xs font-heading font-bold text-brand-blue uppercase tracking-widest">
        Walk-in ticket
      </p>
      <h2 className="font-heading font-black text-2xl md:text-3xl text-brand-dark mt-2 mb-1">
        You&rsquo;re on the list, {result?.parentName ?? "friend"}
      </h2>
      <p className="text-sm text-brand-dark/70 max-w-md mx-auto mb-6">
        Come back to {B2S.venueName}, {B2S.venueArea} between{" "}
        <strong>3pm and 4pm</strong> today. Show this screen (or tell us your
        name and email) at the door.
      </p>

      {qrSrc && (
        <div className="inline-block bg-white p-3 rounded-xl border border-gray-200 mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrSrc}
            alt="Walk-in QR code"
            className="w-56 h-56 mx-auto"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto mb-6">
        <div className="bg-brand-pale/40 rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-widest text-brand-blue font-heading font-bold">
            Reference
          </p>
          <p className="font-heading font-bold text-brand-dark text-sm mt-1 break-all">
            {shortCode}
          </p>
        </div>
        <div className="bg-brand-pale/40 rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-widest text-brand-blue font-heading font-bold">
            Registered
          </p>
          <p className="font-heading font-bold text-brand-dark text-sm mt-1">
            {registeredAt}
          </p>
        </div>
      </div>

      <div className="text-xs text-brand-dark/60 space-y-1 max-w-md mx-auto">
        <p>
          Walk-ins are served <strong>first-come, first-served</strong> from
          whatever stock we have left after 3pm. Nothing is guaranteed.
        </p>
        {!assistedMode && (
          <p>
            Please keep this screen open (or take a screenshot) so we can find
            you quickly at the door.
          </p>
        )}
      </div>

      {/* Station 1 assisted-mode controls — only when a steward token was
          in the URL, i.e. a volunteer is filling this in for the family. */}
      {assistedMode && (
        <div className="mt-6 flex flex-wrap justify-center gap-2 border-t border-brand-blue/20 pt-4">
          {result?.qrToken && stewardToken && (
            <a
              href={`/b2s/prep/${encodeURIComponent(result.qrToken)}?s=${encodeURIComponent(stewardToken)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-brand-blue text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark"
            >
              Prep &amp; print
            </a>
          )}
          <button
            type="button"
            onClick={onRegisterAnother}
            className="inline-flex items-center gap-1.5 bg-brand-green text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark"
          >
            Register another family
          </button>
        </div>
      )}
    </div>
  );
}
