import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID = [
  "pending",
  "contacted",
  "confirmed",
  "declined",
  "cancelled",
] as const;
type Status = (typeof VALID)[number];

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
    if (!body.status || !VALID.includes(body.status as Status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const newStatus = body.status as Status;
    const update: Record<string, unknown> = { status: newStatus };
    if (newStatus === "contacted") {
      update.followed_up_at = new Date().toISOString();
    }
    if (newStatus === "confirmed") {
      update.confirmed_at = new Date().toISOString();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (supabase as any)
      .from("back_to_school_sponsor_inquiries")
      .update(update)
      .eq("id", id);

    if (updateErr) {
      console.error("[b2s-sponsor-status] update error:", updateErr);
      return NextResponse.json(
        { error: "Failed to update status" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (err) {
    console.error("[b2s-sponsor-status] handler error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
