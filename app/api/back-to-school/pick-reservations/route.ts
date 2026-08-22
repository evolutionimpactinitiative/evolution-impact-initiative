import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/back-to-school/pick-reservations
// Body: {
//   registrationId,
//   items: [
//     {
//       childId,
//       chosen:   { category, colour, sleeve|null, fit, size, qty? },
//       original: { category, colour, sleeve|null, fit, size } | null,
//       note?
//     }, ...
//   ],
//   stewardToken?: string
// }
//
// Behaviour: for each item, RELEASES any existing active reservation
// (same child + same original SKU slot) then creates a fresh one for
// the chosen SKU. Batch so a whole family scan is one round-trip.
//
// Auth: team member OR valid non-revoked steward token for the event.

interface SkuRef {
  category?: string;
  colour?: string;
  sleeve?: string | null;
  fit?: string;
  size?: string;
  qty?: number;
}

interface Item {
  childId?: string;
  chosen?: SkuRef;
  original?: SkuRef | null;
  note?: string;
}

interface Body {
  registrationId?: string;
  items?: Item[];
  stewardToken?: string;
}

async function resolveActor(stewardToken: string | undefined): Promise<
  | { ok: true; teamMemberId: string | null; role: "team" | "steward" }
  | { ok: false; status: number; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: tm } = await supabase
      .from("team_members")
      .select("id")
      .eq("email", user.email || "")
      .maybeSingle();
    if (tm) {
      return { ok: true, teamMemberId: (tm as { id: string }).id, role: "team" };
    }
  }

  // Steward-token fallback — used by the walk-in scanner flow which
  // isn't authenticated as a team member.
  if (stewardToken) {
    const admin = createAdminClient();
    const { data: tokenRow } = await admin
      .from("festival_steward_tokens")
      .select("id, revoked_at")
      .eq("token", stewardToken)
      .maybeSingle();
    const token = tokenRow as { id: string; revoked_at: string | null } | null;
    if (token && !token.revoked_at) {
      return { ok: true, teamMemberId: null, role: "steward" };
    }
  }

  return { ok: false, status: 401, error: "Not authorised" };
}

function normalizeSku(s: SkuRef | null | undefined) {
  if (!s || !s.category || !s.colour || !s.fit || !s.size) return null;
  return {
    category: s.category,
    colour: s.colour,
    sleeve: s.sleeve ?? null,
    fit: s.fit,
    size: s.size,
    qty: Math.max(1, Math.round(s.qty ?? 1)),
  };
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Body;
  const auth = await resolveActor(body.stewardToken);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!body.registrationId || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "registrationId + items required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Validate all items first so we don't half-write a batch.
  type Prepared = {
    childId: string;
    chosen: NonNullable<ReturnType<typeof normalizeSku>>;
    original: ReturnType<typeof normalizeSku>;
    note: string | null;
  };
  const prepared: Prepared[] = [];
  for (const it of body.items) {
    if (!it.childId) {
      return NextResponse.json({ error: "childId required per item" }, { status: 400 });
    }
    const chosen = normalizeSku(it.chosen);
    if (!chosen) {
      return NextResponse.json({ error: "chosen SKU incomplete" }, { status: 400 });
    }
    const original = normalizeSku(it.original ?? null);
    prepared.push({
      childId: it.childId,
      chosen,
      original,
      note: it.note?.trim() || null,
    });
  }

  // Release existing active reservations for the same (child + original slot)
  // so a re-prep swaps cleanly instead of stacking.
  for (const p of prepared) {
    if (!p.original) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q = (admin as any)
      .from("back_to_school_pick_reservations")
      .update({
        status: "released",
        released_by: auth.teamMemberId,
        released_at: new Date().toISOString(),
      })
      .eq("child_id", p.childId)
      .eq("status", "reserved")
      .eq("original_category", p.original.category)
      .eq("original_colour", p.original.colour)
      .eq("original_fit", p.original.fit)
      .eq("original_size", p.original.size);
    await (p.original.sleeve
      ? q.eq("original_sleeve", p.original.sleeve)
      : q.is("original_sleeve", null));
  }

  // Bulk insert new reservations.
  const rows = prepared.map((p) => ({
    registration_id: body.registrationId,
    child_id: p.childId,
    category: p.chosen.category,
    colour: p.chosen.colour,
    sleeve: p.chosen.sleeve,
    fit: p.chosen.fit,
    size: p.chosen.size,
    qty: p.chosen.qty,
    original_category: p.original?.category ?? null,
    original_colour: p.original?.colour ?? null,
    original_sleeve: p.original?.sleeve ?? null,
    original_fit: p.original?.fit ?? null,
    original_size: p.original?.size ?? null,
    status: "reserved",
    reserved_by: auth.teamMemberId,
    note: p.note,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("back_to_school_pick_reservations")
    .insert(rows)
    .select("id");

  if (error) {
    console.error("[pick-reservations] insert err:", error);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
  return NextResponse.json({
    success: true,
    ids: (data as { id: string }[] | null)?.map((r) => r.id) ?? [],
  });
}
