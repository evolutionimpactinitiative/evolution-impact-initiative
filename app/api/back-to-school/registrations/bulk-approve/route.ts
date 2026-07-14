import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { B2S_SLUG } from "@/lib/back-to-school";

export async function POST(_request: NextRequest) {
  try {
    // Auth: must be a team member
    const supabaseUser = await createClient();
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data: teamMember } = await supabaseUser
      .from("team_members")
      .select("id")
      .eq("email", user.email || "")
      .maybeSingle();
    if (!teamMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    // Fetch pending ids and update them in one shot
    const { data: pending } = await supabase
      .from("registrations")
      .select("id")
      .eq("event_id", eventId)
      .eq("status", "pending");
    const pendingIds = ((pending as { id: string }[] | null) ?? []).map(
      (r) => r.id,
    );
    if (pendingIds.length === 0) {
      return NextResponse.json({ approved: 0 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (supabase as any)
      .from("registrations")
      .update({ status: "approved" })
      .in("id", pendingIds);

    if (updateErr) {
      console.error("[b2s-bulk-approve] update error:", updateErr);
      return NextResponse.json(
        { error: "Failed to bulk-approve" },
        { status: 500 },
      );
    }

    return NextResponse.json({ approved: pendingIds.length });
  } catch (err) {
    console.error("[b2s-bulk-approve] handler error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
