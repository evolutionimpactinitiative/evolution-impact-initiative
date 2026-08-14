import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { GALLERY_BUCKET } from "@/lib/gallery/storage";

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
  title?: string | null;
  description?: string | null;
  alt_text?: string | null;
  photographer_credit?: string | null;
  status?: "draft" | "published" | "archived";
  album_id?: string | null;
}

// PATCH — edit metadata.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireTeam();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const { id } = await params;
  const body = (await request.json()) as PatchBody;
  const patch: Record<string, unknown> = {};
  for (const key of [
    "title",
    "description",
    "alt_text",
    "photographer_credit",
  ] as const) {
    if (body[key] !== undefined) {
      const v = body[key];
      patch[key] = typeof v === "string" ? v.trim() || null : v;
    }
  }
  if (body.status) patch.status = body.status;
  if (body.album_id !== undefined) patch.album_id = body.album_id;
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("gallery_images")
    .update(patch)
    .eq("id", id);
  if (error) {
    console.error("[gallery-image-patch] err:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

// DELETE — remove image + storage object.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireTeam();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const { id } = await params;
  const admin = createAdminClient();

  const { data: row } = await admin
    .from("gallery_images")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  const path = (row as { storage_path: string } | null)?.storage_path;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: delErr } = await (admin as any)
    .from("gallery_images")
    .delete()
    .eq("id", id);
  if (delErr) {
    console.error("[gallery-image-delete] err:", delErr);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  // Remove object last — DB row is the source of truth.
  if (path) {
    await admin.storage.from(GALLERY_BUCKET).remove([path]);
  }
  return NextResponse.json({ success: true });
}
