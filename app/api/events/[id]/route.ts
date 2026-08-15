import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// DELETE /api/events/[id]
// Chair-only. Cascades all registration-related tables (registrations,
// notifications, festival tickets/stewards/etc). Blocked if any donations
// are tagged to the event — those get a "detach or move first" error so
// we never lose an audit trail on donated money.

async function requireAdmin() {
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
  const tm = teamMember as { id: string; role: string | null } | null;
  if (!tm) return { ok: false as const, status: 403 };
  if (tm.role !== "admin") return { ok: false as const, status: 403 };
  return { ok: true as const };
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json(
      {
        error:
          auth.status === 401
            ? "Not signed in."
            : "Only the chair can delete events.",
      },
      { status: auth.status },
    );
  }

  const { id } = await params;
  const admin = createAdminClient();

  // Safety check: refuse if any donations are tagged to this event, so
  // the finance trail stays intact. The FK is NO ACTION, so we'd fail
  // anyway — but this returns a friendly message.
  const { count: donationCount } = await admin
    .from("donations")
    .select("id", { count: "exact", head: true })
    .eq("event_id", id);
  if ((donationCount ?? 0) > 0) {
    return NextResponse.json(
      {
        error: `Can't delete — ${donationCount} donation${donationCount === 1 ? "" : "s"} are tagged to this event. Reassign or untag them first from Donations.`,
      },
      { status: 409 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any).from("events").delete().eq("id", id);
  if (error) {
    console.error("[events] delete err:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
