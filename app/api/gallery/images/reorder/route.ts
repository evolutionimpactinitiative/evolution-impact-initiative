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

// POST /api/gallery/images/reorder
// Body: { albumId, orderedIds: string[] } — new image order within the album.
// Team-only. All ids must belong to the given album (server-side check).
export async function POST(request: NextRequest) {
  const auth = await requireTeam();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const body = (await request.json()) as {
    albumId?: string;
    orderedIds?: string[];
  };
  if (!body.albumId) {
    return NextResponse.json({ error: "albumId required" }, { status: 400 });
  }
  if (!Array.isArray(body.orderedIds) || body.orderedIds.length === 0) {
    return NextResponse.json({ error: "orderedIds required" }, { status: 400 });
  }
  if (body.orderedIds.length > 1000) {
    return NextResponse.json({ error: "Too many ids" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Guard — every id in the payload must belong to this album, otherwise a
  // malicious caller could reshuffle another album's ordering.
  const { data: existing } = await admin
    .from("gallery_images")
    .select("id")
    .in("id", body.orderedIds)
    .eq("album_id", body.albumId);
  const existingIds = new Set(
    ((existing as { id: string }[] | null) ?? []).map((r) => r.id),
  );
  const rogue = body.orderedIds.find((id) => !existingIds.has(id));
  if (rogue) {
    return NextResponse.json(
      { error: "One or more images don't belong to this album" },
      { status: 400 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = admin as any;
  const results = await Promise.all(
    body.orderedIds.map((id, i) =>
      client
        .from("gallery_images")
        .update({ display_order: i + 1 })
        .eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed) {
    console.error("[gallery-images-reorder] err:", failed.error);
    return NextResponse.json({ error: "Reorder failed" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
