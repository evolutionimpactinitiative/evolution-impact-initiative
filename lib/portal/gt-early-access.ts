import { createAdminClient } from "@/lib/supabase/admin";

// 1 hour, in milliseconds. The window during which an attended GT
// family can register for a scheduled GT event before the public
// `publish_at` moment.
export const EARLY_ACCESS_MS = 60 * 60 * 1000;

type EventShape = {
  programme?: string | null;
  publish_at?: string | null;
  // Status/registration gates owned by the caller — this module only
  // answers early-access-specific questions.
};

// True if `now` is in the window [publish_at - 1h, publish_at). After
// publish_at the normal public window opens, so early-access becomes
// irrelevant.
export function isInEarlyAccessWindow(
  publishAt: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!publishAt) return false;
  const publishMs = new Date(publishAt).getTime();
  if (Number.isNaN(publishMs)) return false;
  const earlyStart = publishMs - EARLY_ACCESS_MS;
  const nowMs = now.getTime();
  return nowMs >= earlyStart && nowMs < publishMs;
}

// True if the family has ≥1 past registration with attended = 'yes' on
// a Growing Together event. "Past" is anything with event.date <= today
// — a session on today's date counts the moment it's marked attended.
export async function hasFamilyAttendedGt(
  familyId: string | null | undefined,
): Promise<boolean> {
  if (!familyId) return false;
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count, error } = await (admin as any)
    .from("registrations")
    .select("id, events!inner(programme)", { count: "exact", head: true })
    .eq("family_id", familyId)
    .eq("attended", "yes")
    .eq("events.programme", "growing_together");
  if (error) {
    console.error("hasFamilyAttendedGt query failed:", error);
    return false;
  }
  return (count ?? 0) > 0;
}

// Convenience: does this (event, family) pair qualify for early-access
// registration RIGHT NOW? Combines the three criteria:
//   1. Event is Growing Together.
//   2. We're inside the 1h window before publish_at.
//   3. Family has attended ≥1 past GT session.
// Callers that only need one check should call the primitives above.
export async function canUseEarlyAccess(params: {
  event: EventShape;
  familyId: string | null | undefined;
  now?: Date;
}): Promise<boolean> {
  const { event, familyId, now } = params;
  if (event.programme !== "growing_together") return false;
  if (!isInEarlyAccessWindow(event.publish_at, now)) return false;
  return hasFamilyAttendedGt(familyId);
}
