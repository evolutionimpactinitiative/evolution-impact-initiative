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
    .select("id, name")
    .eq("email", user.email || "")
    .maybeSingle();
  if (!teamMember) return { ok: false as const, status: 403 };
  return {
    ok: true as const,
    teamMemberId: (teamMember as { id: string; name: string }).id,
    teamMemberName: (teamMember as { id: string; name: string }).name,
  };
}

interface Body {
  kind?: "reimbursement" | "invoice";
  payee_name?: string;
  payee_notes?: string;
  description?: string;
  amount_pence?: number;
  incurred_on?: string;
  fund_id?: string | null;
  event_id?: string | null;
  receipt_url?: string | null;
  receipt_filename?: string | null;
  is_urgent?: boolean;
  urgent_reason?: string;
}

// POST /api/expenses — create a new submission. Team-only.
export async function POST(request: NextRequest) {
  const auth = await requireTeam();
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const body = (await request.json()) as Body;
  if (body.kind !== "reimbursement" && body.kind !== "invoice") {
    return NextResponse.json({ error: "Kind required" }, { status: 400 });
  }
  if (!body.description?.trim()) {
    return NextResponse.json({ error: "Description required" }, { status: 400 });
  }
  if (!body.amount_pence || body.amount_pence <= 0) {
    return NextResponse.json({ error: "Amount must be > 0" }, { status: 400 });
  }
  if (!body.incurred_on) {
    return NextResponse.json({ error: "Date incurred required" }, { status: 400 });
  }

  // For reimbursements, default the payee to the submitter's name so
  // people don't have to type it themselves.
  const payeeName =
    body.payee_name?.trim() ||
    (body.kind === "reimbursement" ? `Me (${auth.teamMemberName})` : "");
  if (!payeeName) {
    return NextResponse.json({ error: "Payee required" }, { status: 400 });
  }

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("expense_submissions")
    .insert({
      kind: body.kind,
      submitted_by: auth.teamMemberId,
      payee_name: payeeName,
      payee_notes: body.payee_notes?.trim() || null,
      description: body.description.trim(),
      amount_pence: Math.round(body.amount_pence),
      incurred_on: body.incurred_on,
      fund_id: body.fund_id || null,
      event_id: body.event_id || null,
      receipt_url: body.receipt_url || null,
      receipt_filename: body.receipt_filename || null,
      is_urgent: !!body.is_urgent,
      urgent_reason: body.urgent_reason?.trim() || null,
      status: "submitted",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[expenses] insert err:", error);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
  return NextResponse.json({ success: true, id: data.id as string });
}
