import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/back-to-school/shopping-list/receive/[id]
//
// Team-only. Marks a reservation as received (the item is physically
// in our hands) and posts a positive stock movement so the SKU's
// quantity goes up. Idempotent: if already received, returns success
// without double-posting.

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("id")
      .eq("email", user.email || "")
      .maybeSingle();
    if (!teamMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const teamMemberId = (teamMember as { id: string }).id;

    const admin = createAdminClient();
    const { data: rsvRow } = await admin
      .from("back_to_school_shopping_reservations")
      .select(
        "id, pledger_id, category, colour, sleeve, fit, size, qty, status, received_stock_movement_id",
      )
      .eq("id", id)
      .maybeSingle();
    const rsv = rsvRow as {
      id: string;
      pledger_id: string;
      category: string;
      colour: string;
      sleeve: string | null;
      fit: string;
      size: string;
      qty: number;
      status: string;
      received_stock_movement_id: string | null;
    } | null;
    if (!rsv) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 },
      );
    }

    if (rsv.status === "received") {
      return NextResponse.json({ success: true, alreadyReceived: true });
    }
    if (rsv.status === "cancelled") {
      return NextResponse.json(
        { error: "Reservation is cancelled — can't receive." },
        { status: 409 },
      );
    }

    // Find or create the SKU row so we have somewhere to post the movement.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const skuQuery = (admin as any)
      .from("back_to_school_stock")
      .select("id")
      .eq("category", rsv.category)
      .eq("colour", rsv.colour)
      .eq("fit", rsv.fit)
      .eq("size", rsv.size);
    const { data: existing } = rsv.sleeve
      ? await skuQuery.eq("sleeve", rsv.sleeve).maybeSingle()
      : await skuQuery.is("sleeve", null).maybeSingle();

    let stockId: string | null =
      (existing as { id: string } | null)?.id ?? null;
    if (!stockId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: created, error: createErr } = await (admin as any)
        .from("back_to_school_stock")
        .insert({
          category: rsv.category,
          colour: rsv.colour,
          sleeve: rsv.sleeve,
          fit: rsv.fit,
          size: rsv.size,
          quantity: 0,
        })
        .select("id")
        .single();
      if (createErr || !created) {
        console.error("[b2s-shopping-receive] sku create err:", createErr);
        return NextResponse.json(
          { error: "Couldn't create SKU row." },
          { status: 500 },
        );
      }
      stockId = (created as { id: string }).id;
    }

    // Post the stock movement (positive delta). The DB trigger increments
    // stock.quantity.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: movement, error: moveErr } = await (admin as any)
      .from("back_to_school_stock_movements")
      .insert({
        stock_id: stockId,
        delta: rsv.qty,
        reason: "donation",
        notes: `Shopping list reservation received (pledger ${rsv.pledger_id.slice(0, 8)})`,
        created_by: teamMemberId,
      })
      .select("id")
      .single();
    if (moveErr || !movement) {
      console.error("[b2s-shopping-receive] movement err:", moveErr);
      return NextResponse.json(
        { error: "Couldn't post stock movement." },
        { status: 500 },
      );
    }

    // Flip the reservation status.
    const nowIso = new Date().toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (admin as any)
      .from("back_to_school_shopping_reservations")
      .update({
        status: "received",
        received_at: nowIso,
        received_stock_movement_id: (movement as { id: string }).id,
      })
      .eq("id", id);
    if (updateErr) {
      console.error("[b2s-shopping-receive] status err:", updateErr);
      // Movement is already posted — return partial success rather than
      // failing hard.
    }

    return NextResponse.json({
      success: true,
      stockMovementId: (movement as { id: string }).id,
    });
  } catch (err) {
    console.error("[b2s-shopping-receive] handler err:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
