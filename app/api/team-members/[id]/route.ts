import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// PATCH /api/team-members/[id]
// Chair-only. Right now only accepts { is_treasurer: boolean } so that a
// widened settings page doesn't accidentally become a role editor — add
// more fields explicitly when needed.

async function requireChair() {
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

interface Body {
  is_treasurer?: boolean;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireChair();
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? "Not signed in." : "Only the chair can update team members." },
      { status: auth.status },
    );
  }

  const { id } = await params;
  const body = (await request.json()) as Body;
  const patch: Record<string, unknown> = {};
  if (typeof body.is_treasurer === "boolean") {
    patch.is_treasurer = body.is_treasurer;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("team_members")
    .update(patch)
    .eq("id", id);
  if (error) {
    console.error("[team-members] patch err:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
