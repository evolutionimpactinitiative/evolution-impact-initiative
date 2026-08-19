"use client";

import * as React from "react";
import { Plus, Minus, Loader2, Shuffle } from "lucide-react";
import { useRouter } from "next/navigation";
import { AllocationSheet } from "./AllocationSheet";
import {
  STOCK_SIZES,
  effectiveCell,
  groupShortfallEffective,
  indexAllocations,
  skuCellKey,
  type MatrixGroup,
  type StockAllocation,
} from "@/lib/back-to-school-stock";
import type { EffectiveCellRow } from "./AllocationSheet";

interface Props {
  groups: MatrixGroup[];
  // Subset of sizes to render as columns. Defaults to all sizes.
  visibleSizes?: readonly string[];
  // If set, only cells whose skuCellKey is in this set are shown "live" —
  // the rest render as a dimmed dash so the matrix stays column-aligned.
  cellMask?: Set<string> | null;
  // Amber pill count of shopping-list reservations per cell key.
  reservedMap?: Map<string, number>;
  // For the substitution sheet:
  allocations?: StockAllocation[];
  allEffectiveCells?: EffectiveCellRow[];
}

export function StockMatrix({
  groups,
  visibleSizes,
  cellMask,
  reservedMap,
  allocations,
  allEffectiveCells,
}: Props) {
  const sizes = visibleSizes && visibleSizes.length > 0 ? visibleSizes : STOCK_SIZES;
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-xs uppercase tracking-widest text-gray-500">
              <th className="text-left px-4 py-3 sticky left-0 bg-gray-50 min-w-[220px] z-10">
                Item
              </th>
              {sizes.map((s) => (
                <th
                  key={s}
                  className="text-center px-2 py-3 font-heading font-bold text-brand-dark w-16"
                >
                  {s}
                </th>
              ))}
              <th className="text-center px-3 py-3 font-heading font-bold text-brand-dark w-20 bg-gray-100">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {groups.map((g) => (
              <GroupRow
                key={g.key}
                group={g}
                sizes={sizes}
                cellMask={cellMask ?? null}
                reservedMap={reservedMap ?? null}
                allocations={allocations ?? []}
                allEffectiveCells={allEffectiveCells ?? []}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GroupRow({
  group,
  sizes,
  cellMask,
  reservedMap,
  allocations,
  allEffectiveCells,
}: {
  group: MatrixGroup;
  sizes: readonly string[];
  cellMask: Set<string> | null;
  reservedMap: Map<string, number> | null;
  allocations: StockAllocation[];
  allEffectiveCells: EffectiveCellRow[];
}) {
  // Group allocations touching this row (either side) so we can compute
  // the true "still short" figure with substitutions applied.
  const groupAllocs = allocations.filter(
    (a) =>
      a.category === group.category &&
      ((a.from_colour === group.colour &&
        a.from_fit === group.fit &&
        (a.from_sleeve ?? "") === (group.sleeve ?? "") &&
        group.cells.has(a.from_size)) ||
        (a.to_colour === group.colour &&
          a.to_fit === group.fit &&
          (a.to_sleeve ?? "") === (group.sleeve ?? "") &&
          group.cells.has(a.to_size))),
  );
  const rowIndex = indexAllocations(groupAllocs);
  const shortfall = groupShortfallEffective(group, rowIndex);
  const netSurplus = group.totalStock - group.totalRequested;
  return (
    <tr className="hover:bg-brand-pale/20">
      <td className="text-left px-4 py-3 sticky left-0 bg-white z-10 border-r border-gray-100">
        <div className="font-heading font-bold text-brand-dark text-sm">
          {group.label}
        </div>
      </td>
      {sizes.map((size) => {
        const cell = group.cells.get(size);
        const key = skuCellKey({
          category: group.category,
          colour: group.colour,
          sleeve: group.sleeve,
          fit: group.fit,
          size,
        });
        const masked = cellMask ? !cellMask.has(key) : false;
        const reserved = reservedMap?.get(key) ?? 0;
        // Allocations that reference this cell (either side) so the sheet
        // can render an undo list.
        const cellAllocs = allocations.filter(
          (a) =>
            a.category === group.category &&
            ((a.from_colour === group.colour &&
              a.from_fit === group.fit &&
              (a.from_sleeve ?? "") === (group.sleeve ?? "") &&
              a.from_size === size) ||
              (a.to_colour === group.colour &&
                a.to_fit === group.fit &&
                (a.to_sleeve ?? "") === (group.sleeve ?? "") &&
                a.to_size === size)),
        );
        return (
          <td key={size} className="px-1 py-2 text-center">
            <StockCell
              category={group.category}
              colour={group.colour}
              sleeve={group.sleeve}
              fit={group.fit}
              size={size}
              stock={cell?.stock ?? 0}
              requested={cell?.requested ?? 0}
              stockId={cell?.stockId ?? null}
              masked={masked}
              reserved={reserved}
              groupLabel={group.label}
              cellAllocations={cellAllocs}
              allEffectiveCells={allEffectiveCells}
            />
          </td>
        );
      })}
      <td className="px-3 py-2 text-center bg-gray-50 border-l border-gray-100">
        <div className="font-heading font-bold text-brand-dark">
          {group.totalStock}
        </div>
        <div className="text-xs text-gray-500">
          req {group.totalRequested}
        </div>
        {shortfall > 0 ? (
          <div
            className="text-xs font-heading font-bold text-red-700"
            title="Sum of per-size shortages inside this row"
          >
            -{shortfall} short
          </div>
        ) : netSurplus > 0 ? (
          <div className="text-xs font-heading font-bold text-emerald-700">
            +{netSurplus}
          </div>
        ) : (
          <div className="text-xs font-heading font-bold text-gray-400">0</div>
        )}
      </td>
    </tr>
  );
}

interface CellProps {
  category: MatrixGroup["category"];
  colour: MatrixGroup["colour"];
  sleeve: MatrixGroup["sleeve"];
  fit: MatrixGroup["fit"];
  size: string;
  stock: number;
  requested: number;
  stockId: string | null;
  masked?: boolean;
  reserved?: number;
  // For the allocation sheet:
  groupLabel?: string;
  cellAllocations?: StockAllocation[];
  allEffectiveCells?: EffectiveCellRow[];
}

function StockCell(props: CellProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [substituteOpen, setSubstituteOpen] = React.useState(false);
  const [busy, setBusy] = React.useState<"add" | "remove" | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [delta, setDelta] = React.useState<number>(1);
  const [notes, setNotes] = React.useState("");

  const gap = props.stock - props.requested;
  const isEmpty =
    props.masked || (props.stock === 0 && props.requested === 0);

  // Effective numbers (allocations applied) for the "Substitute" section.
  const cellAllocs = props.cellAllocations ?? [];
  const idx = React.useMemo(() => indexAllocations(cellAllocs), [cellAllocs]);
  const cellKey = [
    props.category,
    props.colour,
    props.sleeve ?? "",
    props.fit,
    props.size,
  ].join("|");
  const effective = effectiveCell(
    { stock: props.stock, requested: props.requested },
    cellKey,
    idx,
  );
  const canSubstitute = effective.shortfall > 0 || effective.surplus > 0;
  const hasAllocs = cellAllocs.length > 0;

  async function submit(sign: 1 | -1) {
    if (!Number.isFinite(delta) || delta < 1) {
      setError("Enter a positive number.");
      return;
    }
    setError(null);
    setBusy(sign > 0 ? "add" : "remove");
    try {
      const res = await fetch("/api/back-to-school/stock/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: props.category,
          colour: props.colour,
          sleeve: props.sleeve,
          fit: props.fit,
          size: props.size,
          delta: sign * Math.round(delta),
          reason: sign > 0 ? "adjustment" : "adjustment",
          notes: notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setOpen(false);
      setDelta(1);
      setNotes("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full min-w-[52px] px-1 py-1.5 rounded-md text-xs leading-tight border transition-colors ${
          isEmpty
            ? "border-transparent hover:border-gray-200 text-gray-300 hover:text-gray-600"
            : gap < 0
              ? "border-red-100 bg-red-50 hover:bg-red-100 text-red-900"
              : gap > 0 || props.requested > 0
                ? "border-emerald-100 bg-emerald-50 hover:bg-emerald-100 text-emerald-900"
                : "border-gray-100 bg-white hover:bg-gray-50 text-brand-dark"
        }`}
        aria-label={`Adjust stock for ${props.category} size ${props.size}`}
      >
        {isEmpty ? (
          <span>—</span>
        ) : (
          <>
            <div className="font-heading font-bold text-sm">
              {props.stock}
            </div>
            <div className="text-[10px] opacity-75">req {props.requested}</div>
            {props.reserved && props.reserved > 0 ? (
              <div className="text-[10px] mt-0.5 font-heading font-bold text-amber-700 bg-amber-100 rounded-full px-1.5 leading-tight">
                +{props.reserved}
              </div>
            ) : null}
            {hasAllocs && (
              <div
                className="text-[10px] mt-0.5 font-heading font-bold text-brand-blue bg-brand-blue/10 rounded-full px-1.5 leading-tight"
                title={`${cellAllocs.length} substitution${cellAllocs.length === 1 ? "" : "s"}`}
              >
                ⇄ {cellAllocs.length}
              </div>
            )}
          </>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
      {open && (
        <div className="absolute z-50 top-full mt-1 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-64 text-left">
          <p className="text-xs font-heading font-bold text-brand-dark uppercase tracking-widest mb-1">
            Adjust stock
          </p>
          <p className="text-xs text-gray-600 mb-3">
            Size {props.size}. Currently {props.stock} in stock,{" "}
            {props.requested} requested.
          </p>
          <label className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
            Amount
          </label>
          <input
            type="number"
            min={1}
            value={delta}
            onChange={(e) => setDelta(Number(e.target.value))}
            className="mt-1 w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm"
          />
          <label className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest mt-2 block">
            Note (optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. donation from Sainsbury's"
            className="mt-1 w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm"
          />
          {error && (
            <p className="text-xs text-red-700 mt-2">{error}</p>
          )}
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => submit(1)}
              disabled={!!busy}
              className="flex-1 inline-flex items-center justify-center gap-1 bg-brand-green text-white px-3 py-1.5 rounded-md text-xs font-heading font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-50"
            >
              {busy === "add" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              Add
            </button>
            <button
              type="button"
              onClick={() => submit(-1)}
              disabled={!!busy || props.stock <= 0}
              className="flex-1 inline-flex items-center justify-center gap-1 bg-white text-red-700 border border-red-200 px-3 py-1.5 rounded-md text-xs font-heading font-bold uppercase tracking-widest hover:bg-red-50 disabled:opacity-50"
            >
              {busy === "remove" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Minus className="h-3.5 w-3.5" />
              )}
              Remove
            </button>
          </div>
          {(canSubstitute || hasAllocs) && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setSubstituteOpen(true);
              }}
              className="mt-2 w-full inline-flex items-center justify-center gap-1 bg-brand-blue/10 text-brand-blue px-3 py-1.5 rounded-md text-xs font-heading font-bold uppercase tracking-widest hover:bg-brand-blue/20"
            >
              <Shuffle className="h-3.5 w-3.5" />
              Substitute
              {hasAllocs && (
                <span className="ml-1 text-[10px] opacity-70">
                  ({cellAllocs.length})
                </span>
              )}
            </button>
          )}
        </div>
      )}

      {props.allEffectiveCells && (
        <AllocationSheet
          open={substituteOpen}
          onClose={() => setSubstituteOpen(false)}
          clickedCell={{
            category: props.category,
            colour: props.colour,
            sleeve: props.sleeve,
            fit: props.fit,
            size: props.size,
            freeStock: effective.freeStock,
            uncovered: effective.uncovered,
            shortfall: effective.shortfall,
            surplus: effective.surplus,
            label: props.groupLabel ?? "",
          }}
          allCells={props.allEffectiveCells}
          existingAllocations={cellAllocs}
        />
      )}
    </div>
  );
}
