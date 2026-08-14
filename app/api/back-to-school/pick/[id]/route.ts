import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { B2S_SLUG } from "@/lib/back-to-school";

// POST /api/back-to-school/pick/[id]
//
// Station 3 (picker) save: records what the runner physically pulled off
// the shelves into `items_given` on each child, without setting
// distribution_status and without decrementing stock. Stock only moves
// when Station 4 records the outcome via the distribution route.
//
// Same steward auth as the distribution route.

interface Body {
  stewardToken?: string;
  itemsGiven?: Record<string, Record<string, unknown>>;
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

    const supabase = createAdminClient();

    const { data: eventRow } = await supabase
      .from("events")
      .select("id")
      .eq("slug", B2S_SLUG)
      .maybeSingle();
    if (!eventRow) {
      return NextResponse.json({ error: "Drive event not found" }, { status: 404 });
    }
    const eventId = (eventRow as { id: string }).id;

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

    // Refuse to overwrite a finalised distribution — Station 4 has already
    // recorded the outcome, so this family is done.
    if (registration.distribution_status) {
      return NextResponse.json(
        {
          error: `Already recorded as "${registration.distribution_status}" at Station 4. Ask an admin to reset if this is wrong.`,
        },
        { status: 409 },
      );
    }

    const itemsGiven = body.itemsGiven || {};
    for (const [childId, given] of Object.entries(itemsGiven)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("registration_children")
        .update({ items_given: given })
        .eq("id", childId)
        .eq("registration_id", id);
    }

    // Touch the steward token last-used timestamp so we can see which
    // volunteer picked which family.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("festival_steward_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", token.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[b2s-pick] handler error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
