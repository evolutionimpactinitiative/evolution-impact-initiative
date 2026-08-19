"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Shuffle, Trash2, X } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import {
  COLOUR_LABELS,
  FIT_LABELS,
  SLEEVE_LABELS,
  type StockAllocation,
  type StockCategory,
  type StockColour,
  type StockFit,
  type StockSleeve,
} from "@/lib/back-to-school-stock";

// Flat view of every cell with effective numbers — computed on the
// server and passed down so the picker doesn't have to refetch.
export interface EffectiveCellRow {
  category: StockCategory;
  colour: StockColour;
  sleeve: StockSleeve;
  fit: StockFit;
  size: string;
  label: string;      // e.g. "Grey trousers unisex"
  freeStock: number;  // stock still available after prior outbound allocations
  uncovered: number;  // demand still uncovered after prior inbound allocations
  shortfall: number;
  surplus: number;
}

interface ClickedCell {
  category: StockCategory;
  colour: StockColour;
  sleeve: StockSleeve;
  fit: StockFit;
  size: string;
  freeStock: number;
  uncovered: number;
  shortfall: number;
  surplus: number;
  label: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  clickedCell: ClickedCell;
  // Every cell in the drive — filtered inside the sheet to same-category
  // candidates only.
  allCells: EffectiveCellRow[];
  // Allocations that touch this cell on either side, so the sheet can
  // render an "undo" list.
  existingAllocations: StockAllocation[];
}

function sameCell(a: ClickedCell | EffectiveCellRow, b: EffectiveCellRow): boolean {
  return (
    a.category === b.category &&
    a.colour === b.colour &&
    (a.sleeve ?? "") === (b.sleeve ?? "") &&
    a.fit === b.fit &&
    a.size === b.size
  );
}

// Similarity score: 0 = identical (excluded), higher = more different.
// Used to rank candidates in the picker — obvious substitutes bubble up.
function distance(a: ClickedCell, b: EffectiveCellRow): number {
  let d = 0;
  if (a.colour !== b.colour) d += 100;
  if (a.fit !== b.fit) d += 50;
  if ((a.sleeve ?? "") !== (b.sleeve ?? "")) d += 25;
  // Size distance: try to parse numbers; if fails treat as different.
  const na = parseSize(a.size);
  const nb = parseSize(b.size);
  if (na !== null && nb !== null) {
    d += Math.abs(na - nb);
  } else if (a.size !== b.size) {
    d += 10;
  }
  return d;
}

// Handles "5", "5-6", "10-11" etc — averages the range.
function parseSize(s: string): number | null {
  const parts = s.split(/[-–]/).map((p) => parseFloat(p.trim()));
  if (parts.every((n) => !Number.isNaN(n))) {
    return parts.reduce((a, b) => a + b, 0) / parts.length;
  }
  return null;
}

function cellLabel(c: EffectiveCellRow): string {
  const sleeve = c.sleeve ? ` ${SLEEVE_LABELS[c.sleeve]}` : "";
  return `${COLOUR_LABELS[c.colour]} ${c.category}${sleeve} · ${FIT_LABELS[c.fit]} · size ${c.size}`;
}

