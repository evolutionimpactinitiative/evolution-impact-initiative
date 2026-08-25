"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  Loader2,
  Plus,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import {
  COLLECTION,
  COLLECTION_SLOTS,
  slotIso,
  slotLabel,
  type CollectionSlot,
} from "@/lib/back-to-school/collection";
import type {
  UniformSize,
  ChildSex,
} from "@/lib/back-to-school";
import type {
  StockCategory,
  StockColour,
  StockFit,
  StockSleeve,
} from "@/lib/back-to-school-stock";

// A single SKU with its remaining free stock — computed on the server
// (allocations + prior reservations already applied). Only shown to
// the parent if freeStock > 0.
export interface AvailableCell {
  category: StockCategory;
  colour: StockColour;
  sleeve: StockSleeve;
  fit: StockFit;
  size: string;
  freeStock: number;
}

interface Props {
  availableCells: AvailableCell[];
  slotCounts: Record<string, number>;
}

interface Child {
  child_name: string;
  child_age: string;             // string to keep the input controlled
  sex: ChildSex | "";
  school: string;
  uniform_size: UniformSize | "";
  notes: string;
  // Per-item picks — either the SKU chosen, or "skip" (null)
  shirt: SkuPick | null;
  polo: SkuPick | null;
  bottom: SkuPick | null;        // bottom.type = trousers|skirt|dress|shorts
  stationery: boolean;
}

interface SkuPick {
  category: StockCategory;
  colour: StockColour;
  sleeve: StockSleeve;
  size: string;
}

function newChild(): Child {
  return {
    child_name: "",
    child_age: "",
    sex: "",
    school: "",
    uniform_size: "",
    notes: "",
    shirt: null,
    polo: null,
    bottom: null,
    stationery: false,
  };
}

const COLOUR_LABEL: Record<string, string> = {
  white: "White",
  blue: "Blue",
  grey: "Grey",
  black: "Black",
};

const SLEEVE_LABEL: Record<string, string> = {
  short: "Short sleeve",
  long: "Long sleeve",
};

const BOTTOM_TYPE_LABEL: Record<string, string> = {
  trousers: "Trousers",
  skirt: "Skirt",
  dress: "Dress",
  shorts: "Shorts",
};

const GIRLS_BOTTOM_TYPES: StockCategory[] = ["skirt", "dress", "trousers"];
const BOYS_BOTTOM_TYPES: StockCategory[] = ["trousers", "shorts"];

function fitForSex(sex: ChildSex | ""): StockFit | null {
  if (sex === "male") return "boys";
  if (sex === "female") return "girls";
  return null;
}

