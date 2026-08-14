import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireTeam() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: "Unauthorized" };
  const { data: teamMember } = await supabase
    .from("team_members")
    .select("id")
    .eq("email", user.email || "")
    .maybeSingle();
  if (!teamMember) return { ok: false as const, status: 403, error: "Forbidden" };
  return { ok: true as const, teamMemberId: (teamMember as { id: string }).id };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

interface Body {
  name?: string;
  slug?: string;
  description?: string;
  status?: "draft" | "published" | "archived";
}

// POST /api/gallery/albums — create a new album.
export async function POST(request: NextRequest) {
  const auth = await requireTeam();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await request.json()) as Body;
  const name = (body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }
  const slug = slugify(body.slug ?? name);
  if (!slug) {
    return NextResponse.json({ error: "Slug required" }, { status: 400 });
  }

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin as any)
    .from("gallery_albums")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: "That slug is taken — try another." },
      { status: 409 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: maxRow } = await (admin as any)
    .from("gallery_albums")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = ((maxRow as { display_order: number } | null)?.display_order ?? 0) + 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: created, error } = await (admin as any)
    .from("gallery_albums")
    .insert({
      name,
      slug,
      description: (body.description ?? "").trim() || null,
      status: body.status ?? "published",
      display_order: nextOrder,
      created_by: auth.teamMemberId,
    })
    .select("id, slug")
    .single();
  if (error || !created) {
    console.error("[gallery-albums] insert err:", error);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
  return NextResponse.json({ success: true, album: created });
}
