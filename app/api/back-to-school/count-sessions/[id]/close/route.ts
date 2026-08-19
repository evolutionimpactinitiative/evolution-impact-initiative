import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CountTally } from "@/lib/back-to-school/stock-count";

// POST /api/back-to-school/count-sessions/[id]/close
// For every tallied SKU, computes delta = counted - current stock and
// inserts a reconciliation movement (trigger updates stock.quantity).
// Untallied SKUs are left alone. Session is marked closed. If a SKU
// row doesn't exist yet (never had stock), it's created with 0 and the
// delta is applied on top.

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

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireTeam();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const { id } = await params;
  const admin = createAdminClient();

  const { data: sess } = await admin
    .from("back_to_school_count_sessions")
    .select("id, name, status")
    .eq("id", id)
    .maybeSingle();
  if (!sess) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  const session = sess as { id: string; name: string; status: string };
  if (session.status !== "open") {
    return NextResponse.json({ error: "Session already closed" }, { status: 409 });
  }

  const { data: tallyRows } = await admin
    .from("back_to_school_count_tallies")
    .select("*")
    .eq("session_id", id);
  const tallies = (tallyRows as CountTally[] | null) ?? [];

  // Load all stock rows once so we can compute deltas without N queries.
  const { data: stockRows } = await admin
    .from("back_to_school_stock")
    .select("id, category, colour, sleeve, fit, size, quantity");
  const stockList =
    (stockRows as Array<{
      id: string;
      category: string;
      colour: string;
      sleeve: string | null;
      fit: string;
      size: string;
      quantity: number;
    }> | null) ?? [];
  const keyOf = (r: {
    category: string;
    colour: string;
    sleeve: string | null;
    fit: string;
    size: string;
  }) => [r.category, r.colour, r.sleeve ?? "", r.fit, r.size].join("|");
  const stockByKey = new Map(stockList.map((s) => [keyOf(s), s]));

  const summary: Array<{
    key: string;
    delta: number;
    counted: number;
    system: number;
  }> = [];

  for (const t of tallies) {
    const k = keyOf(t);
    const existing = stockByKey.get(k);
    const currentQty = existing?.quantity ?? 0;
    const delta = t.counted - currentQty;
    if (delta === 0) {
      summary.push({ key: k, delta: 0, counted: t.counted, system: currentQty });
      continue;
    }

    // Ensure SKU row exists — the movement's trigger fires an update
    // on stock.quantity via stock_id, so we need one.
    let stockId = existing?.id;
    if (!stockId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: created, error: createErr } = await (admin as any)
        .from("back_to_school_stock")
        .insert({
          category: t.category,
          colour: t.colour,
          sleeve: t.sleeve,
          fit: t.fit,
          size: t.size,
          quantity: 0,
        })
        .select("id")
        .single();
      if (createErr || !created) {
        console.error("[count-close] create sku err:", createErr);
        return NextResponse.json(
          { error: `Failed to create SKU for ${k}` },
          { status: 500 },
        );
      }
      stockId = (created as { id: string }).id;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: moveErr } = await (admin as any)
      .from("back_to_school_stock_movements")
      .insert({
        stock_id: stockId,
        delta,
        reason: "reconciliation",
        notes: `Session: ${session.name}`,
        created_by: auth.teamMemberId,
      });
    if (moveErr) {
      console.error("[count-close] movement err:", moveErr);
      return NextResponse.json(
        { error: `Ledger insert failed on ${k}` },
        { status: 500 },
      );
    }
    summary.push({ key: k, delta, counted: t.counted, system: currentQty });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: closeErr } = await (admin as any)
    .from("back_to_school_count_sessions")
    .update({
      status: "closed",
      closed_by: auth.teamMemberId,
      closed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (closeErr) {
    console.error("[count-close] close err:", closeErr);
    return NextResponse.json(
      { error: "Reconciled but session close failed — retry" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    reconciled: summary.filter((s) => s.delta !== 0).length,
    unchanged: summary.filter((s) => s.delta === 0).length,
  });
}
