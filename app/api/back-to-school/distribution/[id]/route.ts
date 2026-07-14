import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { B2S_SLUG } from "@/lib/back-to-school";

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

    // Update per-child items_given records
    const itemsGiven = body.itemsGiven || {};
    for (const [childId, given] of Object.entries(itemsGiven)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("registration_children")
        .update({ items_given: given })
        .eq("id", childId)
        .eq("registration_id", id);
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
