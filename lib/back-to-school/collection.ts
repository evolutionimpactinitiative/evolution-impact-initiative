// Back to School Collection Day — Sept 5 2026
// A second collection-only drive using stock left over from the
// August drive. Configuration lives here; the seeded events row uses
// these same values (keep in sync).

export const COLLECTION_SLUG = "back-to-school-collection-2026";

export const COLLECTION = {
  slug: COLLECTION_SLUG,
  title: "Back to School Collection Day",
  date: "2026-09-05",
  dateLabel: "Saturday 5 September 2026",
  startTime: "12:00",
  endTime: "15:00",
  timeLabel: "12pm – 3pm",
  graceStart: "15:00",
  graceEnd: "16:00",
  graceLabel: "3pm – 4pm (walk-in only)",
  venueName: "Sunlight Centre",
  venueAddress: "Richmond Road, Gillingham, ME7 1LX",
  venueArea: "Gillingham",
  campaignKey: "back-to-school-collection-2026",
  maxChildrenPerRegistration: 4,
  minChildAge: 4,
  maxChildAge: 12,
  slotDurationMinutes: 30,
  slotCapacity: 20,
} as const;

// Explicit slot list — precomputed so it renders identically on server
// and client, and the API guard sees the same slot boundaries.
// (12:00, 12:30, 13:00, 13:30, 14:00, 14:30 — 6 slots × 20 = 120 capacity)
export const COLLECTION_SLOTS = [
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
] as const;

export type CollectionSlot = (typeof COLLECTION_SLOTS)[number];

// Full ISO for a slot on drive day — used both for storage on the
// registration row and comparison in the capacity guard.
export function slotIso(slot: CollectionSlot): string {
  return `${COLLECTION.date}T${slot}:00+01:00`;
}

export function slotLabel(slot: CollectionSlot): string {
  const [h, m] = slot.split(":").map(Number);
  const endM = m + COLLECTION.slotDurationMinutes;
  const endH = h + Math.floor(endM / 60);
  const endMM = endM % 60;
  const fmt = (hh: number, mm: number) =>
    `${hh}:${mm.toString().padStart(2, "0")}`;
  return `${fmt(h, m)} – ${fmt(endH, endMM)}`;
}

// Normalisation for blacklist matching. Email → lowercased trimmed;
// phone → digits only so "07123 456 789" and "+447123456789" collide.
export function normEmail(email: string | null | undefined): string | null {
  const s = (email ?? "").trim().toLowerCase();
  return s || null;
}
export function normPhone(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits || null;
}
