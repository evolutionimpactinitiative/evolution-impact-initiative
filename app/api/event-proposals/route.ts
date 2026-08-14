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
    .select("id")
    .eq("email", user.email || "")
    .maybeSingle();
  if (!teamMember) return { ok: false as const, status: 403 };
  return { ok: true as const, teamMemberId: (teamMember as { id: string }).id };
}

// POST /api/event-proposals — create a new draft proposal.
// Body: { title } — enough to spawn a row; rest is filled in via wizard PATCHes.
export async function POST(request: NextRequest) {
  const auth = await requireTeam();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const body = (await request.json()) as { title?: string };
  const title = (body.title ?? "Untitled event").trim().slice(0, 200);

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("event_proposals")
    .insert({
      title,
      status: "draft",
      created_by: auth.teamMemberId,
      event_planner_id: auth.teamMemberId,
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error("[event-proposals] create err:", error);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
  return NextResponse.json({ id: (data as { id: string }).id });
}
