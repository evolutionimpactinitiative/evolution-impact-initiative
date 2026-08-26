// Back to School Drive 2026 — stock / SKU model
//
// A SKU is the tuple (category, colour, sleeve, fit, size). Stock is tracked
// per SKU in `back_to_school_stock` and demand is derived at read time from
// approved+pending registrations (children.uniform_choices + sex + uniform_size).

import {
  UNIFORM_SIZES,
  type UniformSize,
  type UniformChoices,
  type ChildSex,
} from "@/lib/back-to-school";

export type StockCategory =
  | "polo"
  | "shirt"
  | "trousers"
  | "skirt"
  | "dress"
  | "shorts";

export type StockColour = "white" | "blue" | "grey" | "black";
export type StockSleeve = "short" | "long" | null;
export type StockFit = "boys" | "girls" | "unisex";

export interface StockSku {
  category: StockCategory;
  colour: StockColour;
  sleeve: StockSleeve;
  fit: StockFit;
  size: string;
}

export interface StockRow extends StockSku {
  id: string;
  quantity: number;
  notes: string | null;
  updated_at: string;
}

export const STOCK_SIZES = UNIFORM_SIZES; // matrix columns

export const CATEGORY_LABELS: Record<StockCategory, string> = {
  polo: "Polo",
  shirt: "Shirt",
  trousers: "Trousers",
  skirt: "Skirt",
  dress: "Dress",
  shorts: "Shorts",
};

export const COLOUR_LABELS: Record<StockColour, string> = {
  white: "White",
  blue: "Blue",
  grey: "Grey",
  black: "Black",
};

export const FIT_LABELS: Record<StockFit, string> = {
  boys: "Boys",
  girls: "Girls",
  unisex: "Unisex",
};

export const SLEEVE_LABELS: Record<"short" | "long", string> = {
  short: "Short sleeve",
  long: "Long sleeve",
};

// Stable key that groups (category, colour, sleeve, fit) — one matrix row per key.
// Sleeve is normalised to empty string when null so keys compare consistently.
export function skuGroupKey(sku: {
  category: StockCategory;
  colour: StockColour;
  sleeve: StockSleeve;
  fit: StockFit;
}): string {
  return `${sku.category}|${sku.colour}|${sku.sleeve ?? ""}|${sku.fit}`;
}

// Full SKU key including size — used to look up a specific stock/demand cell.
export function skuCellKey(sku: StockSku): string {
  return `${skuGroupKey(sku)}|${sku.size}`;
}

// Human-readable row title, e.g. "White polo · long sleeve · Girls".
export function skuGroupLabel(sku: {
  category: StockCategory;
  colour: StockColour;
  sleeve: StockSleeve;
  fit: StockFit;
}): string {
  const parts: string[] = [
    `${COLOUR_LABELS[sku.colour]} ${CATEGORY_LABELS[sku.category].toLowerCase()}`,
  ];
  if (sku.sleeve) parts.push(SLEEVE_LABELS[sku.sleeve]);
  parts.push(FIT_LABELS[sku.fit]);
  return parts.join(" · ");
}

// Map a child's sex to a stock fit. "male"/"female" are exact; "other" and
// "prefer_not_to_say" land in "unisex" — steward can pick either cut on the day.
export function fitFromSex(sex: ChildSex | null): StockFit {
  if (sex === "male") return "boys";
  if (sex === "female") return "girls";
  return "unisex";
}

// Break a child's request into the individual SKU asks (0, 1, 2 or 3 items).
export interface ChildAsk {
  child_id: string;
  sex: ChildSex | null;
  uniform_size: UniformSize;
  uniform_choices: UniformChoices;
}

export function skusForChild(ask: ChildAsk): StockSku[] {
  const fit = fitFromSex(ask.sex);
  const size = ask.uniform_size;
  const skus: StockSku[] = [];

  const bottom = ask.uniform_choices.bottom;
  if (bottom) {
    skus.push({
      category: bottom.type as StockCategory,
      colour: bottom.colour as StockColour,
      sleeve: null,
      fit,
      size,
    });
  }

  const polo = ask.uniform_choices.polo;
  if (polo) {
    skus.push({
      category: "polo",
      colour: polo.colour as StockColour,
      sleeve: polo.sleeve,
      fit,
      size,
    });
  }

  const shirt = ask.uniform_choices.shirt;
  if (shirt) {
    skus.push({
      category: "shirt",
      colour: "white",
      sleeve: shirt.sleeve,
      fit,
      size,
    });
  }

  return skus;
}

