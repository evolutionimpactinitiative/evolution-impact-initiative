"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SUPPLY_PLEDGE_ITEMS, B2S } from "@/lib/back-to-school";

type DeliveryMethod = "drop_off" | "collection" | "";

interface PledgeItem {
  key: string;
  item: string;
  customItem: string;
  size: string;
  qty: string;
}

interface FormState {
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  deliveryMethod: DeliveryMethod;
  collectionAddress: string;
  collectionPostcode: string;
  preferredWindow: string;
  notes: string;
  items: PledgeItem[];
  consent: boolean;
}

function newItem(): PledgeItem {
  return {
    key: crypto.randomUUID(),
    item: "",
    customItem: "",
    size: "",
    qty: "1",
  };
}

const initial: FormState = {
  donorName: "",
  donorEmail: "",
  donorPhone: "",
  deliveryMethod: "",
  collectionAddress: "",
  collectionPostcode: "",
  preferredWindow: "",
  notes: "",
  items: [newItem()],
  consent: false,
};

export function SupplyPledgeForm() {
  const router = useRouter();
  const [form, setForm] = React.useState<FormState>(initial);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateItem(index: number, patch: Partial<PledgeItem>) {
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    }));
  }

  function addItem() {
    setForm((f) => ({ ...f, items: [...f.items, newItem()] }));
  }

  function removeItem(index: number) {
    setForm((f) => {
      if (f.items.length <= 1) return f;
      return { ...f, items: f.items.filter((_, i) => i !== index) };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (
      !form.donorName.trim() ||
      !form.donorEmail.trim() ||
      !form.donorPhone.trim()
    ) {
      setError("Please fill in your name, email and phone.");
      return;
    }

    if (!form.deliveryMethod) {
      setError("Please choose drop-off or collection.");
      return;
    }

    if (form.deliveryMethod === "collection") {
      if (!form.collectionAddress.trim() || !form.collectionPostcode.trim()) {
        setError(
          "Please give us your collection address and postcode. We cover Medway and surrounding areas.",
        );
        return;
      }
    }

    if (form.items.length === 0) {
      setError("Please add at least one item you'd like to pledge.");
      return;
    }
    for (let i = 0; i < form.items.length; i++) {
      const it = form.items[i];
      const label = it.item === "Other" ? it.customItem.trim() : it.item.trim();
      if (!label) {
        setError(`Please choose or name item ${i + 1}.`);
        return;
      }
      const q = Number.parseInt(it.qty, 10);
      if (!Number.isFinite(q) || q < 1 || q > 500) {
        setError(`Quantity for "${label}" must be between 1 and 500.`);
        return;
      }
    }

    if (!form.consent) {
      setError("Please tick the box to confirm the items are brand new.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/back-to-school/supply-pledges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorName: form.donorName.trim(),
          donorEmail: form.donorEmail.trim(),
          donorPhone: form.donorPhone.trim(),
          deliveryMethod: form.deliveryMethod,
          collectionAddress:
            form.deliveryMethod === "collection"
              ? form.collectionAddress.trim()
              : undefined,
          collectionPostcode:
            form.deliveryMethod === "collection"
              ? form.collectionPostcode.trim().toUpperCase()
              : undefined,
          preferredWindow: form.preferredWindow.trim() || undefined,
          notes: form.notes.trim() || undefined,
          items: form.items.map((it) => ({
            item: it.item === "Other" ? it.customItem.trim() : it.item.trim(),
            size: it.size.trim() || null,
            qty: Number.parseInt(it.qty, 10),
          })),
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
      {/* DONOR */}
      <Section title="1. About you">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Your full name" required>
            <Input
              value={form.donorName}
              onChange={(e) => update("donorName", e.target.value)}
              required
            />
          </Field>
          <Field label="Email" required>
            <Input
              type="email"
              value={form.donorEmail}
              onChange={(e) => update("donorEmail", e.target.value)}
              required
            />
          </Field>
          <Field label="Phone" required>
            <Input
              type="tel"
              value={form.donorPhone}
              onChange={(e) => update("donorPhone", e.target.value)}
              required
            />
          </Field>
        </div>
      </Section>

      {/* ITEMS */}
      <Section title="2. What are you pledging?">
        <p className="text-sm text-brand-dark/70 mb-3">
          All items must be <strong>brand new</strong>. Uniform sizes range from
          age {B2S.minChildAge} to {B2S.maxChildAge}.
        </p>

        <div className="space-y-3">
          {form.items.map((it, i) => (
            <div
              key={it.key}
              className="bg-brand-pale/40 rounded-xl p-4 border border-brand-blue/10 space-y-3"
            >
              <div className="flex items-center justify-between">
                <p className="font-heading font-bold text-sm text-brand-dark">
                  Item {i + 1}
                </p>
                {form.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="text-brand-dark/50 hover:text-red-600 transition-colors inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_100px] gap-3">
                <Field label="Item" required>
                  <select
                    value={it.item}
                    onChange={(e) => updateItem(i, { item: e.target.value })}
                    className="w-full h-10 px-3 py-2 border border-brand-blue/15 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    required
                  >
                    <option value="">Choose…</option>
                    {SUPPLY_PLEDGE_ITEMS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                    <option value="Other">Other…</option>
                  </select>
                </Field>
                <Field label="Size / age (optional)">
                  <Input
                    value={it.size}
                    onChange={(e) => updateItem(i, { size: e.target.value })}
                    placeholder="e.g. Age 7–8, M"
                  />
                </Field>
                <Field label="Qty" required>
                  <Input
                    type="number"
                    min={1}
                    max={500}
                    value={it.qty}
                    onChange={(e) => updateItem(i, { qty: e.target.value })}
                    required
                  />
                </Field>
              </div>

              {it.item === "Other" && (
                <Field label="What is it?" required>
                  <Input
                    value={it.customItem}
                    onChange={(e) =>
                      updateItem(i, { customItem: e.target.value })
                    }
                    placeholder="Describe the item"
                    required
                  />
                </Field>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addItem}
          className="mt-4 inline-flex items-center gap-2 font-heading font-bold text-sm uppercase tracking-widest text-brand-blue hover:text-brand-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add another item
        </button>
      </Section>

      {/* DELIVERY */}
      <Section title="3. How would you like to get them to us?">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(
            [
              {
                key: "drop_off",
                label: "I'll drop them off",
                hint: "We'll send you our drop-off details.",
              },
              {
                key: "collection",
                label: "Please collect from me",
                hint: "Medway & surrounding areas only.",
              },
            ] as const
          ).map((o) => {
            const isOn = form.deliveryMethod === o.key;
            return (
              <button
                type="button"
                key={o.key}
                onClick={() => update("deliveryMethod", o.key)}
                className={[
                  "text-left p-4 rounded-xl border-2 transition-all",
                  isOn
                    ? "bg-brand-green text-white border-brand-green"
                    : "bg-white border-brand-blue/15 hover:border-brand-blue",
                ].join(" ")}
                aria-pressed={isOn}
              >
                <p className="font-heading font-bold text-base mb-1">
                  {o.label}
                </p>
                <p
                  className={`text-xs ${isOn ? "text-white/85" : "text-brand-dark/60"}`}
                >
                  {o.hint}
                </p>
              </button>
            );
          })}
        </div>

        {form.deliveryMethod === "collection" && (
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4 mt-4">
            <Field label="Collection address" required>
              <Input
                value={form.collectionAddress}
                onChange={(e) =>
                  update("collectionAddress", e.target.value)
                }
                placeholder="Street address, town"
                required
              />
            </Field>
            <Field label="Postcode" required>
              <Input
                value={form.collectionPostcode}
                onChange={(e) =>
                  update("collectionPostcode", e.target.value)
                }
                placeholder="e.g. ME7 1LX"
                required
              />
            </Field>
          </div>
        )}

        <Field label="Preferred day / time (optional)">
          <Input
            value={form.preferredWindow}
            onChange={(e) => update("preferredWindow", e.target.value)}
            placeholder="e.g. weekday evenings, Saturday morning"
          />
        </Field>

        <Field label="Anything else? (optional)">
          <Textarea
            rows={2}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Access notes, special requests, etc."
          />
        </Field>
      </Section>

      {/* SUBMIT */}
      <Section title="4. Confirm & submit">
        <CheckboxRow
          checked={form.consent}
          onChange={(v) => update("consent", v)}
          label="I confirm all pledged items are brand new. I'm happy to be contacted by the team to arrange drop-off or collection."
        />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 text-red-800 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

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
            "Submit pledge"
          )}
        </Button>
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

function ReceivedState() {
  return (
    <div className="bg-white rounded-2xl p-10 text-center border border-brand-green/30">
      <CheckCircle2 className="h-12 w-12 text-brand-green mx-auto mb-4" />
      <h2 className="font-heading font-black text-2xl text-brand-dark mb-3">
        Thank you.
      </h2>
      <p className="text-brand-dark/70 mb-2 max-w-md mx-auto">
        We&rsquo;ve got your pledge and a confirmation is on its way. Our team
        will be in touch to arrange drop-off or collection.
      </p>
    </div>
  );
}
