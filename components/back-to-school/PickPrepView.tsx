"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Loader2,
  Printer,
  Shuffle,
  Users,
} from "lucide-react";
import {
  COLOUR_LABELS,
  FIT_LABELS,
  SLEEVE_LABELS,
  type StockCategory,
  type StockColour,
  type StockFit,
  type StockSleeve,
} from "@/lib/back-to-school-stock";
import type { PickReservation } from "@/lib/back-to-school/pick-reservations";

interface Sku {
  category: StockCategory;
  colour: StockColour;
  sleeve: StockSleeve;
  fit: StockFit;
  size: string;
}

interface EffectiveCellRow extends Sku {
  label: string;
  freeStock: number;
  uncovered: number;
  shortfall: number;
  surplus: number;
}

interface AskWithStatus {
  ask: Sku;
  label: string;
  freeStock: number;
}

interface ChildBlock {
  child: {
    id: string;
    child_name: string;
    child_age: number | null;
    uniform_size: string | null;
    sex: string | null;
    school: string | null;
    notes: string | null;
  };
  askStatuses: AskWithStatus[];
}

interface Props {
  registrationId: string;
  stewardToken: string;
  qrToken: string;
  children: ChildBlock[];
  existingReservations: PickReservation[];
  allCells: EffectiveCellRow[];
}

// Steward's decision per (childId + original ask). Either "use exact"
// (chosen = ask) or "substitute" (chosen = something else in the same
// category).
type Decision =
  | { kind: "exact"; chosen: Sku }
  | { kind: "sub"; chosen: Sku }
  | { kind: "unavailable" }; // no exact, no sub picked

interface DecisionsMap {
  [key: string]: Decision; // key = childId|original-cell-key
}

function skuKey(childId: string, s: Sku): string {
  return [childId, s.category, s.colour, s.sleeve ?? "", s.fit, s.size].join("|");
}

function sameSku(a: Sku, b: Sku): boolean {
  return (
    a.category === b.category &&
    a.colour === b.colour &&
    (a.sleeve ?? "") === (b.sleeve ?? "") &&
    a.fit === b.fit &&
    a.size === b.size
  );
}

function parseSize(s: string): number | null {
  const parts = s.split(/[-–]/).map((p) => parseFloat(p.trim()));
  if (parts.every((n) => !Number.isNaN(n))) {
    return parts.reduce((x, y) => x + y, 0) / parts.length;
  }
  return null;
}

// Rank candidate substitutes for a specific ask.
function rankCandidates(ask: Sku, allCells: EffectiveCellRow[]): EffectiveCellRow[] {
  return allCells
    .filter((c) => c.category === ask.category && !sameSku(ask, c))
    // Must have TRUE spare (accounts for everyone else's demand + prior
    // allocations + already-standing reservations).
    .filter((c) => c.surplus > 0)
    .sort((a, b) => {
      const distance = (c: EffectiveCellRow) => {
        let d = 0;
        if (c.colour !== ask.colour) d += 100;
        if (c.fit !== ask.fit) d += 50;
        if ((c.sleeve ?? "") !== (ask.sleeve ?? "")) d += 25;
        const na = parseSize(ask.size);
        const nb = parseSize(c.size);
        if (na !== null && nb !== null) d += Math.abs(na - nb);
        else if (ask.size !== c.size) d += 10;
        return d;
      };
      return distance(a) - distance(b);
    });
}

function skuLabel(s: Sku): string {
  const sleeve = s.sleeve ? ` ${SLEEVE_LABELS[s.sleeve]}` : "";
  return `${COLOUR_LABELS[s.colour]} ${s.category}${sleeve} · ${FIT_LABELS[s.fit]} · size ${s.size}`;
}

