import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// DELETE /api/back-to-school/pick-reservations/[id]
//   ?stewardToken=xyz optional — allows the walk-in steward flow to
//   release without a team login.
// Marks a reservation as 'released' (soft delete). Consumed reservations
// can't be released (they've already produced a stock movement).

async function resolveActor(stewardToken: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: tm } = await supabase
      .from("team_members")
      .select("id")
      .eq("email", user.email || "")
      .maybeSingle();
    if (tm) return { ok: true as const, teamMemberId: (tm as { id: string }).id };
  }

  if (stewardToken) {
    const admin = createAdminClient();
    const { data: tokenRow } = await admin
      .from("festival_steward_tokens")
      .select("id, revoked_at")
      .eq("token", stewardToken)
      .maybeSingle();
    const token = tokenRow as { id: string; revoked_at: string | null } | null;
    if (token && !token.revoked_at) {
      return { ok: true as const, teamMemberId: null };
    }
  }

  return { ok: false as const, status: 401 };
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const stewardToken = new URL(request.url).searchParams.get("stewardToken");
  const auth = await resolveActor(stewardToken);
  if (!auth.ok) return NextResponse.json({ error: "Not authorised" }, { status: auth.status });

  const { id } = await params;
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("back_to_school_pick_reservations")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  const row = existing as { status: string } | null;
  if (!row) return NextResponse.json({ success: true });
  if (row.status === "consumed") {
    return NextResponse.json(
      { error: "Already consumed — reverse via a stock adjustment instead." },
      { status: 409 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("back_to_school_pick_reservations")
    .update({
      status: "released",
      released_by: auth.teamMemberId,
      released_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    console.error("[pick-reservations] release err:", error);
    return NextResponse.json({ error: "Release failed" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
