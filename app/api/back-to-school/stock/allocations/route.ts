import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { B2S_SLUG } from "@/lib/back-to-school";
import type {
  ChildSex,
  UniformChoices,
  UniformSize,
} from "@/lib/back-to-school";
import {
  aggregateDemand,
  skuCellKey,
  type ChildAsk,
} from "@/lib/back-to-school-stock";

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

  // Guard: true SPARE on the FROM cell must be ≥ qty.
  //   spare = stock − prior_outbound_allocs − (own_demand − prior_inbound_allocs)
  // Just checking free-stock would let us over-pull and short the
  // donor cell's own kids. Sleeve is nullable, so filter chains use
  // .is(null) or .eq(value) as needed.
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

  // Prior outbound allocations from this SKU
  const allocOutQuery = admin
    .from("back_to_school_stock_allocations")
    .select("qty")
    .eq("category", body.category)
    .eq("from_colour", from.colour)
    .eq("from_fit", from.fit)
    .eq("from_size", from.size);
  const allocOutScoped = from.sleeve
    ? allocOutQuery.eq("from_sleeve", from.sleeve)
    : allocOutQuery.is("from_sleeve", null);
  const { data: outRows } = await allocOutScoped;
  const outSoFar = ((outRows as { qty: number }[] | null) ?? [])
    .reduce((s, r) => s + r.qty, 0);

  // Prior inbound allocations TO this SKU (covers some of its own demand)
  const allocInQuery = admin
    .from("back_to_school_stock_allocations")
    .select("qty")
    .eq("category", body.category)
    .eq("to_colour", from.colour)
    .eq("to_fit", from.fit)
    .eq("to_size", from.size);
  const allocInScoped = from.sleeve
    ? allocInQuery.eq("to_sleeve", from.sleeve)
    : allocInQuery.is("to_sleeve", null);
  const { data: inRows } = await allocInScoped;
  const inSoFar = ((inRows as { qty: number }[] | null) ?? [])
    .reduce((s, r) => s + r.qty, 0);

  // Own demand at this SKU — replay the same aggregation the stock
  // dashboard uses so the guard matches what the UI shows.
  const ownDemand = await computeOwnDemand(admin, {
    category: body.category,
    colour: from.colour,
    sleeve: from.sleeve ?? null,
    fit: from.fit,
    size: from.size,
  });

  const uncoveredOwn = Math.max(0, ownDemand - inSoFar);
  const freeStock = Math.max(0, fromStock - outSoFar);
  const spareToGive = Math.max(0, freeStock - uncoveredOwn);

  if (body.qty > spareToGive) {
    return NextResponse.json(
      {
        error: `Only ${spareToGive} spare on the FROM cell (${fromStock} in stock, ${uncoveredOwn} needed here, ${outSoFar} already earmarked). You asked for ${body.qty}.`,
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

// Replays the same demand aggregation the stock dashboard runs, so the
// API guard checks TRUE spare (stock − out − own uncovered demand).
// Only counts active regs (pending + approved), matching the tile UI.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function computeOwnDemand(admin: any, sku: {
  category: string;
  colour: string;
  sleeve: string | null;
  fit: string;
  size: string;
}): Promise<number> {
  const { data: eventRow } = await admin
    .from("events")
    .select("id")
    .eq("slug", B2S_SLUG)
    .maybeSingle();
  if (!eventRow) return 0;
  const eventId = (eventRow as { id: string }).id;

  const { data: activeRegs } = await admin
    .from("registrations")
    .select("id")
    .eq("event_id", eventId)
    .in("status", ["pending", "approved"]);
  const regIds = ((activeRegs as { id: string }[] | null) ?? []).map((r) => r.id);
  if (regIds.length === 0) return 0;

  const { data: children } = await admin
    .from("registration_children")
    .select("id, sex, uniform_size, uniform_choices, needs")
    .in("registration_id", regIds);
  const list = (children as Array<{
    id: string;
    sex: ChildSex | null;
    uniform_size: string | null;
    uniform_choices: UniformChoices | null;
    needs: string[] | null;
  }> | null) ?? [];

  const asks: ChildAsk[] = [];
  for (const c of list) {
    if (!c.uniform_size || !c.uniform_choices) continue;
    if (!(c.needs ?? []).includes("uniform")) continue;
    asks.push({
      child_id: c.id,
      sex: c.sex,
      uniform_size: c.uniform_size as UniformSize,
      uniform_choices: c.uniform_choices,
    });
  }
  const demand = aggregateDemand(asks);
  const key = skuCellKey({
    category: sku.category as never,
    colour: sku.colour as never,
    sleeve: sku.sleeve as never,
    fit: sku.fit as never,
    size: sku.size,
  });
  return demand.get(key) ?? 0;
}
