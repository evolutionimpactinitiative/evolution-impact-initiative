import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPaymentOut } from "@/lib/accounting/actions";
import {
  type ExpenseSubmission,
  needsDualApproval,
} from "@/lib/expenses/types";

// POST /api/expenses/[id]/decision
// Body: one of
//   { action: 'chair_approve' }
//   { action: 'treasurer_approve' }        ← only meaningful for ≥£500
//   { action: 'reject', reason: string }
//   { action: 'mark_paid', payment_reference?, fund_id, fund_category_id,
//                          expense_account_id, paid_from_account_id }
//
// Business rules enforced here (not in DB) because thresholds + role
// mappings evolve independently of the schema.

async function requireTeam() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401 };
  const { data: teamMember } = await supabase
    .from("team_members")
    .select("id, role, is_treasurer")
    .eq("email", user.email || "")
    .maybeSingle();
  if (!teamMember) return { ok: false as const, status: 403 };
  const tm = teamMember as {
    id: string;
    role: string | null;
    is_treasurer: boolean | null;
  };
  return {
    ok: true as const,
    teamMemberId: tm.id,
    isChair: tm.role === "admin",
    isTreasurer: !!tm.is_treasurer,
  };
}

interface Body {
  action?: string;
  reason?: string;
  payment_reference?: string;
  fund_id?: string;
  fund_category_id?: string;
  expense_account_id?: string;
  paid_from_account_id?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireTeam();
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const { id } = await params;
  const body = (await request.json()) as Body;
  const action = body.action;

  const admin = createAdminClient();
  const { data: current } = await admin
    .from("expense_submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const exp = current as ExpenseSubmission | null;
  if (!exp) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const now = new Date().toISOString();

  switch (action) {
    case "chair_approve": {
      if (!auth.isChair) {
        return NextResponse.json(
          { error: "Only the chair can approve expenses." },
          { status: 403 },
        );
      }
      if (exp.status !== "submitted") {
        return NextResponse.json(
          { error: `Can't approve — already ${exp.status}.` },
          { status: 409 },
        );
      }
      if (exp.submitted_by === auth.teamMemberId) {
        return NextResponse.json(
          { error: "You can't approve your own submission — needs a different chair." },
          { status: 409 },
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (admin as any)
        .from("expense_submissions")
        .update({
          status: "chair_approved",
          chair_approved_by: auth.teamMemberId,
          chair_approved_at: now,
        })
        .eq("id", id);
      if (error) {
        return NextResponse.json({ error: "Approve failed" }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    case "treasurer_approve": {
      if (!auth.isTreasurer) {
        return NextResponse.json(
          { error: "Only the treasurer can co-approve high-value expenses." },
          { status: 403 },
        );
      }
      if (exp.status !== "chair_approved") {
        return NextResponse.json(
          { error: "The chair hasn't approved this yet." },
          { status: 409 },
        );
      }
      if (!needsDualApproval(exp.amount_pence)) {
        return NextResponse.json(
          { error: "This amount doesn't need dual approval." },
          { status: 400 },
        );
      }
      if (exp.chair_approved_by === auth.teamMemberId) {
        return NextResponse.json(
          { error: "Same person can't be both chair + treasurer approver." },
          { status: 409 },
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (admin as any)
        .from("expense_submissions")
        .update({
          treasurer_approved_by: auth.teamMemberId,
          treasurer_approved_at: now,
        })
        .eq("id", id);
      if (error) {
        return NextResponse.json({ error: "Approve failed" }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    case "reject": {
      if (!auth.isChair && !auth.isTreasurer) {
        return NextResponse.json(
          { error: "Only chair or treasurer can reject." },
          { status: 403 },
        );
      }
      if (exp.status === "paid" || exp.status === "rejected") {
        return NextResponse.json(
          { error: `Already ${exp.status}.` },
          { status: 409 },
        );
      }
      const reason = (body.reason ?? "").trim();
      if (!reason) {
        return NextResponse.json({ error: "Reason required" }, { status: 400 });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (admin as any)
        .from("expense_submissions")
        .update({
          status: "rejected",
          rejection_reason: reason,
        })
        .eq("id", id);
      if (error) {
        return NextResponse.json({ error: "Reject failed" }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    case "mark_paid": {
      if (!auth.isTreasurer) {
        return NextResponse.json(
          { error: "Only the treasurer can mark expenses paid." },
          { status: 403 },
        );
      }
      if (exp.status !== "chair_approved") {
        return NextResponse.json(
          { error: "Needs chair approval first." },
          { status: 409 },
        );
      }
      if (
        needsDualApproval(exp.amount_pence) &&
        !exp.treasurer_approved_at
      ) {
        return NextResponse.json(
          {
            error:
              "Amount ≥ £500 — needs treasurer co-approval before payment.",
          },
          { status: 409 },
        );
      }
      if (
        !body.fund_id ||
        !body.fund_category_id ||
        !body.expense_account_id ||
        !body.paid_from_account_id
      ) {
        return NextResponse.json(
          {
            error:
              "Fund, category, expense account, and paid-from account are all required.",
          },
          { status: 400 },
        );
      }

      // Post the double-entry transaction into the ledger.
      const result = await createPaymentOut({
        transaction_date: exp.incurred_on,
        description: `${exp.payee_name} — ${exp.description}`,
        amount_pounds: (exp.amount_pence / 100).toFixed(2),
        fund_id: body.fund_id,
        fund_category_id: body.fund_category_id,
        expense_account_id: body.expense_account_id,
        paid_from_account_id: body.paid_from_account_id,
        reference: body.payment_reference || undefined,
        post_immediately: true,
      });
      if (!result.ok) {
        return NextResponse.json(
          { error: `Couldn't post transaction: ${result.error}` },
          { status: 500 },
        );
      }

      // Flip status + link the ledger tx back.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (admin as any)
        .from("expense_submissions")
        .update({
          status: "paid",
          paid_by: auth.teamMemberId,
          paid_at: now,
          payment_reference: body.payment_reference?.trim() || null,
          posted_transaction_id: result.data.transaction_id,
        })
        .eq("id", id);
      if (error) {
        return NextResponse.json(
          { error: "Ledger posted but status update failed" },
          { status: 500 },
        );
      }
      return NextResponse.json({
        success: true,
        transaction_id: result.data.transaction_id,
      });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
