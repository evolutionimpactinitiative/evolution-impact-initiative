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

// POST /api/back-to-school/count-sessions — start a new open session.
// The unique partial index blocks concurrent open sessions at the DB
// level, so we can safely fail-fast if one already exists.
export async function POST(request: NextRequest) {
  const auth = await requireTeam();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const body = (await request.json()) as { name?: string };
  const name = body.name?.trim() ||
    `Stock count ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("back_to_school_count_sessions")
    .insert({ name, status: "open", started_by: auth.teamMemberId })
    .select("id")
    .single();

  if (error || !data) {
    // Unique-violation on the partial index → a session's already open.
    if ((error as { code?: string } | null)?.code === "23505") {
      return NextResponse.json(
        { error: "A count session is already open — close it first." },
        { status: 409 },
      );
    }
    console.error("[count-sessions] insert err:", error);
    return NextResponse.json({ error: "Start failed" }, { status: 500 });
  }
  return NextResponse.json({ success: true, id: data.id as string });
}
