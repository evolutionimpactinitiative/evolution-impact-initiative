import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { makeVillageStoragePath, VILLAGE_BUCKET, villagePublicUrl } from "@/lib/village/storage";

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

const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);
const MAX_BYTES = 10 * 1024 * 1024;

// POST /api/village/images — single-file cover image upload.
// Returns { url } — the caller writes it into a village_posts.cover_image_url.
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

  const path = makeVillageStoragePath(file.name);
  const admin = createAdminClient();
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: uploadErr } = await admin.storage
    .from(VILLAGE_BUCKET)
    .upload(path, bytes, {
      contentType: file.type,
      upsert: false,
    });
  if (uploadErr) {
    console.error("[village-images] upload err:", uploadErr);
    return NextResponse.json(
      { error: "Upload failed — try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, url: villagePublicUrl(path), path });
}
