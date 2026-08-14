import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { B2S_SLUG, type ChildSex, type UniformSize, type UniformChoices } from "@/lib/back-to-school";
import { fitFromSex, type StockCategory, type StockColour } from "@/lib/back-to-school-stock";

const VALID_STATUS = ["collected", "partial", "no_show"] as const;
type DistStatus = (typeof VALID_STATUS)[number];

interface Body {
  stewardToken?: string;
  distributionStatus?: string;
  itemsGiven?: Record<string, Record<string, boolean>>;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Body;

    if (
      !body.stewardToken ||
      typeof body.stewardToken !== "string" ||
      body.stewardToken.trim().length === 0
    ) {
      return NextResponse.json({ error: "Steward token required" }, { status: 401 });
    }
    if (
      !body.distributionStatus ||
      !VALID_STATUS.includes(body.distributionStatus as DistStatus)
    ) {
      return NextResponse.json({ error: "Invalid outcome" }, { status: 400 });
    }
    const distributionStatus = body.distributionStatus as DistStatus;

    const supabase = createAdminClient();

    // Look up the drive event
    const { data: eventRow } = await supabase
      .from("events")
      .select("id")
      .eq("slug", B2S_SLUG)
      .maybeSingle();
    if (!eventRow) {
      return NextResponse.json({ error: "Drive event not found" }, { status: 404 });
    }
    const eventId = (eventRow as { id: string }).id;

    // Verify the steward token belongs to this event and isn't revoked
    const { data: tokenRow } = await supabase
      .from("festival_steward_tokens")
      .select("id, event_id, revoked_at")
      .eq("token", body.stewardToken)
      .maybeSingle();
    const token = tokenRow as {
      id: string;
      event_id: string;
      revoked_at: string | null;
    } | null;
    if (!token || token.event_id !== eventId || token.revoked_at) {
      return NextResponse.json(
        { error: "Steward not authorised for this event" },
        { status: 403 },
      );
    }

