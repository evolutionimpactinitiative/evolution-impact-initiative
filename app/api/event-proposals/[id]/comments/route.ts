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

// POST /api/event-proposals/[id]/comments — append a comment to the
// discussion thread. Team-only, plain human comment (is_system=false).

interface Body {
  body?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireTeam();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const { id } = await params;
  const body = (await request.json()) as Body;
  const text = (body.body ?? "").trim();
  if (!text) return NextResponse.json({ error: "Empty comment" }, { status: 400 });
  if (text.length > 2000) {
    return NextResponse.json({ error: "Comment too long" }, { status: 400 });
  }

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("event_proposal_comments")
    .insert({
      proposal_id: id,
      author_id: auth.teamMemberId,
      body: text,
      is_system: false,
    });
  if (error) {
    console.error("[proposal-comments] insert err:", error);
    return NextResponse.json({ error: "Post failed" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
