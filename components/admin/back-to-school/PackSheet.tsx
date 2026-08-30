"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Package, Repeat, X } from "lucide-react";
import type {
  StockCategory,
  StockColour,
  StockFit,
  StockSleeve,
} from "@/lib/back-to-school-stock";
import { CATEGORY_LABELS, COLOUR_LABELS, SLEEVE_LABELS } from "@/lib/back-to-school-stock";

// One row per active pick_reservation. Shape mirrors the server-side
// PickReservation but only the fields the UI actually needs.
export interface PackReservation {
  id: string;
  category: StockCategory;
  colour: StockColour;
  sleeve: StockSleeve;
  fit: StockFit;
  size: string;
  qty: number;
  isSubstitute: boolean;
  originalLabel: string | null; // pre-formatted "size 8-9 (blue polo, short sleeve)" if this row is a substitute
}

// Stock cell keyed by category — the picker needs to know what's
// still available for a substitution. Empty cells (freeStock = 0) are
// filtered out.
export interface StockOption {
  category: StockCategory;
  colour: StockColour;
  sleeve: StockSleeve;
  fit: StockFit;
  size: string;
  freeStock: number;
}

interface Props {
  childId: string;
  childName: string;
  reservations: PackReservation[];
  extras: string[]; // e.g. ["Stationery pack", "School bag"]
  stockOptions: StockOption[];
  alreadyPacked: boolean;
}

