"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, Plus, Minus, Loader2, Shuffle } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  effectiveCell,
  groupShortfallEffective,
  indexAllocations,
  skuCellKey,
  type MatrixGroup,
  type StockAllocation,
} from "@/lib/back-to-school-stock";
import {
  AllocationSheet,
  type EffectiveCellRow,
} from "./AllocationSheet";

interface Props {
  groups: MatrixGroup[];
  visibleSizes?: readonly string[];
  cellMask?: Set<string> | null;
  reservedMap?: Map<string, number>;
  allocations?: StockAllocation[];
  allEffectiveCells?: EffectiveCellRow[];
}

// Mobile-friendly alternative to the item×size matrix. Renders each SKU
// group as a card with headline totals and an expandable per-size list.
export function StockCardList({
  groups,
  visibleSizes,
  cellMask,
  reservedMap,
  allocations,
  allEffectiveCells,
}: Props) {
  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <StockCard
          key={g.key}
          group={g}
          visibleSizes={visibleSizes}
          cellMask={cellMask ?? null}
          reservedMap={reservedMap ?? null}
          allocations={allocations ?? []}
          allEffectiveCells={allEffectiveCells ?? []}
        />
      ))}
    </div>
  );
}

function StockCard({
  group,
  visibleSizes,
  cellMask,
  reservedMap,
  allocations,
  allEffectiveCells,
}: {
  group: MatrixGroup;
  visibleSizes?: readonly string[];
  cellMask: Set<string> | null;
  reservedMap: Map<string, number> | null;
  allocations: StockAllocation[];
  allEffectiveCells: EffectiveCellRow[];
}) {
  const [expanded, setExpanded] = React.useState(false);

  // Allocations scoped to this group (both directions).
  const groupAllocations = React.useMemo(
    () =>
      allocations.filter(
        (a) =>
          a.category === group.category &&
          (((a.from_colour === group.colour &&
            a.from_fit === group.fit &&
            (a.from_sleeve ?? "") === (group.sleeve ?? "")) &&
            group.cells.has(a.from_size)) ||
            ((a.to_colour === group.colour &&
              a.to_fit === group.fit &&
              (a.to_sleeve ?? "") === (group.sleeve ?? "")) &&
              group.cells.has(a.to_size))),
      ),
    [allocations, group],
  );

  // Effective shortfall reflecting allocations (so the row pill matches
  // the top-of-page tile).
  const groupIdx = React.useMemo(
    () => indexAllocations(groupAllocations),
    [groupAllocations],
  );
  const shortfall = groupShortfallEffective(group, groupIdx);
  const netSurplus = group.totalStock - group.totalRequested;

  // Only show cells whose mask allows them and (either have stock or demand
  // or the mask includes them). Prevents rendering rows of dashes.
  const cells: Array<{
    size: string;
    stock: number;
    requested: number;
    stockId: string | null;
    masked: boolean;
    reserved: number;
  }> = [];
  let groupReserved = 0;
  const sizes = visibleSizes ?? [];
  for (const size of sizes) {
    const cell = group.cells.get(size);
    const stock = cell?.stock ?? 0;
    const requested = cell?.requested ?? 0;
    const key = skuCellKey({
      category: group.category,
      colour: group.colour,
      sleeve: group.sleeve,
      fit: group.fit,
      size,
    });
    const masked = cellMask ? !cellMask.has(key) : false;
    const reserved = reservedMap?.get(key) ?? 0;
    groupReserved += reserved;
    if (masked) continue;
    if (stock === 0 && requested === 0 && reserved === 0) continue;
    cells.push({
      size,
      stock,
      requested,
      stockId: cell?.stockId ?? null,
      masked,
      reserved,
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-3 p-4 text-left active:bg-gray-50"
      >
        <div className="flex-1 min-w-0">
          <p className="font-heading font-bold text-brand-dark text-sm truncate">
            {group.label}
          </p>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mt-1.5">
            <span className="inline-flex items-baseline gap-1">
              <span className="text-xs text-gray-500 uppercase tracking-widest font-heading font-bold">
                In
              </span>
              <span className="text-brand-dark font-heading font-black text-base">
                {group.totalStock}
              </span>
            </span>
            <span className="inline-flex items-baseline gap-1">
              <span className="text-xs text-gray-500 uppercase tracking-widest font-heading font-bold">
                Req
              </span>
              <span className="text-brand-dark font-heading font-black text-base">
                {group.totalRequested}
              </span>
            </span>
            {groupReserved > 0 && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-heading font-bold uppercase tracking-widest bg-amber-100 text-amber-800"
                title="Reservations from the shopping list — not yet in stock"
              >
                +{groupReserved} reserved
              </span>
            )}
            {shortfall > 0 ? (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-heading font-bold uppercase tracking-widest bg-red-100 text-red-800"
                title="Sum of per-size shortages inside this group"
              >
                -{shortfall} short
              </span>
            ) : netSurplus > 0 ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-heading font-bold uppercase tracking-widest bg-emerald-100 text-emerald-800">
                +{netSurplus}
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-heading font-bold uppercase tracking-widest bg-gray-100 text-gray-700">
                0
              </span>
            )}
          </div>
        </div>
        <div className="w-10 h-10 shrink-0 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 p-4 bg-brand-pale/20">
          {cells.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">
              No sizes with stock or demand match the current filters.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 bg-white rounded-xl overflow-hidden">
              {cells.map((c) => {
                const cellKey = skuCellKey({
                  category: group.category,
                  colour: group.colour,
                  sleeve: group.sleeve,
                  fit: group.fit,
                  size: c.size,
                });
                const rowAllocs = groupAllocations.filter(
                  (a) =>
                    (a.from_size === c.size &&
                      a.from_colour === group.colour &&
                      a.from_fit === group.fit &&
                      (a.from_sleeve ?? "") === (group.sleeve ?? "")) ||
                    (a.to_size === c.size &&
                      a.to_colour === group.colour &&
                      a.to_fit === group.fit &&
                      (a.to_sleeve ?? "") === (group.sleeve ?? "")),
                );
                return (
                  <SizeRow
                    key={c.size}
                    category={group.category}
                    colour={group.colour}
                    sleeve={group.sleeve}
                    fit={group.fit}
                    size={c.size}
                    stock={c.stock}
                    requested={c.requested}
                    reserved={c.reserved}
                    groupLabel={group.label}
                    cellKey={cellKey}
                    cellAllocations={rowAllocs}
                    allEffectiveCells={allEffectiveCells}
                  />
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

interface SizeRowProps {
  category: MatrixGroup["category"];
  colour: MatrixGroup["colour"];
  sleeve: MatrixGroup["sleeve"];
  fit: MatrixGroup["fit"];
  size: string;
  stock: number;
  requested: number;
  reserved: number;
  groupLabel?: string;
  cellKey?: string;
  cellAllocations?: StockAllocation[];
  allEffectiveCells?: EffectiveCellRow[];
}

function SizeRow(props: SizeRowProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [substituteOpen, setSubstituteOpen] = React.useState(false);
  const [busy, setBusy] = React.useState<"add" | "remove" | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [delta, setDelta] = React.useState<number>(1);

  // Effective numbers (allocations applied) — we display these so the
  // row stops looking red once its shortfall has been covered.
  const rowAllocs = props.cellAllocations ?? [];
  const idx = React.useMemo(() => indexAllocations(rowAllocs), [rowAllocs]);
  const cellKey = props.cellKey ?? "";
  const effective = effectiveCell(
    { stock: props.stock, requested: props.requested },
    cellKey,
    idx,
  );
  // Match the desktop cell display: substitution-in raises the top
  // number so a covered cell reads "2 / req 2" — same visual pattern
  // as a naturally-covered green cell.
  const displayStock =
    props.stock + effective.inAllocated - effective.outAllocated;
  const displayReq = props.requested;
  const canSubstitute = effective.shortfall > 0 || effective.surplus > 0;
  const hasAllocs = rowAllocs.length > 0;
  const gap = displayStock - displayReq;
  const tone =
    effective.shortfall > 0
      ? "text-red-700"
      : hasAllocs
        ? "text-amber-700"
        : displayStock > 0 || displayReq > 0
          ? "text-emerald-700"
          : "text-gray-500";

  async function submit(sign: 1 | -1) {
    if (!Number.isFinite(delta) || delta < 1) return;
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
          reason: "adjustment",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setOpen(false);
      setDelta(1);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <li className={hasAllocs ? "bg-amber-50" : ""}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left active:bg-gray-50"
      >
        <div className="w-14 text-xs font-heading font-bold text-brand-dark bg-brand-pale/60 text-center py-1 rounded">
          {props.size}
        </div>
        <div className="flex-1 flex items-center gap-3 text-sm">
          <span
            title={
              hasAllocs
                ? `Raw: ${props.stock} in, ${effective.outAllocated} allocated out`
                : undefined
            }
          >
            <span className="text-gray-500 text-xs uppercase tracking-widest font-heading font-bold mr-1">
              In
            </span>
            <span className="font-heading font-black text-brand-dark">
              {displayStock}
            </span>
          </span>
          <span
            title={
              hasAllocs
                ? `Raw: ${props.requested} requested, ${effective.inAllocated} covered by other SKUs`
                : undefined
            }
          >
            <span className="text-gray-500 text-xs uppercase tracking-widest font-heading font-bold mr-1">
              Req
            </span>
            <span className="font-heading font-black text-brand-dark">
              {displayReq}
            </span>
          </span>
          {props.reserved > 0 && (
            <span
              className="text-[10px] font-heading font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-full"
              title="Reserved via shopping list"
            >
              +{props.reserved}
            </span>
          )}
          <span className={`ml-auto text-xs font-heading font-bold ${tone}`}>
            {gap > 0 ? "+" : ""}
            {gap}
          </span>
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 space-y-2 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              value={delta}
              onChange={(e) => setDelta(Number(e.target.value))}
              className="w-20 border border-gray-200 rounded-md px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() => submit(1)}
              disabled={!!busy}
              className="flex-1 inline-flex items-center justify-center gap-1 bg-brand-green text-white px-3 py-1.5 rounded-md text-xs font-heading font-bold uppercase tracking-widest disabled:opacity-50"
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
              className="flex-1 inline-flex items-center justify-center gap-1 bg-white text-red-700 border border-red-200 px-3 py-1.5 rounded-md text-xs font-heading font-bold uppercase tracking-widest disabled:opacity-50"
            >
              {busy === "remove" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Minus className="h-3.5 w-3.5" />
              )}
              Remove
            </button>
          </div>
          {(canSubstitute || hasAllocs) && props.allEffectiveCells && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setSubstituteOpen(true);
              }}
              className="w-full inline-flex items-center justify-center gap-1 bg-brand-blue/10 text-brand-blue px-3 py-1.5 rounded-md text-xs font-heading font-bold uppercase tracking-widest hover:bg-brand-blue/20"
            >
              <Shuffle className="h-3.5 w-3.5" />
              Substitute
              {hasAllocs && (
                <span className="ml-1 text-[10px] opacity-70">
                  ({rowAllocs.length})
                </span>
              )}
            </button>
          )}
          {error && <p className="text-xs text-red-700">{error}</p>}
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
          existingAllocations={rowAllocs}
        />
      )}
    </li>
  );
}
