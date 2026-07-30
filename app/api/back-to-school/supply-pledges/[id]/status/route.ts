import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapPledgeLine } from "@/lib/back-to-school-stock-mapping";

const VALID_STATUSES = ["pending", "confirmed", "received", "cancelled"] as const;
type Status = (typeof VALID_STATUSES)[number];

export async function POST(
  request: NextRequest,
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

    const body = (await request.json()) as { status?: string };
    if (!body.status || !VALID_STATUSES.includes(body.status as Status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const newStatus = body.status as Status;

    const update: Record<string, unknown> = { status: newStatus };
    if (newStatus === "received") {
      update.received_at = new Date().toISOString();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (supabase as any)
      .from("back_to_school_supply_pledges")
      .update(update)
      .eq("id", id);

    if (updateErr) {
      console.error("[b2s-pledge-status] update error:", updateErr);
      return NextResponse.json(
        { error: "Failed to update status" },
        { status: 500 },
      );
    }

    // On transition to "received", try to auto-post each pledge line into stock.
    // Anything we can't confidently map (unknown item text, missing/invalid size)
    // is skipped silently and reported back so the admin can add it manually.
    let stockLogged = 0;
    let stockSkipped = 0;
    if (newStatus === "received") {
      const { data: pledgeRow } = await supabase
        .from("back_to_school_supply_pledges")
        .select("items")
        .eq("id", id)
        .maybeSingle();
      const items =
        (pledgeRow as { items?: Array<{ item: string; size: string | null; qty: number }> } | null)
          ?.items ?? [];

      const admin = createAdminClient();
      const { data: teamRow } = await supabase
        .from("team_members")
        .select("id")
        .eq("email", user.email || "")
        .maybeSingle();
      const teamId = (teamRow as { id: string } | null)?.id ?? null;

      for (const line of items) {
        const mapped = mapPledgeLine(line.item, line.size, line.qty);
        if (!mapped) {
          stockSkipped += 1;
          continue;
        }
        // Find-or-create SKU row
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const q = (admin as any)
          .from("back_to_school_stock")
          .select("id")
          .eq("category", mapped.category)
          .eq("colour", mapped.colour)
          .eq("fit", mapped.fit)
          .eq("size", mapped.size);
        const { data: existing } = mapped.sleeve
          ? await q.eq("sleeve", mapped.sleeve).maybeSingle()
          : await q.is("sleeve", null).maybeSingle();

        let stockId: string | null =
          (existing as { id: string } | null)?.id ?? null;

        if (!stockId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: created, error: createErr } = await (admin as any)
            .from("back_to_school_stock")
            .insert({
              category: mapped.category,
              colour: mapped.colour,
              sleeve: mapped.sleeve,
              fit: mapped.fit,
              size: mapped.size,
              quantity: 0,
            })
            .select("id")
            .single();
          if (createErr || !created) {
            console.warn(
              "[b2s-pledge-status] auto-stock create sku failed:",
              createErr,
            );
            stockSkipped += 1;
            continue;
          }
          stockId = (created as { id: string }).id;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: moveErr } = await (admin as any)
          .from("back_to_school_stock_movements")
          .insert({
            stock_id: stockId,
            delta: mapped.qty,
            reason: "donation",
            pledge_id: id,
            notes: `Auto-logged from pledge line "${line.item}"`,
            created_by: teamId,
          });
        if (moveErr) {
          console.warn(
            "[b2s-pledge-status] auto-stock movement failed:",
            moveErr,
          );
          stockSkipped += 1;
          continue;
        }
        stockLogged += 1;
      }
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      stockLogged,
      stockSkipped,
    });
  } catch (err) {
    console.error("[b2s-pledge-status] handler error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
