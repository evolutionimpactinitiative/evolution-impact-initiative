import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

// POST /api/back-to-school/collection/actions/release
// Release any pick_reservations that are still 'reserved' for a
// registration that never got marked 'attended = yes' — freeing that
// stock back to the pool. Run after the drive is over.
export async function POST(request: NextRequest) {
  const auth = await requireTeam();
  if (!auth.ok) {
    return NextResponse.json({ error: "Not authorised" }, { status: auth.status });
  }
  const { eventId } = (await request.json()) as { eventId?: string };
  if (!eventId) {
    return NextResponse.json({ error: "eventId required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Pull the registrations for this event that were NOT marked as
  // attended. Their reservations are the candidates for release.
  const { data: regs } = await admin
    .from("registrations")
    .select("id, attended")
    .eq("event_id", eventId);
  const noShowIds = ((regs as { id: string; attended: string | null }[] | null) ?? [])
    .filter((r) => r.attended !== "yes")
    .map((r) => r.id);

  if (noShowIds.length === 0) {
    return NextResponse.json({ success: true, message: "Nothing to release." });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: released, error } = await (admin as any)
    .from("back_to_school_pick_reservations")
    .update({
      status: "released",
      released_by: auth.teamMemberId,
      released_at: new Date().toISOString(),
    })
    .in("registration_id", noShowIds)
    .eq("status", "reserved")
    .select("id");
  if (error) {
    console.error("[release] err:", error);
    return NextResponse.json({ error: "Release failed" }, { status: 500 });
  }
  const n = (released as { id: string }[] | null)?.length ?? 0;
  return NextResponse.json({
    success: true,
    message: `Released ${n} reservation${n === 1 ? "" : "s"} back to stock.`,
  });
}
