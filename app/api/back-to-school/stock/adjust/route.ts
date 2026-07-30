import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UNIFORM_SIZES } from "@/lib/back-to-school";

const VALID_CATEGORIES = [
  "polo",
  "shirt",
  "trousers",
  "skirt",
  "dress",
  "shorts",
] as const;
const VALID_COLOURS = ["white", "blue", "grey", "black"] as const;
const VALID_SLEEVES = ["short", "long"] as const;
const VALID_FITS = ["boys", "girls", "unisex"] as const;
const VALID_REASONS = [
  "donation",
  "purchase",
  "distributed",
  "adjustment",
  "correction",
] as const;

const SIZES: readonly string[] = UNIFORM_SIZES;
const CATEGORIES_WITH_SLEEVE = ["polo", "shirt"];

interface Body {
  category?: string;
  colour?: string;
  sleeve?: string | null;
  fit?: string;
  size?: string;
  delta?: number;
  reason?: string;
  notes?: string | null;
  pledgeId?: string | null;
  registrationId?: string | null;
  childId?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    // Auth — team members only.
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

    // Validate body.
    const body = (await request.json()) as Body;

    if (!body.category || !VALID_CATEGORIES.includes(body.category as never)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    if (!body.colour || !VALID_COLOURS.includes(body.colour as never)) {
      return NextResponse.json({ error: "Invalid colour" }, { status: 400 });
    }
    if (!body.fit || !VALID_FITS.includes(body.fit as never)) {
      return NextResponse.json({ error: "Invalid fit" }, { status: 400 });
    }
    if (!body.size || !SIZES.includes(body.size)) {
      return NextResponse.json({ error: "Invalid size" }, { status: 400 });
    }
    if (
      typeof body.delta !== "number" ||
      !Number.isFinite(body.delta) ||
      body.delta === 0
    ) {
      return NextResponse.json(
        { error: "Delta must be a non-zero number" },
        { status: 400 },
      );
    }
    if (!body.reason || !VALID_REASONS.includes(body.reason as never)) {
      return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
    }

    let sleeve: string | null = null;
    if (CATEGORIES_WITH_SLEEVE.includes(body.category)) {
      if (!body.sleeve || !VALID_SLEEVES.includes(body.sleeve as never)) {
        return NextResponse.json(
          { error: "Sleeve is required for polos and shirts" },
          { status: 400 },
        );
      }
      sleeve = body.sleeve;
    }

    // Use admin client for the write path — the trigger updates
    // stock.quantity, so we don't want RLS quirks on that fan-out.
    const admin = createAdminClient();

    // Find-or-create the SKU row.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stockQuery = (admin as any)
      .from("back_to_school_stock")
      .select("id, quantity")
      .eq("category", body.category)
      .eq("colour", body.colour)
      .eq("fit", body.fit)
      .eq("size", body.size);

    const { data: existing } = sleeve
      ? await stockQuery.eq("sleeve", sleeve).maybeSingle()
      : await stockQuery.is("sleeve", null).maybeSingle();

    let stockId: string | null = existing
      ? (existing as { id: string }).id
      : null;
    const currentQty: number = existing
      ? (existing as { quantity: number }).quantity
      : 0;

    // Guard against making stock negative.
    if (currentQty + body.delta < 0) {
      return NextResponse.json(
        {
          error: `Can't remove ${Math.abs(body.delta)} — only ${currentQty} in stock.`,
        },
        { status: 400 },
      );
    }

    if (!stockId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: created, error: createErr } = await (admin as any)
        .from("back_to_school_stock")
        .insert({
          category: body.category,
          colour: body.colour,
          sleeve,
          fit: body.fit,
          size: body.size,
          quantity: 0, // trigger will bump to `delta` after movement insert
        })
        .select("id")
        .single();
      if (createErr || !created) {
        console.error("[b2s-stock-adjust] create sku err:", createErr);
        return NextResponse.json(
          { error: "Failed to create SKU" },
          { status: 500 },
        );
      }
      stockId = (created as { id: string }).id;
    }

    // Insert the movement — trigger updates stock.quantity.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: moveErr } = await (admin as any)
      .from("back_to_school_stock_movements")
      .insert({
        stock_id: stockId,
        delta: Math.round(body.delta),
        reason: body.reason,
        pledge_id: body.pledgeId ?? null,
        registration_id: body.registrationId ?? null,
        child_id: body.childId ?? null,
        notes: body.notes ?? null,
        created_by: teamMemberId,
      });

    if (moveErr) {
      console.error("[b2s-stock-adjust] movement insert err:", moveErr);
      return NextResponse.json(
        { error: "Failed to record movement" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, stockId, delta: body.delta });
  } catch (err) {
    console.error("[b2s-stock-adjust] handler err:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
