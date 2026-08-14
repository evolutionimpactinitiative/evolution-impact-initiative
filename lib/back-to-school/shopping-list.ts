// Shared model for the shopping list — turns the current stock state +
// active demand + active reservations into "what donors should still
// buy". Used by both the public list page and the admin view.

import type {
  StockCategory,
  StockColour,
  StockFit,
} from "@/lib/back-to-school-stock";
import { skuCellKey, skuGroupLabel } from "@/lib/back-to-school-stock";

export type ReservationStatus = "reserved" | "received" | "cancelled";

export interface ShoppingReservation {
  id: string;
  pledger_id: string;
  category: StockCategory;
  colour: StockColour;
  sleeve: "short" | "long" | null;
  fit: StockFit;
  size: string;
  qty: number;
  status: ReservationStatus;
  notes: string | null;
  created_at: string;
  received_at: string | null;
}

export interface ShoppingPledger {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  delivery_method: "collection" | "drop_off";
  collection_date: string | null;
  collection_time: string | null;
  collection_address: string | null;
  collection_postcode: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// One row in the shopping list — an SKU with its need still open, plus a
// count of what's already reserved so the donor sees "3 more needed" not
// the raw "5 requested".
export interface NeedRow {
  category: StockCategory;
  colour: StockColour;
  sleeve: "short" | "long" | null;
  fit: StockFit;
  size: string;
  label: string;
  requested: number; // pending + approved children asking for this SKU
  inStock: number; // current stock quantity
  reserved: number; // active reservations (not yet received)
  needed: number; // max(0, requested - inStock - reserved)
}

interface BuildArgs {
  demand: Map<string, number>; // from aggregateDemand()
  stockRows: Array<{
    category: string;
    colour: string;
    sleeve: string | null;
    fit: string;
    size: string;
    quantity: number;
  }>;
  reservations: Array<{
    category: string;
    colour: string;
    sleeve: string | null;
    fit: string;
    size: string;
    qty: number;
    status: ReservationStatus;
  }>;
}

// Builds the "what donors should still buy" list — every demanded SKU
// where requested exceeds stock+reserved. Sorted by biggest gap first.
export function buildShoppingList({
  demand,
  stockRows,
  reservations,
}: BuildArgs): NeedRow[] {
  const stockMap = new Map<string, number>();
  for (const s of stockRows) {
    const key = skuCellKey({
      category: s.category as StockCategory,
      colour: s.colour as StockColour,
      sleeve: (s.sleeve as "short" | "long" | null) ?? null,
      fit: s.fit as StockFit,
      size: s.size,
    });
    stockMap.set(key, (stockMap.get(key) ?? 0) + (s.quantity ?? 0));
  }

  const reservedMap = new Map<string, number>();
  for (const r of reservations) {
    if (r.status !== "reserved") continue;
    const key = skuCellKey({
      category: r.category as StockCategory,
      colour: r.colour as StockColour,
      sleeve: (r.sleeve as "short" | "long" | null) ?? null,
      fit: r.fit as StockFit,
      size: r.size,
    });
    reservedMap.set(key, (reservedMap.get(key) ?? 0) + (r.qty ?? 0));
  }

  const rows: NeedRow[] = [];
  for (const [key, requested] of demand.entries()) {
    const parts = key.split("|");
    const [category, colour, sleeveStr, fit, size] = parts;
    const sleeve: "short" | "long" | null =
      sleeveStr === "" ? null : (sleeveStr as "short" | "long");
    const inStock = stockMap.get(key) ?? 0;
    const reserved = reservedMap.get(key) ?? 0;
    const needed = Math.max(0, requested - inStock - reserved);
    if (needed === 0) continue;
    rows.push({
      category: category as StockCategory,
      colour: colour as StockColour,
      sleeve,
      fit: fit as StockFit,
      size,
      label: skuGroupLabel({
        category: category as StockCategory,
        colour: colour as StockColour,
        sleeve,
        fit: fit as StockFit,
      }),
      requested,
      inStock,
      reserved,
      needed,
    });
  }

  rows.sort((a, b) => b.needed - a.needed);
  return rows;
}

// Aggregate a list of reservations to a map of skuCellKey -> total qty.
// Used by the stock page to render the amber "N reserved" pill and by
// the shopping list page to subtract from need.
export function aggregateReservations(
  reservations: Array<{
    category: string;
    colour: string;
    sleeve: string | null;
    fit: string;
    size: string;
    qty: number;
    status: ReservationStatus;
  }>,
): Map<string, number> {
  const out = new Map<string, number>();
  for (const r of reservations) {
    if (r.status !== "reserved") continue;
    const key = skuCellKey({
      category: r.category as StockCategory,
      colour: r.colour as StockColour,
      sleeve: (r.sleeve as "short" | "long" | null) ?? null,
      fit: r.fit as StockFit,
      size: r.size,
    });
    out.set(key, (out.get(key) ?? 0) + (r.qty ?? 0));
  }
  return out;
}
