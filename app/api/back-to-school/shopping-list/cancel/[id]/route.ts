import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/back-to-school/shopping-list/cancel/[id]
// Team-only. Marks a reservation as cancelled without touching stock.
// Used when a donor flakes or the reservation was clearly bogus.

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
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("id")
      .eq("email", user.email || "")
      .maybeSingle();
    if (!teamMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (admin as any)
      .from("back_to_school_shopping_reservations")
      .update({ status: "cancelled" })
      .eq("id", id)
      .eq("status", "reserved");
    if (updateErr) {
      console.error("[b2s-shopping-cancel] err:", updateErr);
      return NextResponse.json({ error: "Cancel failed" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[b2s-shopping-cancel] handler err:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
