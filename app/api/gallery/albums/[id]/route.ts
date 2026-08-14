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
  return { ok: true as const };
}

interface PatchBody {
  name?: string;
  description?: string | null;
  status?: "draft" | "published" | "archived";
  cover_image_id?: string | null;
}

// PATCH /api/gallery/albums/[id] — update fields (name/description/status/cover).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireTeam();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const { id } = await params;
  const body = (await request.json()) as PatchBody;
  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string") patch.name = body.name.trim();
  if (body.description !== undefined)
    patch.description = body.description ? String(body.description).trim() : null;
  if (body.status) patch.status = body.status;
  if (body.cover_image_id !== undefined)
    patch.cover_image_id = body.cover_image_id;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("gallery_albums")
    .update(patch)
    .eq("id", id);
  if (error) {
    console.error("[gallery-album-patch] err:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

// DELETE /api/gallery/albums/[id] — permanent (images are unlinked, not deleted).
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireTeam();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const { id } = await params;
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("gallery_albums")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("[gallery-album-delete] err:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