// Aggregate demand across many children. Returns a map keyed by skuCellKey.
export function aggregateDemand(asks: ChildAsk[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const ask of asks) {
    for (const sku of skusForChild(ask)) {
      const key = skuCellKey(sku);
      out.set(key, (out.get(key) ?? 0) + 1);
    }
  }
  return out;
}

// Merge a list of stock rows and a demand map into the shape the matrix
// renders — one entry per (category, colour, sleeve, fit) group with a Map
// of size → { stock, requested }.
export interface MatrixGroup {
  key: string;
  category: StockCategory;
  colour: StockColour;
  sleeve: StockSleeve;
  fit: StockFit;
  label: string;
  cells: Map<string, { stock: number; requested: number; stockId: string | null }>;
  totalStock: number;
  totalRequested: number;
}

// True shortfall for a group — sum of per-size shortages. Different from
// (totalRequested − totalStock) because a surplus in one size does NOT
// cancel a shortage in another size within the same group. Use this
// anywhere you'd otherwise write group.totalRequested − group.totalStock.
export function groupShortfall(group: MatrixGroup): number {
  let sum = 0;
  for (const c of group.cells.values()) {
    if (c.requested > c.stock) sum += c.requested - c.stock;
  }
  return sum;
}

// Net across sizes (positive = surplus overall, negative = net short).
// Still useful for the "we're covered overall" indicator alongside the
// true shortfall.
export function groupNetSurplus(group: MatrixGroup): number {
  return group.totalStock - group.totalRequested;
}

// ─── Allocations ───────────────────────────────────────────────────
// A record of "N units of the FROM sku have been earmarked to cover
// demand for the TO sku". Persisted in `back_to_school_stock_allocations`.
// Effect on displayed numbers (applied at read time):
//   FROM cell:  free_stock decreases (that stock is reserved)
//   TO   cell:  demand covered increases (that request is fulfilled)

export interface StockAllocation {
  id: string;
  category: StockCategory;
  from_colour: StockColour;
  from_sleeve: StockSleeve;
  from_fit: StockFit;
  from_size: string;
  to_colour: StockColour;
  to_sleeve: StockSleeve;
  to_fit: StockFit;
  to_size: string;
  qty: number;
  note: string | null;
  created_by: string | null;
  created_at: string;
  // Soft-archive flag — set on 26 Aug 2026 when the August drive
  // closed. Archived allocations still exist for audit but no longer
  // affect free-stock math.
  archived_at: string | null;
}

// Aggregated allocation totals for a single cell — sums across all
// allocations touching this SKU on either side.
export interface CellAllocationSummary {
  outQty: number; // units earmarked FROM this cell to cover other cells
  inQty: number;  // units of demand for this cell being covered by others
}

// Index allocations by cell key for fast lookup during matrix rendering.
export interface AllocationIndex {
  byCell: Map<string, CellAllocationSummary>;
  // Full list — useful for the modal that shows the audit trail.
  all: StockAllocation[];
}

export function indexAllocations(rows: StockAllocation[]): AllocationIndex {
  // Archived allocations (e.g. everything from the closed August
  // drive) still show up in the audit list but don't affect stock.
  const active = rows.filter((a) => !a.archived_at);
  const byCell = new Map<string, CellAllocationSummary>();
  const bump = (key: string, patch: Partial<CellAllocationSummary>) => {
    const cur = byCell.get(key) ?? { outQty: 0, inQty: 0 };
    byCell.set(key, {
      outQty: cur.outQty + (patch.outQty ?? 0),
      inQty: cur.inQty + (patch.inQty ?? 0),
    });
  };
  for (const a of active) {
    const fromKey = skuCellKey({
      category: a.category,
      colour: a.from_colour,
      sleeve: a.from_sleeve,
      fit: a.from_fit,
      size: a.from_size,
    });
    const toKey = skuCellKey({
      category: a.category,
      colour: a.to_colour,
      sleeve: a.to_sleeve,
      fit: a.to_fit,
      size: a.to_size,
    });
    bump(fromKey, { outQty: a.qty });
    bump(toKey, { inQty: a.qty });
  }
  return { byCell, all: rows };
}

