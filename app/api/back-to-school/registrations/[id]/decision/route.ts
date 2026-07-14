import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Body {
  decision?: "approve" | "decline";
}

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

    const body = (await request.json()) as Body;
    if (body.decision !== "approve" && body.decision !== "decline") {
      return NextResponse.json(
        { error: "Invalid decision" },
        { status: 400 },
      );
    }

    const newStatus = body.decision === "approve" ? "approved" : "declined";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (supabase as any)
      .from("registrations")
      .update({ status: newStatus })
      .eq("id", id);

    if (updateErr) {
      console.error("[b2s-decision] update error:", updateErr);
      return NextResponse.json(
        { error: "Failed to update status" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (err) {
    console.error("[b2s-decision] handler error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
