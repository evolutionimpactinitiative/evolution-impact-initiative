import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/back-to-school/count-sessions/[id]/tally
// Body: { category, colour, sleeve|null, fit, size, delta?: number, setTo?: number, notes? }
//   - delta:  increment/decrement (typical +1 tap)
//   - setTo:  overwrite the counted value (used when the user types a
//             number directly)
// If a row for the SKU doesn't exist yet, it's upserted. Session must
// be open — closed sessions are read-only.

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

interface Body {
  category?: string;
  colour?: string;
  sleeve?: string | null;
  fit?: string;
  size?: string;
  delta?: number;
  setTo?: number;
  notes?: string | null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireTeam();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const { id } = await params;
  const body = (await request.json()) as Body;
  if (!body.category || !body.colour || !body.fit || !body.size) {
    return NextResponse.json({ error: "Missing SKU fields" }, { status: 400 });
  }
  if (typeof body.delta !== "number" && typeof body.setTo !== "number") {
    return NextResponse.json({ error: "Provide delta or setTo" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Session must exist + be open.
  const { data: sess } = await admin
    .from("back_to_school_count_sessions")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (!sess) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if ((sess as { status: string }).status !== "open") {
    return NextResponse.json({ error: "Session is closed" }, { status: 409 });
  }

  const sleeve = body.sleeve || null;

  // Look for an existing tally row for this SKU. Sleeve nullability
  // means we need .is(null) vs .eq(value) conditionally.
  const q = admin
    .from("back_to_school_count_tallies")
    .select("id, counted")
    .eq("session_id", id)
    .eq("category", body.category)
    .eq("colour", body.colour)
    .eq("fit", body.fit)
    .eq("size", body.size);
  const { data: existing } = await (sleeve ? q.eq("sleeve", sleeve) : q.is("sleeve", null)).maybeSingle();

  const currentCounted =
    (existing as { counted: number } | null)?.counted ?? 0;
  const nextCounted =
    typeof body.setTo === "number"
      ? Math.max(0, Math.round(body.setTo))
      : Math.max(0, currentCounted + Math.round(body.delta ?? 0));

  if (existing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from("back_to_school_count_tallies")
      .update({
        counted: nextCounted,
        notes: body.notes ?? undefined,
        updated_by: auth.teamMemberId,
      })
      .eq("id", (existing as { id: string }).id);
    if (error) {
      console.error("[count-tally] update err:", error);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from("back_to_school_count_tallies")
      .insert({
        session_id: id,
        category: body.category,
        colour: body.colour,
        sleeve,
        fit: body.fit,
        size: body.size,
        counted: nextCounted,
        notes: body.notes ?? null,
        updated_by: auth.teamMemberId,
      });
    if (error) {
      console.error("[count-tally] insert err:", error);
      return NextResponse.json({ error: "Insert failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, counted: nextCounted });
}