export function AllocationSheet({
  open,
  onClose,
  clickedCell,
  allCells,
  existingAllocations,
}: Props) {
  const router = useRouter();
  // Direction depends on which side has capacity: shortfall cells PULL FROM
  // surplus cells; surplus cells PUSH TO shortfall cells.
  const initialMode: "pull" | "push" =
    clickedCell.shortfall > 0 ? "pull" : "push";
  const [mode, setMode] = React.useState<"pull" | "push">(initialMode);
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);
  const [qty, setQty] = React.useState<number>(1);
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Reset state whenever the sheet opens for a new cell.
  React.useEffect(() => {
    if (open) {
      setMode(clickedCell.shortfall > 0 ? "pull" : "push");
      setSelectedKey(null);
      setQty(1);
      setNote("");
      setError(null);
    }
  }, [open, clickedCell]);

  // Candidates: same category, not this cell, and the right side has
  // capacity for the chosen direction.
  const candidates = React.useMemo(() => {
    const filtered = allCells.filter((c) => {
      if (c.category !== clickedCell.category) return false;
      if (sameCell(clickedCell, c)) return false;
      return mode === "pull" ? c.freeStock > 0 : c.uncovered > 0;
    });
    return filtered.sort((a, b) => distance(clickedCell, a) - distance(clickedCell, b));
  }, [allCells, clickedCell, mode]);

  const selected =
    (selectedKey && candidates.find((c) => cellKeyOf(c) === selectedKey)) || null;

  // Max qty we can allocate: min(available on donor, uncovered on recipient)
  const maxQty = selected
    ? mode === "pull"
      ? Math.min(selected.freeStock, clickedCell.uncovered || Infinity)
      : Math.min(clickedCell.freeStock, selected.uncovered)
    : 0;

  async function save() {
    if (!selected) {
      setError("Pick a SKU to substitute with.");
      return;
    }
    const useQty = Math.min(Math.max(1, Math.round(qty)), maxQty);
    if (useQty < 1) {
      setError("No capacity to allocate.");
      return;
    }
    setBusy("save");
    setError(null);
    try {
      const fromCell = mode === "pull" ? selected : clickedCell;
      const toCell = mode === "pull" ? clickedCell : selected;
      const res = await fetch("/api/back-to-school/stock/allocations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: clickedCell.category,
          from: {
            colour: fromCell.colour,
            sleeve: fromCell.sleeve,
            fit: fromCell.fit,
            size: fromCell.size,
          },
          to: {
            colour: toCell.colour,
            sleeve: toCell.sleeve,
            fit: toCell.fit,
            size: toCell.size,
          },
          qty: useQty,
          note: note.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Save failed");
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  async function undo(id: string) {
    setBusy(`undo-${id}`);
    setError(null);
    try {
      const res = await fetch(
        `/api/back-to-school/stock/allocations/${id}`,
        { method: "DELETE" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Undo failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => (busy ? null : onClose())}
      title="Substitute stock"
    >
      <div className="space-y-4">
        {/* Cell header */}
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
          <p className="text-xs font-heading font-bold uppercase tracking-widest text-gray-500">
            This cell
          </p>
          <p className="font-heading font-bold text-brand-dark mt-0.5">
            {clickedCell.label} · size {clickedCell.size}
          </p>
          <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-600">
            <span>
              Free stock: <b>{clickedCell.freeStock}</b>
            </span>
            <span>
              Uncovered demand: <b>{clickedCell.uncovered}</b>
            </span>
            {clickedCell.shortfall > 0 && (
              <span className="text-red-700 font-bold">
                {clickedCell.shortfall} short
              </span>
            )}
            {clickedCell.surplus > 0 && (
              <span className="text-emerald-700 font-bold">
                {clickedCell.surplus} spare
              </span>
            )}
          </div>
        </div>

        {/* Existing allocations touching this cell */}
        {existingAllocations.length > 0 && (
          <div>
            <p className="text-xs font-heading font-bold uppercase tracking-widest text-gray-500 mb-2">
              Existing allocations
            </p>
            <ul className="space-y-1.5">
              {existingAllocations.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-3 py-2 text-xs"
                >
                  <span className="flex-1 min-w-0">
                    <b>{a.qty}</b>{" "}
                    <span className="text-gray-600">
                      {COLOUR_LABELS[a.from_colour]} {FIT_LABELS[a.from_fit]} sz{" "}
                      {a.from_size}
                    </span>
                    <ArrowRight className="inline h-3 w-3 text-gray-400 mx-1" />
                    <span className="text-gray-600">
                      {COLOUR_LABELS[a.to_colour]} {FIT_LABELS[a.to_fit]} sz{" "}
                      {a.to_size}
                    </span>
                    {a.note && (
                      <span className="text-gray-500 italic"> — {a.note}</span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => undo(a.id)}
                    disabled={busy === `undo-${a.id}`}
                    className="shrink-0 text-gray-400 hover:text-red-600 disabled:opacity-50"
                    aria-label="Undo allocation"
                    title="Undo"
                  >
                    {busy === `undo-${a.id}` ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Direction toggle — only show if both directions have candidates */}
        {clickedCell.shortfall > 0 && clickedCell.surplus === 0 ? (
          <p className="text-xs text-gray-600">
            This cell is short — pull stock from another SKU to cover it.
          </p>
        ) : clickedCell.surplus > 0 && clickedCell.shortfall === 0 ? (
          <p className="text-xs text-gray-600">
            This cell has spare stock — push it to another SKU that&rsquo;s
            short.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setMode("pull")}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-heading font-bold uppercase tracking-widest transition-colors ${
                mode === "pull"
                  ? "bg-white text-brand-dark shadow-sm"
                  : "text-gray-500"
              }`}
            >
              Pull from…
            </button>
            <button
              type="button"
              onClick={() => setMode("push")}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-heading font-bold uppercase tracking-widest transition-colors ${
                mode === "push"
                  ? "bg-white text-brand-dark shadow-sm"
                  : "text-gray-500"
              }`}
            >
              Push to…
            </button>
          </div>
        )}

        {/* Candidate picker */}
        <div>
          <p className="text-xs font-heading font-bold uppercase tracking-widest text-gray-500 mb-2">
            {mode === "pull" ? "Available donors" : "Cells that need help"}{" "}
            <span className="text-gray-400 font-normal">
              (nearest first)
            </span>
          </p>
          {candidates.length === 0 ? (
            <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-md px-3 py-4 text-center">
              No {mode === "pull" ? "cells with spare stock" : "cells short"} in
              this category.
            </p>
          ) : (
            <div className="max-h-56 overflow-y-auto -mx-1 px-1">
              <ul className="space-y-1">
                {candidates.map((c) => {
                  const k = cellKeyOf(c);
                  const chosen = k === selectedKey;
                  const capacity =
                    mode === "pull" ? c.freeStock : c.uncovered;
                  return (
                    <li key={k}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedKey(k);
                          const cap =
                            mode === "pull"
                              ? Math.min(capacity, clickedCell.uncovered || Infinity)
                              : Math.min(clickedCell.freeStock, capacity);
                          setQty(Math.max(1, Math.min(qty, cap || 1)));
                        }}
                        className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-md border text-sm transition-colors ${
                          chosen
                            ? "bg-brand-blue/10 border-brand-blue"
                            : "bg-white border-gray-200 hover:border-brand-blue/50"
                        }`}
                      >
                        <span className="flex-1 min-w-0">
                          <span className="block truncate">{cellLabel(c)}</span>
                          <span className="block text-xs text-gray-500">
                            {mode === "pull"
                              ? `${capacity} free`
                              : `${capacity} short`}
                          </span>
                        </span>
                        {chosen && (
                          <span className="text-xs font-heading font-bold uppercase tracking-widest text-brand-blue">
                            Picked
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Qty + note + save */}
        {selected && (
          <div className="space-y-2 border-t border-gray-200 pt-3">
            <div className="flex items-baseline gap-2 text-sm text-gray-700">
              <span className="flex-1 min-w-0">
                {mode === "pull" ? (
                  <>
                    Pull <b>{Math.min(qty, maxQty)}</b> from{" "}
                    <b>size {selected.size}</b> to cover this cell
                  </>
                ) : (
                  <>
                    Push <b>{Math.min(qty, maxQty)}</b> from this cell to cover{" "}
                    <b>size {selected.size}</b>
                  </>
                )}
              </span>
              <span className="text-xs text-gray-500">max {maxQty}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                min={1}
                max={maxQty}
                className="w-20 border border-gray-200 rounded-md px-2 py-1.5 text-sm"
              />
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note (e.g. 'runs small')"
                className="flex-1 border border-gray-200 rounded-md px-2 py-1.5 text-sm"
              />
            </div>
            {error && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </p>
            )}
            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={!!busy}
                className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-brand-dark px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:border-brand-blue disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={!!busy || maxQty < 1}
                className="inline-flex items-center gap-1.5 bg-brand-blue text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50"
              >
                {busy === "save" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Shuffle className="h-4 w-4" />
                )}
                Allocate
              </button>
            </div>
          </div>
        )}
        {!selected && error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}
      </div>
    </BottomSheet>
  );
}

function cellKeyOf(c: EffectiveCellRow): string {
  return [c.category, c.colour, c.sleeve ?? "", c.fit, c.size].join("|");
}
