import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireTeam() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401 };
  const { data: teamMember } = await supabase
    .from("team_members")
    .select("id, role")
    .eq("email", user.email || "")
    .maybeSingle();
  if (!teamMember) return { ok: false as const, status: 403 };
  const tm = teamMember as { id: string; role: string | null };
  return {
    ok: true as const,
    teamMemberId: tm.id,
    role: tm.role,
  };
}

// POST /api/event-proposals/[id]/status
// Body: { status: 'submitted' | 'in_review' | 'needs_info' | 'approved'
//                | 'rejected', note?: string }
//
// Any team member can submit / move-to-review / mark-needs-info.
// Approve + reject are gated to admin (chair). Every transition writes
// a system comment to the proposal thread for audit.

const VALID_TRANSITIONS = [
  "submitted",
  "in_review",
  "needs_info",
  "approved",
  "rejected",
] as const;
type Status = (typeof VALID_TRANSITIONS)[number];

interface Body {
  status?: string;
  note?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireTeam();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const { id } = await params;
  const body = (await request.json()) as Body;
  if (!body.status || !VALID_TRANSITIONS.includes(body.status as Status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const nextStatus = body.status as Status;

  // Chair-only actions: approve + reject
  if ((nextStatus === "approved" || nextStatus === "rejected") &&
      auth.role !== "admin") {
    return NextResponse.json(
      { error: "Only the chair (admin) can approve or reject proposals." },
      { status: 403 },
    );
  }

  const admin = createAdminClient();
  const { data: current } = await admin
    .from("event_proposals")
    .select("id, title, status")
    .eq("id", id)
    .maybeSingle();
  const proposal = current as {
    id: string;
    title: string;
    status: string;
  } | null;
  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  const update: Record<string, unknown> = { status: nextStatus };
  const now = new Date().toISOString();
  if (nextStatus === "submitted") {
    update.submitted_by = auth.teamMemberId;
    update.submitted_at = now;
  } else if (nextStatus === "approved" || nextStatus === "rejected") {
    update.reviewed_by = auth.teamMemberId;
    update.reviewed_at = now;
    if (nextStatus === "rejected" && body.note) {
      update.rejection_reason = body.note;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateErr } = await (admin as any)
    .from("event_proposals")
    .update(update)
    .eq("id", id);
  if (updateErr) {
    console.error("[proposal-status] update err:", updateErr);
    return NextResponse.json({ error: "Status change failed" }, { status: 500 });
  }

  // Write a system comment for audit + timeline.
  const systemBody =
    nextStatus === "submitted"
      ? "Submitted for board review."
      : nextStatus === "in_review"
        ? "Moved to review."
        : nextStatus === "needs_info"
          ? `Requested more info${body.note ? `: ${body.note}` : "."}`
          : nextStatus === "approved"
            ? `Approved${body.note ? `: ${body.note}` : "."}`
            : `Rejected${body.note ? `: ${body.note}` : "."}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from("event_proposal_comments")
    .insert({
      proposal_id: id,
      author_id: auth.teamMemberId,
      body: systemBody,
      is_system: true,
    });

  return NextResponse.json({ success: true, status: nextStatus });
}
