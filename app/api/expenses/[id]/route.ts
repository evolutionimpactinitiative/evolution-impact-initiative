import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireTeam() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401 };
  const { data: teamMember } = await supabase
    .from("team_members")
    .select("id, role")
    .eq("email", user.email || "")
    .maybeSingle();
  if (!teamMember) return { ok: false as const, status: 403 };
  const tm = teamMember as { id: string; role: string | null };
  return { ok: true as const, teamMemberId: tm.id, role: tm.role };
}

// DELETE /api/expenses/[id] — submitter can bin their own while it's
// still 'submitted' or 'rejected'; the chair can bin anything except
// paid (paid ones are archival — reverse via accounting instead).
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireTeam();
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data: current } = await admin
    .from("expense_submissions")
    .select("status, submitted_by, posted_transaction_id")
    .eq("id", id)
    .maybeSingle();
  const row = current as {
    status: string;
    submitted_by: string;
    posted_transaction_id: string | null;
  } | null;
  if (!row) return NextResponse.json({ success: true });

  const isOwner = row.submitted_by === auth.teamMemberId;
  const isAdmin = auth.role === "admin";
  const soft = row.status === "submitted" || row.status === "rejected";

  if (row.status === "paid") {
    return NextResponse.json(
      { error: "Paid expenses can't be deleted — reverse the transaction in Accounting." },
      { status: 409 },
    );
  }
  if (!isAdmin && !(isOwner && soft)) {
    return NextResponse.json(
      { error: "Only the submitter (while still open) or the chair can delete this." },
      { status: 403 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("expense_submissions")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("[expenses] delete err:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
