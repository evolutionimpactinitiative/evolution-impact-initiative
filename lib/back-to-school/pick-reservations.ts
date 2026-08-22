// Pick reservations — per-child earmarks of specific SKUs made at
// Station 2. Reduce free stock so a second concurrent steward sees
// the true availability. Converted to stock movements at handout.

import type {
  ReservationIndex,
  StockCategory,
  StockColour,
  StockFit,
  StockSleeve,
} from "@/lib/back-to-school-stock";
import { skuCellKey } from "@/lib/back-to-school-stock";

export type PickReservationStatus = "reserved" | "consumed" | "released";

export interface PickReservation {
  id: string;
  registration_id: string;
  child_id: string;
  category: StockCategory;
  colour: StockColour;
  sleeve: StockSleeve;
  fit: StockFit;
  size: string;
  qty: number;
  original_category: StockCategory | null;
  original_colour: StockColour | null;
  original_sleeve: StockSleeve;
  original_fit: StockFit | null;
  original_size: string | null;
  status: PickReservationStatus;
  reserved_by: string | null;
  reserved_at: string;
  consumed_by: string | null;
  consumed_at: string | null;
  released_by: string | null;
  released_at: string | null;
  note: string | null;
}

export function isSubstitute(r: PickReservation): boolean {
  if (!r.original_size) return false;
  return (
    r.category !== r.original_category ||
    r.colour !== r.original_colour ||
    (r.sleeve ?? "") !== (r.original_sleeve ?? "") ||
    r.fit !== r.original_fit ||
    r.size !== r.original_size
  );
}

// Sum active (reserved) qtys per SKU cell key. Feed the result to
// `effectiveCell(..., reservations)` so the display maths subtract
// them from freeStock.
export function indexReservations(rows: PickReservation[]): ReservationIndex {
  const map = new Map<string, number>();
  for (const r of rows) {
    if (r.status !== "reserved") continue;
    const key = skuCellKey({
      category: r.category,
      colour: r.colour,
      sleeve: r.sleeve,
      fit: r.fit,
      size: r.size,
    });
    map.set(key, (map.get(key) ?? 0) + r.qty);
  }
  return map;
}