export function CollectionRegisterForm({
  availableCells,
  slotCounts,
}: Props) {
  const router = useRouter();
  const [parentName, setParentName] = React.useState("");
  const [parentEmail, setParentEmail] = React.useState("");
  const [parentPhone, setParentPhone] = React.useState("");
  const [parentPostcode, setParentPostcode] = React.useState("");
  const [slot, setSlot] = React.useState<CollectionSlot | "">("");
  const [children, setChildren] = React.useState<Child[]>([newChild()]);
  const [website, setWebsite] = React.useState(""); // honeypot
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<{
    slot: string;
    qr: string;
  } | null>(null);

  function updateChild(idx: number, patch: Partial<Child>) {
    setChildren((cs) =>
      cs.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
    );
  }
  function addChild() {
    if (children.length >= COLLECTION.maxChildrenPerRegistration) return;
    setChildren((cs) => [...cs, newChild()]);
  }
  function removeChild(idx: number) {
    setChildren((cs) => cs.filter((_, i) => i !== idx));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    // Sanity check on the client — server re-validates.
    for (const c of children) {
      if (!c.child_name.trim()) {
        setError("Each child needs a name.");
        setBusy(false);
        return;
      }
      if (!c.child_age || !c.uniform_size) {
        setError("Each child needs an age and uniform size.");
        setBusy(false);
        return;
      }
    }
    if (!slot) {
      setError("Pick a collection slot.");
      setBusy(false);
      return;
    }

    const payload = {
      parent_name: parentName,
      parent_email: parentEmail,
      parent_phone: parentPhone,
      parent_postcode: parentPostcode,
      slot,
      website,
      children: children.map((c) => {
        // Build the uniform_choices payload loosely — the DB column is
        // JSONB, and the server-side stock check reads whatever shape
        // we send. The original RegisterForm's narrow types (white/blue
        // only, etc) don't map onto the wider collection-day picker.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const uc: any = {};
        if (c.shirt) uc.shirt = { sleeve: c.shirt.sleeve };
        if (c.polo) uc.polo = { colour: c.polo.colour, sleeve: c.polo.sleeve };
        if (c.bottom) {
          uc.bottom = { type: c.bottom.category, colour: c.bottom.colour };
        }
        const needs: string[] = [];
        if (c.shirt || c.polo || c.bottom) needs.push("uniform");
        if (c.stationery) needs.push("stationery");
        return {
          child_name: c.child_name,
          child_age: parseInt(c.child_age, 10),
          sex: c.sex || null,
          school: c.school,
          uniform_size: c.uniform_size,
          uniform_choices: uc,
          needs,
          notes: c.notes,
        };
      }),
    };

    try {
      const res = await fetch(
        "/api/back-to-school/collection/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Booking failed");
      setSuccess({
        slot: slotLabel(slot as CollectionSlot),
        qr: data.qrToken,
      });
      router.refresh(); // reflect the new slot count on any nav returns
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  if (success) {
    return (
      <div className="bg-white border border-emerald-200 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-600 text-white flex items-center justify-center mb-4">
          <Check className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-heading font-black text-brand-dark mb-2">
          Booking confirmed
        </h2>
        <p className="text-gray-700 mb-6">
          Your slot: <b>{success.slot}</b> on {COLLECTION.dateLabel}.
          <br />
          Confirmation email is on its way with a QR code + all the rules.
        </p>
        <Link
          href="/back-to-school/collection"
          className="inline-flex items-center gap-1.5 bg-brand-blue text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark"
        >
          Back to collection day
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Honeypot — hidden from real users */}
      <input
        type="text"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        style={{
          position: "absolute",
          left: "-10000px",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      />

      {/* Parent block */}
      <fieldset className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <legend className="px-2 text-sm font-heading font-bold uppercase tracking-widest text-brand-blue">
          You
        </legend>
        <Field label="Full name" required>
          <input
            type="text"
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
          />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Email" required>
            <input
              type="email"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Phone" required>
            <input
              type="tel"
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
            />
          </Field>
        </div>
        <Field label="Postcode">
          <input
            type="text"
            value={parentPostcode}
            onChange={(e) => setParentPostcode(e.target.value)}
            className="w-full max-w-xs border border-gray-200 rounded-md px-3 py-2 text-sm"
          />
        </Field>
      </fieldset>

      {/* Children */}
      {children.map((c, i) => (
        <ChildBlock
          key={i}
          idx={i}
          child={c}
          onChange={(patch) => updateChild(i, patch)}
          onRemove={children.length > 1 ? () => removeChild(i) : undefined}
          availableCells={availableCells}
        />
      ))}

      {children.length < COLLECTION.maxChildrenPerRegistration && (
        <button
          type="button"
          onClick={addChild}
          className="w-full inline-flex items-center justify-center gap-1.5 bg-white border-2 border-dashed border-gray-300 text-brand-dark px-4 py-3 rounded-2xl text-sm font-heading font-bold uppercase tracking-widest hover:border-brand-blue hover:text-brand-blue"
        >
          <Plus className="h-4 w-4" />
          Add another child
          <span className="text-xs text-gray-500 ml-1 normal-case">
            (up to {COLLECTION.maxChildrenPerRegistration})
          </span>
        </button>
      )}

      {/* Slot picker */}
      <fieldset className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <legend className="px-2 text-sm font-heading font-bold uppercase tracking-widest text-brand-blue">
          Pick your collection slot
        </legend>
        <p className="text-xs text-gray-600 -mt-2">
          20 parents per slot. Miss it and you&rsquo;ll need to come back
          between {COLLECTION.graceLabel}.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {COLLECTION_SLOTS.map((s) => {
            const iso = slotIso(s);
            const booked = slotCounts[iso] ?? 0;
            const remaining = Math.max(0, COLLECTION.slotCapacity - booked);
            const full = remaining === 0;
            const chosen = slot === s;
            return (
              <button
                key={s}
                type="button"
                disabled={full}
                onClick={() => setSlot(s)}
                className={`px-3 py-3 rounded-xl border-2 text-center ${
                  chosen
                    ? "bg-brand-blue text-white border-brand-blue"
                    : full
                      ? "bg-red-50 text-red-700 border-red-200 cursor-not-allowed"
                      : "bg-white text-brand-dark border-gray-200 hover:border-brand-blue"
                }`}
              >
                <p className="font-heading font-black text-lg leading-tight">
                  {slotLabel(s)}
                </p>
                <p
                  className={`text-[10px] uppercase tracking-widest font-heading font-bold mt-1 ${
                    chosen ? "text-white/80" : full ? "text-red-700" : "text-gray-500"
                  }`}
                >
                  {full ? "Full" : `${remaining} left`}
                </p>
              </button>
            );
          })}
        </div>
      </fieldset>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full inline-flex items-center justify-center gap-1.5 bg-brand-blue text-white px-4 py-3.5 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
        Reserve my slot
      </button>
      <p className="text-xs text-gray-500 text-center">
        By submitting you agree to the collection day rules on the{" "}
        <Link
          href="/back-to-school/collection"
          className="underline hover:text-brand-blue"
        >
          hub page
        </Link>
        .
      </p>
    </form>
  );
}

// ─── Child block ────────────────────────────────────────────────────

function ChildBlock({
  idx,
  child,
  onChange,
  onRemove,
  availableCells,
}: {
  idx: number;
  child: Child;
  onChange: (patch: Partial<Child>) => void;
  onRemove?: () => void;
  availableCells: AvailableCell[];
}) {
  const fit = fitForSex(child.sex);
  const size = child.uniform_size || null;

  // Filter helpers — only offer SKUs where freeStock > 0. Falls back
  // to "unisex" if the child's sex isn't set yet (so they see options
  // before picking).
  const cellsForItem = (category: StockCategory) => {
    return availableCells.filter(
      (c) =>
        c.category === category &&
        c.freeStock > 0 &&
        (!size || c.size === size) &&
        (!fit || c.fit === fit || c.fit === "unisex"),
    );
  };

  return (
    <fieldset className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
      <legend className="px-2 text-sm font-heading font-bold uppercase tracking-widest text-brand-blue">
        Child {idx + 1}
      </legend>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <UserIcon className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={child.child_name}
            onChange={(e) => onChange({ child_name: e.target.value })}
            placeholder="Child's name"
            required
            className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm"
          />
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-gray-400 hover:text-red-600 p-2"
            aria-label="Remove child"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Field label="Age" required>
          <input
            type="number"
            min={COLLECTION.minChildAge}
            max={COLLECTION.maxChildAge}
            value={child.child_age}
            onChange={(e) => onChange({ child_age: e.target.value })}
            required
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Sex" required>
          <select
            value={child.sex}
            onChange={(e) => onChange({ sex: e.target.value as ChildSex })}
            required
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
          >
            <option value="">—</option>
            <option value="male">Boy</option>
            <option value="female">Girl</option>
          </select>
        </Field>
        <Field label="Uniform size" required>
          <select
            value={child.uniform_size}
            onChange={(e) =>
              onChange({ uniform_size: e.target.value as UniformSize })
            }
            required
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
          >
            <option value="">—</option>
            {UNIFORM_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                Age {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="School">
          <input
            type="text"
            value={child.school}
            onChange={(e) => onChange({ school: e.target.value })}
            placeholder="e.g. Leigh Academy"
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
          />
        </Field>
      </div>

      {size && fit && (
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-600">
            Showing only what we have in stock for size <b>{size}</b>,{" "}
            {child.sex === "male" ? "boys" : "girls"}.
          </p>

          {/* Shirt */}
          <ItemPicker
            title="School shirt"
            hint="1 shirt max"
            cells={cellsForItem("shirt")}
            selected={child.shirt}
            onSelect={(pick) =>
              onChange({
                shirt: pick
                  ? { ...pick, category: "shirt" }
                  : null,
              })
            }
            axes={["colour", "sleeve"]}
          />

          {/* Polo */}
          <ItemPicker
            title="Polo shirt"
            hint="1 polo max"
            cells={cellsForItem("polo")}
            selected={child.polo}
            onSelect={(pick) =>
              onChange({
                polo: pick
                  ? { ...pick, category: "polo" }
                  : null,
              })
            }
            axes={["colour", "sleeve"]}
          />

          {/* Bottom */}
          <BottomPicker
            child={child}
            cellsForItem={cellsForItem}
            onSelect={(pick) => onChange({ bottom: pick })}
          />

          {/* Stationery */}
          <label className="flex items-start gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5">
            <input
              type="checkbox"
              checked={child.stationery}
              onChange={(e) => onChange({ stationery: e.target.checked })}
              className="h-4 w-4 mt-0.5"
            />
            <div>
              <p className="text-sm font-heading font-bold text-brand-dark">
                Stationery pack
              </p>
              <p className="text-xs text-gray-600">
                Subject to availability on the day — we&rsquo;ll add one if
                we&rsquo;ve got them.
              </p>
            </div>
          </label>

          <textarea
            value={child.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            rows={2}
            placeholder="Anything else we should know? (allergies, sensitivities, etc)"
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
          />
        </div>
      )}

      {(!size || !fit) && (
        <p className="text-xs text-gray-500 italic">
          Pick sex and size to see what uniform we have available.
        </p>
      )}
    </fieldset>
  );
}

// ─── Item picker (single-select from filtered cells) ────────────────

function ItemPicker({
  title,
  hint,
  cells,
  selected,
  onSelect,
  axes,
}: {
  title: string;
  hint: string;
  cells: AvailableCell[];
  selected: SkuPick | null;
  onSelect: (pick: SkuPick | null) => void;
  axes: Array<"colour" | "sleeve">;
}) {
  if (cells.length === 0) {
    return (
      <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 py-2.5">
        <p className="text-sm font-heading font-bold text-brand-dark">
          {title}
        </p>
        <p className="text-xs text-gray-600 mt-0.5">
          Sorry — none in stock for this size.
        </p>
      </div>
    );
  }
  const isSelected = (c: AvailableCell) =>
    selected &&
    selected.colour === c.colour &&
    (selected.sleeve ?? "") === (c.sleeve ?? "") &&
    selected.size === c.size;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-heading font-bold text-brand-dark">
          {title}{" "}
          <span className="text-xs font-normal text-gray-500">— {hint}</span>
        </p>
        {selected && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-xs text-gray-500 hover:text-red-600 underline"
          >
            Skip
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {cells.map((c, i) => {
          const chosen = isSelected(c);
          const parts: string[] = [];
          if (axes.includes("colour")) parts.push(COLOUR_LABEL[c.colour] ?? c.colour);
          if (axes.includes("sleeve") && c.sleeve)
            parts.push(SLEEVE_LABEL[c.sleeve]);
          return (
            <button
              key={i}
              type="button"
              onClick={() =>
                onSelect({
                  category: c.category,
                  colour: c.colour,
                  sleeve: c.sleeve,
                  size: c.size,
                })
              }
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md border text-sm text-left ${
                chosen
                  ? "bg-brand-blue/10 border-brand-blue"
                  : "bg-white border-gray-200 hover:border-brand-blue/60"
              }`}
            >
              <span>{parts.join(" · ") || `Size ${c.size}`}</span>
              <span className="text-xs text-gray-500">
                {c.freeStock} left
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Bottom picker (type + colour) ──────────────────────────────────

function BottomPicker({
  child,
  cellsForItem,
  onSelect,
}: {
  child: Child;
  cellsForItem: (category: StockCategory) => AvailableCell[];
  onSelect: (pick: SkuPick | null) => void;
}) {
  const options = child.sex === "female" ? GIRLS_BOTTOM_TYPES : BOYS_BOTTOM_TYPES;
  const grouped = options.map((type) => ({ type, cells: cellsForItem(type) }));
  const anyAvailable = grouped.some((g) => g.cells.length > 0);

  if (!anyAvailable) {
    return (
      <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 py-2.5">
        <p className="text-sm font-heading font-bold text-brand-dark">
          Bottom (trousers / skirt / dress / shorts)
        </p>
        <p className="text-xs text-gray-600 mt-0.5">
          Sorry — no bottoms in stock for this size right now.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-heading font-bold text-brand-dark">
          Bottom{" "}
          <span className="text-xs font-normal text-gray-500">
            — 1 max ({options.map((o) => BOTTOM_TYPE_LABEL[o]).join(" / ")})
          </span>
        </p>
        {child.bottom && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-xs text-gray-500 hover:text-red-600 underline"
          >
            Skip
          </button>
        )}
      </div>
      <div className="space-y-2">
        {grouped.map(({ type, cells }) =>
          cells.length === 0 ? null : (
            <div key={type}>
              <p className="text-xs font-heading font-bold uppercase tracking-widest text-gray-500 mb-1">
                {BOTTOM_TYPE_LABEL[type]}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {cells.map((c, i) => {
                  const chosen =
                    child.bottom &&
                    child.bottom.category === type &&
                    child.bottom.colour === c.colour;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        onSelect({
                          category: type,
                          colour: c.colour,
                          sleeve: null,
                          size: c.size,
                        })
                      }
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md border text-sm text-left ${
                        chosen
                          ? "bg-brand-blue/10 border-brand-blue"
                          : "bg-white border-gray-200 hover:border-brand-blue/60"
                      }`}
                    >
                      <span>{COLOUR_LABEL[c.colour] ?? c.colour}</span>
                      <span className="text-xs text-gray-500">
                        {c.freeStock} left
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ),
        )}
      </div>
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
    <label className="block">
      <span className="block text-xs font-heading font-bold uppercase tracking-widest text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

const UNIFORM_SIZE_OPTIONS = [
  "3-4",
  "4",
  "4-5",
  "5",
  "5-6",
  "6",
  "6-7",
  "7",
  "7-8",
  "8",
  "8-9",
  "9",
  "9-10",
  "10",
  "10-11",
  "11",
  "11-12",
  "12",
  "12-13",
  "13",
] as const;

