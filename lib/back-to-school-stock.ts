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
