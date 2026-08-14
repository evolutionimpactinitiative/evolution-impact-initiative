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

// POST /api/gallery/albums/reorder
// Body: { orderedIds: string[] } — the new album order top-to-bottom.
// Team-only. Bulk update display_order in a single round-trip via
// individual UPDATEs (small volume, no need for a stored procedure).
export async function POST(request: NextRequest) {
  const auth = await requireTeam();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const body = (await request.json()) as { orderedIds?: string[] };
  if (!Array.isArray(body.orderedIds) || body.orderedIds.length === 0) {
    return NextResponse.json({ error: "orderedIds required" }, { status: 400 });
  }
  if (body.orderedIds.length > 500) {
    return NextResponse.json({ error: "Too many ids" }, { status: 400 });
  }

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = admin as any;
  const results = await Promise.all(
    body.orderedIds.map((id, i) =>
      client
        .from("gallery_albums")
        .update({ display_order: i + 1 })
        .eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed) {
    console.error("[gallery-albums-reorder] err:", failed.error);
    return NextResponse.json({ error: "Reorder failed" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
