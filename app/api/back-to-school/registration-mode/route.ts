import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { B2S_SLUG } from "@/lib/back-to-school";

const VALID_MODES = ["open", "waitlist", "closed"] as const;
type Mode = (typeof VALID_MODES)[number];

export async function POST(request: NextRequest) {
  try {
    // Team-members only
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

    const body = (await request.json()) as { mode?: string };
    if (!body.mode || !VALID_MODES.includes(body.mode as Mode)) {
      return NextResponse.json(
        { error: "Mode must be 'open', 'waitlist', or 'closed'." },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (admin as any)
      .from("events")
      .update({ registration_mode: body.mode })
      .eq("slug", B2S_SLUG);

    if (updateErr) {
      console.error("[b2s-registration-mode] update err:", updateErr);
      return NextResponse.json(
        { error: "Failed to update mode" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, mode: body.mode });
  } catch (err) {
    console.error("[b2s-registration-mode] handler err:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
