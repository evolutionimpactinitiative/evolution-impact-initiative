import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { makeStoragePath, GALLERY_BUCKET } from "@/lib/gallery/storage";

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

const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);
const MAX_BYTES = 10 * 1024 * 1024;

// POST /api/gallery/images — multipart upload. Fields:
//   file (required), albumId, title, description, altText,
//   photographerCredit, width, height, status
export async function POST(request: NextRequest) {
  const auth = await requireTeam();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File missing" }, { status: 400 });
  }
  if (!ACCEPTED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported type ${file.type}` },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File too large — max 10 MB" },
      { status: 400 },
    );
  }

  const path = makeStoragePath(file.name);
  const admin = createAdminClient();
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: uploadErr } = await admin.storage
    .from(GALLERY_BUCKET)
    .upload(path, bytes, {
      contentType: file.type,
      upsert: false,
    });
  if (uploadErr) {
    console.error("[gallery-images] upload err:", uploadErr);
    return NextResponse.json(
      { error: "Upload failed — try again." },
      { status: 500 },
    );
  }

  const albumId = (form.get("albumId") as string | null) || null;
  const title = (form.get("title") as string | null)?.trim() || null;
  const description = (form.get("description") as string | null)?.trim() || null;
  const altText = (form.get("altText") as string | null)?.trim() || null;
  const photographerCredit =
    (form.get("photographerCredit") as string | null)?.trim() || null;
  const width = Number(form.get("width")) || null;
  const height = Number(form.get("height")) || null;
  const status =
    (form.get("status") as "draft" | "published" | "archived" | null) ||
    "published";

  // Sit new images at the end of the album's order.
  let nextOrder = 1;
  if (albumId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: last } = await (admin as any)
      .from("gallery_images")
      .select("display_order")
      .eq("album_id", albumId)
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    nextOrder =
      ((last as { display_order: number } | null)?.display_order ?? 0) + 1;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: created, error: insertErr } = await (admin as any)
    .from("gallery_images")
    .insert({
      album_id: albumId,
      storage_path: path,
      title,
      description,
      alt_text: altText,
      photographer_credit: photographerCredit,
      display_order: nextOrder,
      width,
      height,
      file_size_bytes: file.size,
      content_type: file.type,
      status,
      created_by: auth.teamMemberId,
    })
    .select("id")
    .single();

  if (insertErr || !created) {
    console.error("[gallery-images] insert err:", insertErr);
    // Roll back the storage upload to avoid orphans
    await admin.storage.from(GALLERY_BUCKET).remove([path]);
    return NextResponse.json(
      { error: "Metadata save failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    image: { id: (created as { id: string }).id, storage_path: path },
  });
}