export function PackSheet({
  childId,
  childName,
  reservations,
  extras,
  stockOptions,
  alreadyPacked,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null); // reservation id in-flight or "pack"
  const [error, setError] = React.useState<string | null>(null);
  const [substituting, setSubstituting] = React.useState<string | null>(null); // reservation id
  const [ticked, setTicked] = React.useState<Set<string>>(new Set());
  const [extrasTicked, setExtrasTicked] = React.useState<Set<string>>(new Set());

  async function submitSubstitute(reservation: PackReservation, target: StockOption, reason: string) {
    setBusy(reservation.id);
    setError(null);
    try {
      const res = await fetch(
        `/api/back-to-school/collection/pack/${childId}/substitute`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reservation_id: reservation.id,
            category: target.category,
            colour: target.colour,
            sleeve: target.sleeve,
            fit: target.fit,
            size: target.size,
            reason,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Substitution failed");
      setSubstituting(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Substitution failed");
    } finally {
      setBusy(null);
    }
  }

  async function markPacked() {
    if (!confirm(`Mark ${childName}'s bag as packed and send the ready-for-collection email?`)) {
      return;
    }
    setBusy("pack");
    setError(null);
    try {
      const res = await fetch(`/api/back-to-school/collection/pack/${childId}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Pack failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pack failed");
      setBusy(null);
    }
  }

  const allTicked =
    reservations.every((r) => ticked.has(r.id)) &&
    extras.every((x) => extrasTicked.has(x));

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Reservation rows */}
      <ul className="space-y-2">
        {reservations.map((r) => {
          const isBusy = busy === r.id;
          const isSub = substituting === r.id;
          const isTicked = ticked.has(r.id);
          return (
            <li
              key={r.id}
              className={`bg-white border rounded-xl overflow-hidden ${
                isTicked ? "border-emerald-300 bg-emerald-50/40" : "border-gray-200"
              }`}
            >
              <div className="p-3 flex items-start gap-3">
                <button
                  type="button"
                  disabled={alreadyPacked}
                  onClick={() => {
                    setTicked((s) => {
                      const next = new Set(s);
                      if (next.has(r.id)) next.delete(r.id);
                      else next.add(r.id);
                      return next;
                    });
                  }}
                  className={`shrink-0 h-6 w-6 rounded border flex items-center justify-center transition ${
                    isTicked
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "border-gray-300 hover:border-emerald-400"
                  } ${alreadyPacked ? "opacity-50 cursor-not-allowed" : ""}`}
                  aria-label={isTicked ? "Untick" : "Tick"}
                >
                  {isTicked && <CheckCircle2 className="h-4 w-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-brand-dark">
                    {itemLabel(r)}
                    {r.qty > 1 && (
                      <span className="ml-2 text-xs font-normal text-gray-500">
                        × {r.qty}
                      </span>
                    )}
                  </p>
                  {r.isSubstitute && r.originalLabel && (
                    <p className="text-xs text-amber-700 mt-0.5">
                      Substitute for: {r.originalLabel}
                    </p>
                  )}
                </div>
                {!alreadyPacked && (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => setSubstituting(isSub ? null : r.id)}
                    className="shrink-0 text-xs font-heading font-bold uppercase tracking-widest text-brand-blue hover:text-brand-dark inline-flex items-center gap-1"
                  >
                    {isBusy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : isSub ? (
                      <>
                        <X className="h-3.5 w-3.5" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Repeat className="h-3.5 w-3.5" />
                        Substitute
                      </>
                    )}
                  </button>
                )}
              </div>
              {isSub && !alreadyPacked && (
                <SubstitutePicker
                  reservation={r}
                  stockOptions={stockOptions.filter(
                    (o) => o.category === r.category,
                  )}
                  onCancel={() => setSubstituting(null)}
                  onConfirm={(target, reason) => submitSubstitute(r, target, reason)}
                  busy={isBusy}
                />
              )}
            </li>
          );
        })}
      </ul>

      {/* Extras — stationery / bag — no reservations, but the packer
          still needs to grab them physically. */}
      {extras.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-widest font-heading font-bold text-gray-500 mb-2">
            Extras (grab from the general shelf)
          </p>
          <ul className="space-y-2">
            {extras.map((x) => {
              const isTicked = extrasTicked.has(x);
              return (
                <li key={x} className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={alreadyPacked}
                    onClick={() => {
                      setExtrasTicked((s) => {
                        const next = new Set(s);
                        if (next.has(x)) next.delete(x);
                        else next.add(x);
                        return next;
                      });
                    }}
                    className={`shrink-0 h-6 w-6 rounded border flex items-center justify-center transition ${
                      isTicked
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-gray-300 hover:border-emerald-400"
                    } ${alreadyPacked ? "opacity-50 cursor-not-allowed" : ""}`}
                    aria-label={isTicked ? "Untick" : "Tick"}
                  >
                    {isTicked && <CheckCircle2 className="h-4 w-4" />}
                  </button>
                  <p className="text-sm text-brand-dark font-heading font-bold">{x}</p>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Pack action */}
      {!alreadyPacked && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-600 mb-3">
            Everything above should be in the bag before you hit this.
            The parent will get an email.
          </p>
          <button
            type="button"
            disabled={!allTicked || busy === "pack"}
            onClick={markPacked}
            className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-heading font-bold uppercase tracking-widest transition ${
              allTicked && busy !== "pack"
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            {busy === "pack" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Package className="h-4 w-4" />
            )}
            {busy === "pack" ? "Packing…" : "Packed and ready for collection"}
          </button>
          {!allTicked && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Tick every item first.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Substitute picker (colour → sleeve → fit → size) ───────────────

function SubstitutePicker({
  reservation,
  stockOptions,
  onCancel,
  onConfirm,
  busy,
}: {
  reservation: PackReservation;
  stockOptions: StockOption[];
  onCancel: () => void;
  onConfirm: (target: StockOption, reason: string) => void;
  busy: boolean;
}) {
  const [colour, setColour] = React.useState<StockColour | null>(null);
  const [sleeve, setSleeve] = React.useState<StockSleeve | "">("");
  const [fit, setFit] = React.useState<StockFit | null>(null);
  const [size, setSize] = React.useState<string | null>(null);
  const [reason, setReason] = React.useState("Miscounted stock");

  const colours = Array.from(new Set(stockOptions.map((o) => o.colour))).sort();
  const filtered = stockOptions.filter((o) => (colour ? o.colour === colour : true));
  const sleeves = Array.from(new Set(filtered.map((o) => o.sleeve))).sort();
  const filtered2 = filtered.filter((o) =>
    sleeve === "" ? true : (o.sleeve ?? "") === (sleeve ?? ""),
  );
  const fits = Array.from(new Set(filtered2.map((o) => o.fit))).sort();
  const filtered3 = filtered2.filter((o) => (fit ? o.fit === fit : true));
  const sizes = Array.from(new Set(filtered3.map((o) => o.size))).sort();

  const target = stockOptions.find(
    (o) =>
      o.colour === colour &&
      (o.sleeve ?? "") === (sleeve ?? "") &&
      o.fit === fit &&
      o.size === size,
  );
  const canConfirm = !!target && target.freeStock >= reservation.qty && !busy;

  return (
    <div className="border-t border-gray-100 bg-gray-50 p-3 space-y-3">
      <p className="text-xs text-gray-600">
        Pick a replacement in the same category (
        {CATEGORY_LABELS[reservation.category]}).
      </p>

      {/* Colour */}
      <div>
        <p className="text-[10px] uppercase tracking-widest font-heading font-bold text-gray-500 mb-1">
          Colour
        </p>
        <div className="flex flex-wrap gap-1.5">
          {colours.map((c) => (
            <Chip
              key={c}
              active={colour === c}
              onClick={() => {
                setColour(c);
                setSleeve("");
                setFit(null);
                setSize(null);
              }}
            >
              {COLOUR_LABELS[c] ?? c}
            </Chip>
          ))}
        </div>
      </div>

      {/* Sleeve — only for shirts and polos */}
      {colour && (reservation.category === "shirt" || reservation.category === "polo") && (
        <div>
          <p className="text-[10px] uppercase tracking-widest font-heading font-bold text-gray-500 mb-1">
            Sleeve
          </p>
          <div className="flex flex-wrap gap-1.5">
            {sleeves.map((s) => (
              <Chip
                key={s ?? "none"}
                active={(sleeve ?? "") === (s ?? "")}
                onClick={() => {
                  setSleeve(s ?? "");
                  setFit(null);
                  setSize(null);
                }}
              >
                {s ? SLEEVE_LABELS[s] : "—"}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {/* Fit */}
      {colour && (
        <div>
          <p className="text-[10px] uppercase tracking-widest font-heading font-bold text-gray-500 mb-1">
            Fit
          </p>
          <div className="flex flex-wrap gap-1.5">
            {fits.map((f) => (
              <Chip
                key={f}
                active={fit === f}
                onClick={() => {
                  setFit(f);
                  setSize(null);
                }}
              >
                {f}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {/* Size */}
      {colour && fit && (
        <div>
          <p className="text-[10px] uppercase tracking-widest font-heading font-bold text-gray-500 mb-1">
            Size
          </p>
          <div className="flex flex-wrap gap-1.5">
            {sizes.map((s) => {
              const opt = filtered3.find((o) => o.size === s);
              return (
                <Chip
                  key={s}
                  active={size === s}
                  onClick={() => setSize(s)}
                >
                  {s}
                  {opt && (
                    <span className="ml-1 text-[10px] opacity-70">
                      ({opt.freeStock})
                    </span>
                  )}
                </Chip>
              );
            })}
          </div>
        </div>
      )}

      {/* Reason (small) */}
      <div>
        <p className="text-[10px] uppercase tracking-widest font-heading font-bold text-gray-500 mb-1">
          Reason (visible to parent)
        </p>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm"
          placeholder="Miscounted stock"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => target && canConfirm && onConfirm(target, reason)}
          disabled={!canConfirm}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-heading font-bold uppercase tracking-widest ${
            canConfirm
              ? "bg-brand-blue text-white hover:bg-brand-dark"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Repeat className="h-3.5 w-3.5" />}
          Confirm swap
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-heading font-bold uppercase tracking-widest text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
        {target && target.freeStock < reservation.qty && (
          <p className="text-xs text-red-600 ml-auto">
            Only {target.freeStock} left — need {reservation.qty}.
          </p>
        )}
      </div>
    </div>
  );
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-heading font-bold uppercase tracking-widest ${
        active
          ? "bg-brand-blue text-white"
          : "bg-white border border-gray-200 text-brand-dark hover:border-brand-blue"
      }`}
    >
      {children}
    </button>
  );
}

function itemLabel(r: PackReservation): string {
  const c = COLOUR_LABELS[r.colour] ?? r.colour;
  const cat = CATEGORY_LABELS[r.category].toLowerCase();
  const slv = r.sleeve ? SLEEVE_LABELS[r.sleeve] : null;
  const fitTag = r.fit === "unisex" ? " unisex" : "";
  return `${c} ${cat}${slv ? ` (${slv})` : ""} · size ${r.size}${fitTag}`;
}
