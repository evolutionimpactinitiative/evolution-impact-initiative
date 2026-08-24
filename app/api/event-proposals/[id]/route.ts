import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PROPOSAL_REVIEWER_EMAIL } from "@/lib/event-proposals/constants";

async function requireTeam() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401 };
  const email = (user.email || "").toLowerCase();
  const { data: teamMember } = await supabase
    .from("team_members")
    .select("id, role")
    .eq("email", email)
    .maybeSingle();
  if (!teamMember) return { ok: false as const, status: 403 };
  const tm = teamMember as { id: string; role: string | null };
  return {
    ok: true as const,
    teamMemberId: tm.id,
    role: tm.role,
    email,
    isReviewer: email === PROPOSAL_REVIEWER_EMAIL,
  };
}

// Every column the wizard is allowed to touch. Everything else (status,
// created_by, spawned_event_id, reviewed_by/at, etc) is set by dedicated
// endpoints to prevent client tampering.
const ALLOWED_FIELDS = new Set([
  "title",
  "event_types",
  "event_type_other",
  "summary",
  "preferred_date",
  "alt_date",
  "event_start_time",
  "event_end_time",
  "setup_start_time",
  "packdown_end_time",
  "primary_venue_name",
  "primary_venue_address",
  "primary_venue_type",
  "primary_venue_notes",
  "alt_venue_name",
  "alt_venue_address",
  "alt_venue_type",
  "age_groups",
  "expected_participants",
  "plus_parents_carers",
  "accessibility_notes",
  "event_aim",
  "objectives",
  "learning_outcomes",
  "schedule",
  "activities",
  "event_planner_id",
  "event_facilitator_id",
  "event_facilitator_external",
  "assistant_volunteer_ids",
  "assistant_volunteers_external",
  "staff_needed",
  "ratio_adults",
  "ratio_children",
  "safeguarding_practices",
  "safeguarding_notes",
  "equipment",
  "equipment_source",
  "cost_lines",
  "funding_pot_ids",
  "key_risks",
  "contingency_plan",
  "promotion_channels",
  "registration_method",
  "registration_notes",
  "success_measures",
  "photo_video_consent_default",
]);

// PATCH /api/event-proposals/[id] — partial update. Whitelist enforced.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireTeam();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (ALLOWED_FIELDS.has(k)) patch[k] = v;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  // Edits allowed for: the person who created the proposal, OR the
  // designated reviewer (info@). And only while the proposal is still
  // in an editable status — approved/rejected are frozen (spawned
  // event or rejection reason preserve intent from that point on).
  const admin = createAdminClient();
  const { data: current } = await admin
    .from("event_proposals")
    .select("status, created_by")
    .eq("id", id)
    .maybeSingle();
  const row = current as { status: string; created_by: string | null } | null;
  if (!row) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }
  if (row.status === "approved" || row.status === "rejected") {
    return NextResponse.json(
      { error: `Proposal is ${row.status} — edits locked. Ask an admin to re-open if this is wrong.` },
      { status: 409 },
    );
  }
  const isCreator = row.created_by === auth.teamMemberId;
  if (!isCreator && !auth.isReviewer) {
    return NextResponse.json(
      { error: "Only the person who submitted the proposal or the reviewer (info@) can edit it." },
      { status: 403 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("event_proposals")
    .update(patch)
    .eq("id", id);
  if (error) {
    console.error("[event-proposals] patch err:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

// DELETE /api/event-proposals/[id] — permanent. Any team member can bin a
// draft or rejected proposal; the chair (admin) can bin anything (needed
// to clean up test data + genuine mistakes). Discussion comments cascade.
// Note: this does NOT touch the spawned draft event — delete that
// separately via /admin/events if you want it gone too.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireTeam();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const { id } = await params;
  const admin = createAdminClient();

  const { data: current } = await admin
    .from("event_proposals")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  const status = (current as { status: string } | null)?.status;
  if (!status) return NextResponse.json({ success: true });

  const isDraftOrRejected = status === "draft" || status === "rejected";
  if (!isDraftOrRejected && auth.role !== "admin") {
    return NextResponse.json(
      { error: `Only the chair can delete a ${status} proposal.` },
      { status: 403 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("event_proposals")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("[event-proposals] delete err:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