    // Verify registration exists on this event
    const { data: regRow } = await supabase
      .from("registrations")
      .select("id, event_id, distribution_status")
      .eq("id", id)
      .maybeSingle();
    const registration = regRow as {
      id: string;
      event_id: string;
      distribution_status: string | null;
    } | null;
    if (!registration || registration.event_id !== eventId) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 },
      );
    }
    if (registration.distribution_status) {
      return NextResponse.json(
        {
          error: `Already recorded as "${registration.distribution_status}". Ask an admin to reset if this is wrong.`,
        },
        { status: 409 },
      );
    }

    // Update registration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: regUpdateErr } = await (supabase as any)
      .from("registrations")
      .update({
        distribution_status: distributionStatus,
        distribution_recorded_at: new Date().toISOString(),
        distribution_recorded_by_token_id: token.id,
      })
      .eq("id", id);
    if (regUpdateErr) {
      console.error("[b2s-distribution] registration update:", regUpdateErr);
      return NextResponse.json(
        { error: "Failed to record outcome" },
        { status: 500 },
      );
    }

    // Update per-child items_given records + decrement stock for uniform items
    // actually handed out. If a specific SKU has already run out we still record
    // the give-out (steward's on-the-day record is source of truth), but leave
    // stock at 0 rather than going negative.
    const itemsGiven = body.itemsGiven || {};
    for (const [childId, given] of Object.entries(itemsGiven)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("registration_children")
        .update({ items_given: given })
        .eq("id", childId)
        .eq("registration_id", id);

      await decrementStockForChild(supabase, id, childId, given);
    }

    // Touch the steward token last-used timestamp
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("festival_steward_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", token.id);

    return NextResponse.json({ success: true, status: distributionStatus });
  } catch (err) {
    console.error("[b2s-distribution] handler error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}

// Records negative stock movements for each uniform item marked given for this
// child. Reads the child's stored uniform_choices, uniform_size and sex, and
// resolves the SKU for each item flag that's true (uniform_bottom, uniform_polo,
// uniform_shirt).
//
// When items_given.substitutions[<key>] = { size } is present, we decrement
// that substituted size instead of the child's original requested size —
// keeping stock counts honest when the steward hands over a different size
// on the day. Silently skips items where the SKU can't be resolved.
async function decrementStockForChild(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  registrationId: string,
  childId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  given: Record<string, any>,
) {
  const wantsBottom = given.uniform_bottom === true || given.uniform === true;
  const wantsPolo = given.uniform_polo === true;
  const wantsShirt = given.uniform_shirt === true;
  if (!wantsBottom && !wantsPolo && !wantsShirt) return;

  // Idempotency guard — if we've already recorded 'distributed' movements
  // for this child (from a previous save or a retry), don't double-decrement.
  // The pick/handoff split means Station 3 saves items_given and Station 4
  // finalises — if Station 4's request is retried we mustn't decrement again.
  const { count: existingDecrements } = await supabase
    .from("back_to_school_stock_movements")
    .select("id", { count: "exact", head: true })
    .eq("child_id", childId)
    .eq("reason", "distributed");
  if ((existingDecrements ?? 0) > 0) return;

  const substitutions =
    (given.substitutions as Record<string, { size?: string }> | undefined) ??
    {};

  const { data: childRow } = await supabase
    .from("registration_children")
    .select("uniform_size, sex, uniform_choices")
    .eq("id", childId)
    .maybeSingle();
  const child = childRow as {
    uniform_size: UniformSize | null;
    sex: ChildSex | null;
    uniform_choices: UniformChoices | null;
  } | null;
  if (!child || !child.uniform_size || !child.uniform_choices) return;

  const fit = fitFromSex(child.sex);
  const defaultSize = child.uniform_size;

  interface Ask {
    key: "uniform_bottom" | "uniform_polo" | "uniform_shirt";
    category: StockCategory;
    colour: StockColour;
    sleeve: "short" | "long" | null;
  }
  const asks: Ask[] = [];

  if (wantsBottom && child.uniform_choices.bottom) {
    asks.push({
      key: "uniform_bottom",
      category: child.uniform_choices.bottom.type as StockCategory,
      colour: child.uniform_choices.bottom.colour as StockColour,
      sleeve: null,
    });
  }
  if (wantsPolo && child.uniform_choices.polo) {
    asks.push({
      key: "uniform_polo",
      category: "polo",
      colour: child.uniform_choices.polo.colour as StockColour,
      sleeve: child.uniform_choices.polo.sleeve,
    });
  }
  if (wantsShirt && child.uniform_choices.shirt) {
    asks.push({
      key: "uniform_shirt",
      category: "shirt",
      colour: "white",
      sleeve: child.uniform_choices.shirt.sleeve,
    });
  }

  for (const ask of asks) {
    const size = substitutions[ask.key]?.size ?? defaultSize;
    const substituted = substitutions[ask.key]?.size &&
      substitutions[ask.key]?.size !== defaultSize;

    const query = supabase
      .from("back_to_school_stock")
      .select("id, quantity")
      .eq("category", ask.category)
      .eq("colour", ask.colour)
      .eq("fit", fit)
      .eq("size", size);
    const { data: sku } = ask.sleeve
      ? await query.eq("sleeve", ask.sleeve).maybeSingle()
      : await query.is("sleeve", null).maybeSingle();

    const row = sku as { id: string; quantity: number } | null;
    if (!row) continue; // no matching SKU — nothing to decrement
    if (row.quantity <= 0) continue; // already at 0, don't go negative

    await supabase
      .from("back_to_school_stock_movements")
      .insert({
        stock_id: row.id,
        delta: -1,
        reason: "distributed",
        registration_id: registrationId,
        child_id: childId,
        notes: substituted
          ? `Substituted from requested size ${defaultSize} to ${size}`
          : null,
      });
  }
}