// Convert an existing DB reservation back to a Decision so a reload
// shows the steward's prior choices already applied.
function decisionFromReservation(r: PickReservation): Decision | null {
  const chosen: Sku = {
    category: r.category,
    colour: r.colour,
    sleeve: r.sleeve,
    fit: r.fit,
    size: r.size,
  };
  if (
    r.original_category &&
    r.original_colour &&
    r.original_fit &&
    r.original_size
  ) {
    const original: Sku = {
      category: r.original_category,
      colour: r.original_colour,
      sleeve: r.original_sleeve,
      fit: r.original_fit,
      size: r.original_size,
    };
    return sameSku(chosen, original)
      ? { kind: "exact", chosen }
      : { kind: "sub", chosen };
  }
  return { kind: "exact", chosen };
}

export function PickPrepView({
  registrationId,
  stewardToken,
  qrToken,
  children,
  existingReservations,
  allCells,
}: Props) {
  const router = useRouter();
  const [decisions, setDecisions] = React.useState<DecisionsMap>(() => {
    // Seed from existing reservations for THIS family.
    const seeded: DecisionsMap = {};
    for (const r of existingReservations) {
      if (!r.original_size) continue;
      const originalSku: Sku = {
        category: (r.original_category ?? r.category) as StockCategory,
        colour: (r.original_colour ?? r.colour) as StockColour,
        sleeve: (r.original_sleeve ?? r.sleeve) as StockSleeve,
        fit: (r.original_fit ?? r.fit) as StockFit,
        size: r.original_size,
      };
      const k = skuKey(r.child_id, originalSku);
      const decision = decisionFromReservation(r);
      if (decision) seeded[k] = decision;
    }
    // Auto-select exact matches for any ask that DIDN'T come with a
    // reservation but the exact SKU IS in stock — so the steward only
    // has to intervene on problem rows.
    for (const c of children) {
      for (const a of c.askStatuses) {
        const k = skuKey(c.child.id, a.ask);
        if (seeded[k]) continue;
        if (a.freeStock >= 1) {
          seeded[k] = { kind: "exact", chosen: a.ask };
        }
      }
    }
    return seeded;
  });
  const [openSubKey, setOpenSubKey] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function chooseExact(childId: string, ask: Sku) {
    const k = skuKey(childId, ask);
    setDecisions((d) => ({ ...d, [k]: { kind: "exact", chosen: ask } }));
    setOpenSubKey(null);
  }

  function chooseSub(childId: string, ask: Sku, chosen: Sku) {
    const k = skuKey(childId, ask);
    setDecisions((d) => ({ ...d, [k]: { kind: "sub", chosen } }));
    setOpenSubKey(null);
  }

  function markUnavailable(childId: string, ask: Sku) {
    const k = skuKey(childId, ask);
    setDecisions((d) => ({ ...d, [k]: { kind: "unavailable" } }));
    setOpenSubKey(null);
  }

  // Count of items that are still unresolved (no decision).
  const totalItems = children.reduce((n, c) => n + c.askStatuses.length, 0);
  const decidedItems = children.reduce(
    (n, c) =>
      n + c.askStatuses.filter((a) => decisions[skuKey(c.child.id, a.ask)]).length,
    0,
  );
  const substituteCount = children.reduce(
    (n, c) =>
      n +
      c.askStatuses.filter(
        (a) => decisions[skuKey(c.child.id, a.ask)]?.kind === "sub",
      ).length,
    0,
  );
  const unavailableCount = children.reduce(
    (n, c) =>
      n +
      c.askStatuses.filter(
        (a) => decisions[skuKey(c.child.id, a.ask)]?.kind === "unavailable",
      ).length,
    0,
  );
  const allDecided = decidedItems === totalItems;

  async function confirmAndPrint() {
    setBusy(true);
    setError(null);
    try {
      const items: Array<{
        childId: string;
        chosen: Sku & { qty: number };
        original: Sku | null;
      }> = [];
      for (const c of children) {
        for (const a of c.askStatuses) {
          const k = skuKey(c.child.id, a.ask);
          const d = decisions[k];
          if (!d || d.kind === "unavailable") continue;
          items.push({
            childId: c.child.id,
            chosen: { ...d.chosen, qty: 1 },
            original: sameSku(d.chosen, a.ask) ? null : a.ask,
          });
        }
      }
      if (items.length === 0) {
        // Skip straight to print — nothing to reserve.
        router.push(
          `/b2s/print/${encodeURIComponent(qrToken)}?s=${encodeURIComponent(stewardToken)}`,
        );
        return;
      }
      const res = await fetch("/api/back-to-school/pick-reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, items, stewardToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Reserve failed");
      router.push(
        `/b2s/print/${encodeURIComponent(qrToken)}?s=${encodeURIComponent(stewardToken)}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setBusy(false);
    }
  }

  if (children.every((c) => c.askStatuses.length === 0)) {
    // No uniform asks — just push to print (stationery/bag only).
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
        <p className="text-sm text-gray-600 mb-4">
          No uniform items requested — nothing to prep. Print the labels.
        </p>
        <button
          type="button"
          onClick={() =>
            router.push(
              `/b2s/print/${encodeURIComponent(qrToken)}?s=${encodeURIComponent(stewardToken)}`,
            )
          }
          className="inline-flex items-center gap-1.5 bg-brand-blue text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark"
        >
          <Printer className="h-4 w-4" />
          Print labels
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="bg-white border border-gray-200 rounded-2xl p-3 flex flex-wrap items-center gap-3">
        <p className="text-xs text-gray-600 flex-1 min-w-0">
          <b className="text-brand-dark">{decidedItems}</b> of{" "}
          <b className="text-brand-dark">{totalItems}</b> items decided
          {substituteCount > 0 && (
            <span className="text-amber-700"> · {substituteCount} substituted</span>
          )}
          {unavailableCount > 0 && (
            <span className="text-red-700"> · {unavailableCount} unavailable</span>
          )}
        </p>
        <button
          type="button"
          onClick={confirmAndPrint}
          disabled={!allDecided || busy}
          className="inline-flex items-center gap-1.5 bg-brand-blue text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
          Reserve &amp; print
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Per-child cards */}
      {children.map((c) => {
        const meta: string[] = [];
        if (c.child.child_age != null) meta.push(`Age ${c.child.child_age}`);
        if (c.child.sex) meta.push(c.child.sex === "male" ? "Boy" : c.child.sex === "female" ? "Girl" : "");
        if (c.child.uniform_size) meta.push(`Size ${c.child.uniform_size}`);
        return (
          <section
            key={c.child.id}
            className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
          >
            <header className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-brand-blue" />
                <p className="font-heading font-bold text-brand-dark">
                  {c.child.child_name}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{meta.filter(Boolean).join(" · ")}</p>
              {c.child.school && (
                <p className="text-xs text-gray-500 mt-0.5 italic">
                  School: {c.child.school}
                </p>
              )}
              {c.child.notes && (
                <p className="text-xs bg-amber-50 border border-amber-200 rounded-md px-2 py-1 mt-1.5">
                  <b>Note:</b> {c.child.notes}
                </p>
              )}
            </header>

            {c.askStatuses.length === 0 ? (
              <p className="p-4 text-xs text-gray-500 italic">
                No uniform items — stationery / bag only.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {c.askStatuses.map((a) => {
                  const k = skuKey(c.child.id, a.ask);
                  const decision = decisions[k];
                  const candidates = rankCandidates(a.ask, allCells);
                  const isOpen = openSubKey === k;
                  return (
                    <li key={k} className="p-3">
                      <ItemRow
                        label={a.label}
                        size={a.ask.size}
                        freeStock={a.freeStock}
                        decision={decision}
                        onUseExact={() => chooseExact(c.child.id, a.ask)}
                        onOpenSub={() => setOpenSubKey(isOpen ? null : k)}
                        onMarkUnavailable={() =>
                          markUnavailable(c.child.id, a.ask)
                        }
                        isSubOpen={isOpen}
                        candidates={candidates}
                        onPickSub={(c2) => chooseSub(c.child.id, a.ask, c2)}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}

      {/* Sticky footer print button on small screens */}
      <div className="sticky bottom-4 flex justify-end">
        <button
          type="button"
          onClick={confirmAndPrint}
          disabled={!allDecided || busy}
          className="inline-flex items-center gap-1.5 bg-brand-blue text-white px-5 py-3 rounded-full text-sm font-heading font-bold uppercase tracking-widest shadow-lg hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Printer className="h-4 w-4" />
          )}
          Reserve &amp; print
        </button>
      </div>
    </div>
  );
}

function ItemRow({
  label,
  size,
  freeStock,
  decision,
  onUseExact,
  onOpenSub,
  onMarkUnavailable,
  isSubOpen,
  candidates,
  onPickSub,
}: {
  label: string;
  size: string;
  freeStock: number;
  decision: Decision | undefined;
  onUseExact: () => void;
  onOpenSub: () => void;
  onMarkUnavailable: () => void;
  isSubOpen: boolean;
  candidates: EffectiveCellRow[];
  onPickSub: (c: EffectiveCellRow) => void;
}) {
  const hasExact = freeStock >= 1;
  const chosen = decision?.kind === "exact" || decision?.kind === "sub" ? decision.chosen : null;

  return (
    <div>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-heading font-bold text-brand-dark">
            {label} · size {size}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {hasExact ? (
              <span className="text-emerald-700">
                {freeStock} in stock — exact match available
              </span>
            ) : (
              <span className="text-red-700 inline-flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Not in stock — ask parent about a substitute
              </span>
            )}
          </p>
          {decision?.kind === "sub" && chosen && (
            <p className="text-xs text-amber-800 mt-1 inline-flex items-center gap-1">
              <Shuffle className="h-3 w-3" />
              Substituting with:{" "}
              <b className="text-brand-dark">{skuLabel(chosen)}</b>
            </p>
          )}
          {decision?.kind === "exact" && (
            <p className="text-xs text-emerald-700 mt-1 inline-flex items-center gap-1">
              <Check className="h-3 w-3" />
              Reserved exact match
            </p>
          )}
          {decision?.kind === "unavailable" && (
            <p className="text-xs text-gray-600 mt-1 italic">
              Marked unavailable — will not print on the label
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          {hasExact && decision?.kind !== "exact" && (
            <button
              type="button"
              onClick={onUseExact}
              className="inline-flex items-center gap-1 bg-emerald-600 text-white px-3 py-1.5 rounded-md text-xs font-heading font-bold uppercase tracking-widest hover:bg-emerald-700"
            >
              <Check className="h-3.5 w-3.5" />
              Use exact
            </button>
          )}
          <button
            type="button"
            onClick={onOpenSub}
            className="inline-flex items-center gap-1 bg-white border border-gray-200 text-brand-dark px-3 py-1.5 rounded-md text-xs font-heading font-bold uppercase tracking-widest hover:border-brand-blue"
          >
            <Shuffle className="h-3.5 w-3.5" />
            {isSubOpen ? "Close" : "Substitute"}
          </button>
        </div>
      </div>

      {isSubOpen && (
        <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-600 mb-1">
            Nearest available options (colour + fit + closest size):
          </p>
          {candidates.length === 0 ? (
            <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-md px-3 py-3 text-center">
              No SKUs with spare stock in this category.
            </p>
          ) : (
            <ul className="space-y-1 max-h-56 overflow-y-auto">
              {candidates.slice(0, 20).map((c, i) => {
                const chosenNow = chosen && sameSku(chosen, c);
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => onPickSub(c)}
                      className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-md border text-sm ${
                        chosenNow
                          ? "bg-brand-blue/10 border-brand-blue"
                          : "bg-white border-gray-200 hover:border-brand-blue/50"
                      }`}
                    >
                      <span className="flex-1 min-w-0">
                        <span className="block truncate">{skuLabel(c)}</span>
                        <span className="block text-xs text-gray-500">
                          {c.surplus} spare
                        </span>
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <button
            type="button"
            onClick={onMarkUnavailable}
            className="w-full inline-flex items-center justify-center gap-1 bg-white border border-red-200 text-red-700 px-3 py-1.5 rounded-md text-xs font-heading font-bold uppercase tracking-widest hover:bg-red-50"
          >
            Mark unavailable — skip this item
          </button>
        </div>
      )}
    </div>
  );
}
