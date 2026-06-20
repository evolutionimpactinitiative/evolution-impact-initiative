// Pure scoring helpers for ONS4 + SWEMWBS.
// No DB, no React — safe to import from server actions, client components,
// or test scripts.

import type { InstrumentItem, InstrumentScoring } from "./types";

export interface ScoreResult {
  raw: number;
  transformed: number | null;
  band: string | null;
}

// ---------------------------------------------------------------------------
// SWEMWBS metric conversion (Warwick-Edinburgh standard)
// Raw sum of 7 items (each 1-5) ranges 7-35 → metric score 7.00-35.00.
// Source: Stewart-Brown et al. (2009), official SWEMWBS scoring instructions.
// ---------------------------------------------------------------------------
const SWEMWBS_METRIC: Record<number, number> = {
  7: 7.0,
  8: 9.51,
  9: 11.25,
  10: 12.4,
  11: 13.33,
  12: 14.08,
  13: 14.75,
  14: 15.32,
  15: 15.84,
  16: 16.36,
  17: 16.88,
  18: 17.43,
  19: 17.98,
  20: 18.59,
  21: 19.25,
  22: 19.98,
  23: 20.73,
  24: 21.54,
  25: 22.35,
  26: 23.21,
  27: 24.11,
  28: 25.03,
  29: 26.02,
  30: 27.03,
  31: 28.13,
  32: 29.31,
  33: 30.7,
  34: 32.55,
  35: 35.0,
};

function swemwbsBand(metric: number): string {
  if (metric < 21) return "low";
  if (metric <= 27) return "average";
  return "high";
}

// ---------------------------------------------------------------------------
// ONS4 — average of 4 questions with anxiety reversed (higher = better).
// Bands follow a simplified composite reading (ONS publishes per-item bands
// rather than a composite, but this is a reasonable summary).
// ---------------------------------------------------------------------------
function ons4Band(avg: number): string {
  if (avg < 5) return "low";
  if (avg < 7.5) return "medium";
  if (avg < 9) return "high";
  return "very_high";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export function scoreResponse(
  items: InstrumentItem[],
  scoring: InstrumentScoring,
  answers: Record<string, number>,
): ScoreResult {
  switch (scoring.method) {
    case "swemwbs": {
      const sum = scoring.item_ids.reduce((s, id) => s + (answers[id] ?? 0), 0);
      const metric = SWEMWBS_METRIC[sum] ?? null;
      return { raw: sum, transformed: metric, band: metric != null ? swemwbsBand(metric) : null };
    }
    case "ons4": {
      // Apply per-item reverse flag from the items definition
      const reverseSet = new Set(
        items.filter((it) => it.reverse).map((it) => it.id),
      );
      let total = 0;
      let n = 0;
      for (const id of scoring.item_ids) {
        const v = answers[id];
        if (v == null) continue;
        total += reverseSet.has(id) ? 10 - v : v;
        n++;
      }
      const avg = n > 0 ? total / n : 0;
      return { raw: Number(avg.toFixed(2)), transformed: null, band: ons4Band(avg) };
    }
    case "sum": {
      const sum = scoring.item_ids.reduce((s, id) => s + (answers[id] ?? 0), 0);
      return { raw: sum, transformed: null, band: null };
    }
    case "average": {
      let total = 0;
      let n = 0;
      for (const id of scoring.item_ids) {
        if (answers[id] != null) {
          total += answers[id];
          n++;
        }
      }
      return {
        raw: n > 0 ? Number((total / n).toFixed(2)) : 0,
        transformed: null,
        band: null,
      };
    }
  }
}

// Convenience: render the band as a friendly label for UI.
export function bandLabel(band: string | null): string {
  switch (band) {
    case "low":
      return "Low";
    case "average":
      return "Average";
    case "medium":
      return "Medium";
    case "high":
      return "High";
    case "very_high":
      return "Very high";
    default:
      return "—";
  }
}
