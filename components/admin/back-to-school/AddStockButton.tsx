"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import {
  STOCK_SIZES,
  CATEGORY_LABELS,
  COLOUR_LABELS,
  FIT_LABELS,
  type StockCategory,
  type StockColour,
  type StockFit,
} from "@/lib/back-to-school-stock";

const CATEGORIES: StockCategory[] = [
  "polo",
  "shirt",
  "trousers",
  "skirt",
  "dress",
  "shorts",
];
const COLOURS: StockColour[] = ["white", "blue", "grey", "black"];
const FITS: StockFit[] = ["boys", "girls", "unisex"];
const REASONS = [
  { value: "donation", label: "Donation" },
  { value: "purchase", label: "Purchased" },
  { value: "adjustment", label: "Adjustment" },
  { value: "correction", label: "Correction" },
];

const CATEGORIES_WITH_SLEEVE: StockCategory[] = ["polo", "shirt"];

export function AddStockButton() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [category, setCategory] = React.useState<StockCategory>("polo");
  const [colour, setColour] = React.useState<StockColour>("white");
  const [sleeve, setSleeve] = React.useState<"short" | "long" | "">("short");
  const [fit, setFit] = React.useState<StockFit>("boys");
  const [size, setSize] = React.useState<string>(STOCK_SIZES[0]);
  const [qty, setQty] = React.useState<number>(1);
  const [reason, setReason] = React.useState<string>("donation");
  const [notes, setNotes] = React.useState("");

  const showSleeve = CATEGORIES_WITH_SLEEVE.includes(category);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!Number.isFinite(qty) || qty < 1) {
      setError("Quantity must be at least 1.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/back-to-school/stock/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          colour,
          sleeve: showSleeve ? sleeve || null : null,
          fit,
          size,
          delta: Math.round(qty),
          reason,
          notes: notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setOpen(false);
      setQty(1);
      setNotes("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 bg-brand-blue text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark"
      >
        <Plus className="h-4 w-4" />
        Add stock
      </button>

      <BottomSheet
        open={open}
        onClose={() => !busy && setOpen(false)}
        title="Add stock"
        labelledBy="add-stock-sheet-title"
      >
        <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Category">
                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as StockCategory)
                    }
                    className="w-full border border-gray-200 rounded-md px-2 py-2 text-sm"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Colour">
                  <select
                    value={colour}
                    onChange={(e) => setColour(e.target.value as StockColour)}
                    className="w-full border border-gray-200 rounded-md px-2 py-2 text-sm"
                  >
                    {COLOURS.map((c) => (
                      <option key={c} value={c}>
                        {COLOUR_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </Field>
                {showSleeve && (
                  <Field label="Sleeve">
                    <select
                      value={sleeve}
                      onChange={(e) =>
                        setSleeve(e.target.value as "short" | "long" | "")
                      }
                      className="w-full border border-gray-200 rounded-md px-2 py-2 text-sm"
                    >
                      <option value="short">Short sleeve</option>
                      <option value="long">Long sleeve</option>
                    </select>
                  </Field>
                )}
                <Field label="Fit">
                  <select
                    value={fit}
                    onChange={(e) => setFit(e.target.value as StockFit)}
                    className="w-full border border-gray-200 rounded-md px-2 py-2 text-sm"
                  >
                    {FITS.map((f) => (
                      <option key={f} value={f}>
                        {FIT_LABELS[f]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Size">
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-2 py-2 text-sm"
                  >
                    {STOCK_SIZES.map((s) => (
                      <option key={s} value={s}>
                        Age {s}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Quantity">
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-md px-2 py-2 text-sm"
                  />
                </Field>
                <Field label="Reason">
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-2 py-2 text-sm"
                  >
                    {REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Note (optional)">
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. donation from local church"
                  className="w-full border border-gray-200 rounded-md px-2 py-2 text-sm"
                />
              </Field>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={busy}
                  className="flex-1 bg-white text-brand-dark border border-gray-200 px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 bg-brand-blue text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add {qty > 0 ? qty : ""} to stock
                </button>
              </div>
            </form>
      </BottomSheet>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