// Effective view of a single cell after allocations. Use this everywhere
// we compute shortfall / free stock so the UI + shopping list stay
// consistent.
export interface EffectiveCell {
  stock: number;         // raw stock on the row
  requested: number;     // raw demand
  outAllocated: number;  // stock earmarked out to other SKUs
  inAllocated: number;   // demand covered by other SKUs
  reservedForPick: number; // active pick reservations against this SKU
  freeStock: number;     // stock still available (stock - outAllocated - reservedForPick)
  uncovered: number;     // demand still to satisfy (max(0, requested - inAllocated))
  shortfall: number;     // items still to buy (max(0, uncovered - freeStock))
  surplus: number;       // items free after covering own demand (max(0, freeStock - uncovered))
}

// Pick reservations by SKU cell key. Only counts active ('reserved')
// rows — consumed/released have no effect on available stock.
export type ReservationIndex = Map<string, number>;

export function effectiveCell(
  cell: { stock: number; requested: number } | undefined,
  cellKey: string,
  index: AllocationIndex,
  reservations?: ReservationIndex,
): EffectiveCell {
  const stock = cell?.stock ?? 0;
  const requested = cell?.requested ?? 0;
  const summary = index.byCell.get(cellKey) ?? { outQty: 0, inQty: 0 };
  const outAllocated = summary.outQty;
  const inAllocated = summary.inQty;
  const reservedForPick = reservations?.get(cellKey) ?? 0;
  const freeStock = Math.max(0, stock - outAllocated - reservedForPick);
  const uncovered = Math.max(0, requested - inAllocated);
  const shortfall = Math.max(0, uncovered - freeStock);
  const surplus = Math.max(0, freeStock - uncovered);
  return {
    stock,
    requested,
    outAllocated,
    inAllocated,
    reservedForPick,
    freeStock,
    uncovered,
    shortfall,
    surplus,
  };
}

// Sum of TRUE shortfall for a group, allocations applied.
export function groupShortfallEffective(
  group: MatrixGroup,
  index: AllocationIndex,
): number {
  let sum = 0;
  for (const [size, cell] of group.cells.entries()) {
    const key = skuCellKey({
      category: group.category,
      colour: group.colour,
      sleeve: group.sleeve,
      fit: group.fit,
      size,
    });
    sum += effectiveCell(cell, key, index).shortfall;
  }
  return sum;
}

export function buildMatrix(
  stockRows: StockRow[],
  demand: Map<string, number>,
): MatrixGroup[] {
  const groups = new Map<string, MatrixGroup>();

  const ensureGroup = (sku: {
    category: StockCategory;
    colour: StockColour;
    sleeve: StockSleeve;
    fit: StockFit;
  }): MatrixGroup => {
    const key = skuGroupKey(sku);
    let g = groups.get(key);
    if (!g) {
      g = {
        key,
        category: sku.category,
        colour: sku.colour,
        sleeve: sku.sleeve,
        fit: sku.fit,
        label: skuGroupLabel(sku),
        cells: new Map(),
        totalStock: 0,
        totalRequested: 0,
      };
      groups.set(key, g);
    }
    return g;
  };

  const ensureCell = (g: MatrixGroup, size: string) => {
    let c = g.cells.get(size);
    if (!c) {
      c = { stock: 0, requested: 0, stockId: null };
      g.cells.set(size, c);
    }
    return c;
  };

  for (const row of stockRows) {
    const g = ensureGroup(row);
    const c = ensureCell(g, row.size);
    c.stock += row.quantity;
    c.stockId = row.id;
    g.totalStock += row.quantity;
  }

  for (const [key, count] of demand.entries()) {
    // key = category|colour|sleeve|fit|size
    const parts = key.split("|");
    const [category, colour, sleeveStr, fit, size] = parts;
    const g = ensureGroup({
      category: category as StockCategory,
      colour: colour as StockColour,
      sleeve: (sleeveStr === "" ? null : (sleeveStr as "short" | "long")),
      fit: fit as StockFit,
    });
    const c = ensureCell(g, size);
    c.requested += count;
    g.totalRequested += count;
  }

  return Array.from(groups.values()).sort((a, b) => {
    // Group by category first, then colour, then fit, then sleeve.
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    if (a.colour !== b.colour) return a.colour.localeCompare(b.colour);
    if (a.fit !== b.fit) return a.fit.localeCompare(b.fit);
    return (a.sleeve ?? "").localeCompare(b.sleeve ?? "");
  });
}
