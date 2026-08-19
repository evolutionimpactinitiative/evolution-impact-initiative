// Types + helpers for the manual stock count feature.

import type {
  StockCategory,
  StockColour,
  StockFit,
  StockSleeve,
} from "@/lib/back-to-school-stock";

export type CountSessionStatus = "open" | "closed" | "cancelled";

export interface CountSession {
  id: string;
  name: string;
  status: CountSessionStatus;
  started_by: string | null;
  started_at: string;
  closed_by: string | null;
  closed_at: string | null;
  notes: string | null;
}

export interface CountTally {
  id: string;
  session_id: string;
  category: StockCategory;
  colour: StockColour;
  sleeve: StockSleeve;
  fit: StockFit;
  size: string;
  counted: number;
  notes: string | null;
  updated_at: string;
  updated_by: string | null;
}

// Reconciliation row — one per SKU that has EITHER a tally or a stock
// row. Used to render the review-and-commit screen.
export interface ReconciliationRow {
  category: StockCategory;
  colour: StockColour;
  sleeve: StockSleeve;
  fit: StockFit;
  size: string;
  label: string;
  systemStock: number;   // what the app thinks we have
  counted: number | null; // what physical count found (null = not counted)
  delta: number;          // counted - systemStock (only meaningful when counted != null)
}

export function tallyKey(t: {
  category: string;
  colour: string;
  sleeve: string | null;
  fit: string;
  size: string;
}): string {
  return [t.category, t.colour, t.sleeve ?? "", t.fit, t.size].join("|");
}
