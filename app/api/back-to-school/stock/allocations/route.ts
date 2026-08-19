import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/back-to-school/stock/allocations
// Body: { category, from: { colour, sleeve|null, fit, size },
//                    to:   { colour, sleeve|null, fit, size }, qty, note? }
// Team-only. Guards:
//   - FROM ≠ TO (would be a no-op)
//   - qty > 0
//   - qty ≤ currently free stock on the FROM cell (can't earmark more
//     than we have — protects against double-committing).

interface CellRef {
  colour?: string;
  sleeve?: string | null;
  fit?: string;
  size?: string;
}

interface Body {
  category?: string;
  from?: CellRef;
  to?: CellRef;
  qty?: number;
  note?: string;
}

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

function keyOf(category: string, c: Required<CellRef>): string {
  return [category, c.colour, c.sleeve ?? "", c.fit, c.size].join("|");
}

export async function POST(request: NextRequest) {
  const auth = await requireTeam();
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const body = (await request.json()) as Body;
  if (!body.category) {
    return NextResponse.json({ error: "category required" }, { status: 400 });
  }
  if (!body.qty || body.qty <= 0) {
    return NextResponse.json({ error: "qty must be > 0" }, { status: 400 });
  }
  const from = body.from;
  const to = body.to;
  if (
    !from?.colour || !from?.fit || !from?.size ||
    !to?.colour   || !to?.fit   || !to?.size
  ) {
    return NextResponse.json(
      { error: "from + to must include colour, fit, size" },
      { status: 400 },
    );
  }
  const fromKey = keyOf(body.category, from as Required<CellRef>);
  const toKey = keyOf(body.category, to as Required<CellRef>);
  if (fromKey === toKey) {
    return NextResponse.json(
      { error: "FROM and TO must be different SKUs" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Guard: free stock on the FROM cell must be ≥ qty. Sum stock rows +
  // subtract prior outbound allocations. Sleeve is nullable, so build
  // the filter chain with .is(null) or .eq(value) as needed.
  const stockQuery = admin
    .from("back_to_school_stock")
    .select("quantity")
    .eq("category", body.category)
    .eq("colour", from.colour)
    .eq("fit", from.fit)
    .eq("size", from.size);
  const stockScoped = from.sleeve
    ? stockQuery.eq("sleeve", from.sleeve)
    : stockQuery.is("sleeve", null);
  const { data: stockRows } = await stockScoped;
  const fromStock = ((stockRows as { quantity: number }[] | null) ?? [])
    .reduce((s, r) => s + r.quantity, 0);

  const allocQuery = admin
    .from("back_to_school_stock_allocations")
    .select("qty")
    .eq("category", body.category)
    .eq("from_colour", from.colour)
    .eq("from_fit", from.fit)
    .eq("from_size", from.size);
  const allocScoped = from.sleeve
    ? allocQuery.eq("from_sleeve", from.sleeve)
    : allocQuery.is("from_sleeve", null);
  const { data: existingOut } = await allocScoped;
  const outSoFar = ((existingOut as { qty: number }[] | null) ?? [])
    .reduce((s, r) => s + r.qty, 0);

  const freeStock = fromStock - outSoFar;
  if (body.qty > freeStock) {
    return NextResponse.json(
      {
        error: `Only ${freeStock} free on the FROM cell — you asked for ${body.qty}.`,
      },
      { status: 409 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("back_to_school_stock_allocations")
    .insert({
      category: body.category,
      from_colour: from.colour,
      from_sleeve: from.sleeve ?? null,
      from_fit: from.fit,
      from_size: from.size,
      to_colour: to.colour,
      to_sleeve: to.sleeve ?? null,
      to_fit: to.fit,
      to_size: to.size,
      qty: body.qty,
      note: body.note?.trim() || null,
      created_by: auth.teamMemberId,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[stock-allocations] insert err:", error);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
  return NextResponse.json({ success: true, id: data.id as string });
}
