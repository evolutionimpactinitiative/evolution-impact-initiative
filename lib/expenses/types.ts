// Types + business-rule helpers for the expense submission workflow.

export type ExpenseKind = "reimbursement" | "invoice";

export type ExpenseStatus =
  | "submitted"       // waiting on chair
  | "chair_approved"  // chair OK'd; may need treasurer co-approval + payment
  | "paid"            // treasurer paid + ledger posted
  | "rejected";       // chair or treasurer rejected

export interface ExpenseSubmission {
  id: string;
  kind: ExpenseKind;
  submitted_by: string;
  payee_name: string;
  payee_notes: string | null;
  description: string;
  amount_pence: number;
  incurred_on: string;
  fund_id: string | null;
  event_id: string | null;
  receipt_url: string | null;
  receipt_filename: string | null;
  status: ExpenseStatus;
  chair_approved_by: string | null;
  chair_approved_at: string | null;
  treasurer_approved_by: string | null;
  treasurer_approved_at: string | null;
  paid_by: string | null;
  paid_at: string | null;
  payment_reference: string | null;
  rejection_reason: string | null;
  posted_transaction_id: string | null;
  created_at: string;
  updated_at: string;
}

// Dual-approval threshold — from the locked v2 admin decisions. Tunable
// in future by moving to a settings row; hardcoded for now.
export const DUAL_APPROVAL_THRESHOLD_PENCE = 500_00;

export function needsDualApproval(amountPence: number): boolean {
  return amountPence >= DUAL_APPROVAL_THRESHOLD_PENCE;
}

// Given an expense + role bits, what should the treasurer be shown as
// their next action?
export function readyForTreasurerPay(exp: ExpenseSubmission): boolean {
  if (exp.status !== "chair_approved") return false;
  if (needsDualApproval(exp.amount_pence) && !exp.treasurer_approved_at) {
    return false;
  }
  return true;
}

export function needsTreasurerCoApproval(exp: ExpenseSubmission): boolean {
  return (
    exp.status === "chair_approved" &&
    needsDualApproval(exp.amount_pence) &&
    !exp.treasurer_approved_at
  );
}

export const STATUS_LABELS: Record<ExpenseStatus, string> = {
  submitted: "Awaiting chair",
  chair_approved: "Awaiting treasurer",
  paid: "Paid",
  rejected: "Rejected",
};

export const STATUS_TONES: Record<ExpenseStatus, { bg: string; text: string }> = {
  submitted: { bg: "bg-blue-100", text: "text-blue-800" },
  chair_approved: { bg: "bg-amber-100", text: "text-amber-800" },
  paid: { bg: "bg-emerald-100", text: "text-emerald-800" },
  rejected: { bg: "bg-red-100", text: "text-red-800" },
};

export const KIND_LABELS: Record<ExpenseKind, string> = {
  reimbursement: "Reimbursement",
  invoice: "Supplier invoice",
};
