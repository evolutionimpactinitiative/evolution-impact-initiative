import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { B2S_SLUG } from "@/lib/back-to-school";
import {
  COLLECTION_SLUG,
  normEmail,
  normPhone,
} from "@/lib/back-to-school/collection";

async function requireTeam() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401 };
  const { data: tm } = await supabase
    .from("team_members")
    .select("id")
    .eq("email", user.email || "")
    .maybeSingle();
  if (!tm) return { ok: false as const, status: 403 };
  return { ok: true as const, teamMemberId: (tm as { id: string }).id };
}

// POST /api/back-to-school/collection/actions/blacklist
// Finds every parent who no-showed BOTH the August drive AND the
// Collection Day, and inserts a blacklist row (idempotent — skips
// people already blacklisted). Match on normalised email + phone.
export async function POST() {
  const auth = await requireTeam();
  if (!auth.ok) {
    return NextResponse.json({ error: "Not authorised" }, { status: auth.status });
  }

  const admin = createAdminClient();

  // Both event IDs
  const { data: eventRows } = await admin
    .from("events")
    .select("id, slug")
    .in("slug", [B2S_SLUG, COLLECTION_SLUG]);
  const bySlug = new Map<string, string>();
  for (const r of ((eventRows as { id: string; slug: string }[] | null) ?? [])) {
    bySlug.set(r.slug, r.id);
  }
  const augustId = bySlug.get(B2S_SLUG);
  const collectionId = bySlug.get(COLLECTION_SLUG);
  if (!augustId || !collectionId) {
    return NextResponse.json(
      { error: "Both drives must exist to auto-blacklist double no-shows." },
      { status: 500 },
    );
  }

  // Collect (email, phone, name) tuples of parents who no-showed each drive.
  //   August no-show = registration flagged with cancellation_reason
  //     = 'august_no_show' by the 26 Aug archive migration.
  //   Collection no-show = registration on the collection event that
  //     is NOT attended='yes' and NOT cancelled (parent didn't opt out).
  const { data: noShowsRaw } = await admin
    .from("registrations")
    .select("event_id, parent_name, parent_email, parent_phone, attended, status, cancellation_reason")
    .in("event_id", [augustId, collectionId]);
  type Row = {
    event_id: string;
    parent_name: string;
    parent_email: string;
    parent_phone: string;
    attended: string | null;
    status: string;
    cancellation_reason: string | null;
  };
  const rows = (noShowsRaw as Row[] | null) ?? [];

  interface Bucket {
    email: string | null;
    phone: string | null;
    name: string;
    augustNoShow: boolean;
    collectionNoShow: boolean;
  }
  const buckets = new Map<string, Bucket>();
  for (const r of rows) {
    const e = normEmail(r.parent_email);
    const p = normPhone(r.parent_phone);
    const key = `${e ?? ""}|${p ?? ""}`;
    if (!key || key === "|") continue;
    const isAugust = r.event_id === augustId;
    const isNoShow = isAugust
      ? r.cancellation_reason === "august_no_show"
      : r.attended !== "yes" && r.status !== "cancelled";
    const cur = buckets.get(key) ?? {
      email: e,
      phone: p,
      name: r.parent_name,
      augustNoShow: false,
      collectionNoShow: false,
    };
    if (isNoShow) {
      if (isAugust) cur.augustNoShow = true;
      else cur.collectionNoShow = true;
    }
    buckets.set(key, cur);
  }

  const doubleNoShows = Array.from(buckets.values()).filter(
    (b) => b.augustNoShow && b.collectionNoShow,
  );

  if (doubleNoShows.length === 0) {
    return NextResponse.json({
      success: true,
      message: "Nobody qualifies yet — nobody no-showed both drives.",
    });
  }

  // Skip anyone already on the active blacklist (by email or phone).
  const { data: existing } = await admin
    .from("back_to_school_blacklist")
    .select("email, phone")
    .is("released_at", null);
  const existingKeys = new Set<string>();
  for (const b of ((existing as { email: string | null; phone: string | null }[] | null) ?? [])) {
    if (b.email) existingKeys.add(`e:${b.email}`);
    if (b.phone) existingKeys.add(`p:${b.phone}`);
  }
  const fresh = doubleNoShows.filter((b) => {
    if (b.email && existingKeys.has(`e:${b.email}`)) return false;
    if (b.phone && existingKeys.has(`p:${b.phone}`)) return false;
    return true;
  });

  if (fresh.length === 0) {
    return NextResponse.json({
      success: true,
      message: `${doubleNoShows.length} double no-shows found, but all are already blacklisted.`,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("back_to_school_blacklist")
    .insert(
      fresh.map((b) => ({
        email: b.email,
        phone: b.phone,
        parent_name: b.name,
        reason: "no_show_both_drives",
        notes: "Auto-flagged — did not collect from Aug 2026 drive or Sept 2026 collection day.",
        added_by: auth.teamMemberId,
      })),
    );
  if (error) {
    console.error("[blacklist] err:", error);
    return NextResponse.json({ error: "Blacklist insert failed" }, { status: 500 });
  }
  return NextResponse.json({
    success: true,
    message: `Blacklisted ${fresh.length} parent${fresh.length === 1 ? "" : "s"} who no-showed both drives.`,
  });
}
