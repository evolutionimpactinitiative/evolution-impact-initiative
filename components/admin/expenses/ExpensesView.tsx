"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ClipboardList,
  Coins,
  ExternalLink,
  FileText,
  Loader2,
  Receipt,
  ShieldCheck,
  User as UserIcon,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { createClient } from "@/lib/supabase/client";
import { formatPence } from "@/lib/accounting/format";
import type { Fund, FundCategory, Account } from "@/lib/accounting/types";
import type { Event } from "@/lib/supabase/types";
import {
  KIND_LABELS,
  STATUS_LABELS,
  STATUS_TONES,
  needsDualApproval,
  needsTreasurerCoApproval,
  readyForTreasurerPay,
  type ExpenseStatus,
  type ExpenseSubmission,
} from "@/lib/expenses/types";

type Tab = "mine" | "chair_queue" | "pay_queue" | "all";

interface Me {
  id: string;
  name: string | null;
  isChair: boolean;
  isTreasurer: boolean;
}

interface Props {
  expenses: ExpenseSubmission[];
  team: Array<{ id: string; name: string | null; email: string }>;
  funds: Fund[];
  fundCategories: FundCategory[];
  accounts: Account[];
  events: Pick<Event, "id" | "title" | "date">[];
  currentTab: Tab;
  me: Me;
}

export function ExpensesView({
  expenses,
  team,
  funds,
  fundCategories,
  accounts,
  events,
  currentTab,
  me,
}: Props) {
  const teamById = React.useMemo(() => {
    const m = new Map<string, { name: string | null; email: string }>();
    for (const t of team) m.set(t.id, { name: t.name, email: t.email });
    return m;
  }, [team]);
  const fundById = React.useMemo(() => {
    const m = new Map<string, Fund>();
    for (const f of funds) m.set(f.id, f);
    return m;
  }, [funds]);
  const eventById = React.useMemo(() => {
    const m = new Map<string, { title: string; date: string }>();
    for (const e of events) m.set(e.id, { title: e.title, date: e.date });
    return m;
  }, [events]);

  const tabs: Array<{ key: Tab; label: string; count: number; visible: boolean }> = [
    {
      key: "mine",
      label: "Mine",
      count: expenses.filter((e) => e.submitted_by === me.id).length,
      visible: true,
    },
    {
      key: "chair_queue",
      label: "Chair queue",
      count: expenses.filter((e) => e.status === "submitted").length,
      visible: me.isChair,
    },
    {
      key: "pay_queue",
      label: "Pay queue",
      count: expenses.filter(
        (e) => e.status === "chair_approved",
      ).length,
      visible: me.isTreasurer,
    },
    { key: "all", label: "All", count: expenses.length, visible: true },
  ];
  const visibleTabs = tabs.filter((t) => t.visible);

  const filtered = React.useMemo(() => {
    switch (currentTab) {
      case "mine":
        return expenses.filter((e) => e.submitted_by === me.id);
      case "chair_queue":
        return expenses.filter((e) => e.status === "submitted");
      case "pay_queue":
        return expenses.filter((e) => e.status === "chair_approved");
      case "all":
      default:
        return expenses;
    }
  }, [expenses, currentTab, me.id]);

  return (
    <div className="space-y-4">
      {/* Tab strip */}
      <div className="-mx-4 md:mx-0 px-4 md:px-0 border-b border-gray-200 pb-3">
        <div className="flex md:flex-wrap gap-2 overflow-x-auto md:overflow-visible no-scrollbar">
          {visibleTabs.map((t) => {
            const active = t.key === currentTab;
            const href =
              t.key === "mine" ? "/admin/expenses" : `/admin/expenses?tab=${t.key}`;
            return (
              <Link
                key={t.key}
                href={href}
                className={
                  (active
                    ? "bg-brand-blue text-white "
                    : "bg-white text-brand-dark border border-gray-200 hover:border-brand-blue ") +
                  "shrink-0 px-3.5 md:px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest"
                }
              >
                {t.label}
                <span
                  className={`ml-2 text-xs ${active ? "text-white/70" : "text-gray-500"}`}
                >
                  {t.count}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState tab={currentTab} isChair={me.isChair} />
      ) : (
        <ul className="space-y-3">
          {filtered.map((exp) => (
            <ExpenseCard
              key={exp.id}
              exp={exp}
              me={me}
              teamById={teamById}
              fundById={fundById}
              eventById={eventById}
              funds={funds}
              fundCategories={fundCategories}
              accounts={accounts}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState({ tab, isChair }: { tab: Tab; isChair: boolean }) {
  const map: Record<Tab, { title: string; body: string }> = {
    mine: {
      title: "No submissions yet",
      body: "When you claim back an expense or pass on a supplier invoice, it'll show here until it's paid.",
    },
    chair_queue: {
      title: "Nothing to approve",
      body: isChair
        ? "The chair queue is empty. Good news."
        : "Only the chair sees new submissions in this queue.",
    },
    pay_queue: {
      title: "Nothing to pay",
      body: "Everything the chair has approved has already been paid out.",
    },
    all: {
      title: "No expenses in the system yet",
      body: "Kick things off with a new submission.",
    },
  };
  const { title, body } = map[tab];
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
      <Receipt className="h-10 w-10 text-gray-400 mx-auto mb-3" />
      <p className="font-heading font-bold text-brand-dark">{title}</p>
      <p className="text-sm text-gray-500 mt-1">{body}</p>
    </div>
  );
}

// ─── Card ────────────────────────────────────────────────────────

function ExpenseCard({
  exp,
  me,
  teamById,
  fundById,
  eventById,
  funds,
  fundCategories,
  accounts,
}: {
  exp: ExpenseSubmission;
  me: Me;
  teamById: Map<string, { name: string | null; email: string }>;
  fundById: Map<string, Fund>;
  eventById: Map<string, { title: string; date: string }>;
  funds: Fund[];
  fundCategories: FundCategory[];
  accounts: Account[];
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");
  const [payOpen, setPayOpen] = React.useState(false);
  const [receiptUrl, setReceiptUrl] = React.useState<string | null>(null);

  const submitter = teamById.get(exp.submitted_by);
  const fund = exp.fund_id ? fundById.get(exp.fund_id) : null;
  const event = exp.event_id ? eventById.get(exp.event_id) : null;
  const tone = STATUS_TONES[exp.status];
  const dual = needsDualApproval(exp.amount_pence);
  const readyPay = readyForTreasurerPay(exp);
  const needsCoApprove = needsTreasurerCoApproval(exp);
  const isOwner = exp.submitted_by === me.id;

  async function runAction(
    body: Record<string, unknown>,
    tag: string,
  ) {
    setPending(tag);
    setError(null);
    try {
      const res = await fetch(`/api/expenses/${exp.id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Action failed");
      router.refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      return false;
    } finally {
      setPending(null);
    }
  }

  async function openReceipt() {
    if (!exp.receipt_url) return;
    setPending("receipt");
    try {
      const supabase = createClient();
      const { data, error: err } = await supabase.storage
        .from("expense-receipts")
        .createSignedUrl(exp.receipt_url, 300);
      if (err || !data) throw new Error(err?.message ?? "Couldn't sign URL");
      setReceiptUrl(data.signedUrl);
      window.open(data.signedUrl, "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't open receipt");
    } finally {
      setPending(null);
    }
  }

  return (
    <li className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5">
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            exp.kind === "reimbursement"
              ? "bg-brand-blue/10 text-brand-blue"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {exp.kind === "reimbursement" ? (
            <UserIcon className="h-5 w-5" />
          ) : (
            <Receipt className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-2 mb-0.5">
            <p className="font-heading font-bold text-brand-dark truncate">
              {formatPence(exp.amount_pence)} · {exp.payee_name}
            </p>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-heading font-bold uppercase tracking-widest ${tone.bg} ${tone.text}`}
            >
              {STATUS_LABELS[exp.status]}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-heading font-bold uppercase tracking-widest bg-gray-100 text-gray-600">
              {KIND_LABELS[exp.kind]}
            </span>
            {dual && (
              <span
                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-heading font-bold uppercase tracking-widest bg-purple-100 text-purple-800"
                title="Payments ≥ £500 need chair + treasurer"
              >
                <ShieldCheck className="h-3 w-3" />
                Dual approval
              </span>
            )}
          </div>
          <p className="text-sm text-brand-dark">{exp.description}</p>
          <p className="text-xs text-gray-500 mt-1">
            {submitter ? `By ${submitter.name || submitter.email}` : "By ?"}
            {" · "}
            {new Date(exp.incurred_on).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            {fund && ` · ${fund.code} ${fund.name}`}
            {event && ` · ${event.title}`}
          </p>
          {exp.payee_notes && (
            <p className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-md px-2.5 py-1.5 mt-2 whitespace-pre-wrap">
              <span className="font-heading font-bold uppercase tracking-widest text-gray-500 mr-1">
                For treasurer:
              </span>
              {exp.payee_notes}
            </p>
          )}
          {exp.rejection_reason && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-2.5 py-1.5 mt-2">
              <span className="font-bold">Rejected: </span>
              {exp.rejection_reason}
            </p>
          )}
          {exp.status === "paid" && (
            <p className="text-xs text-emerald-700 mt-1 inline-flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Paid
              {exp.payment_reference && ` — ${exp.payment_reference}`}
              {exp.posted_transaction_id && (
                <Link
                  href={`/admin/accounting/transactions`}
                  className="ml-1 underline hover:text-emerald-900"
                >
                  view ledger
                </Link>
              )}
            </p>
          )}

          {/* Approval trail */}
          {(exp.chair_approved_at || exp.treasurer_approved_at) && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-gray-500">
              {exp.chair_approved_at && (
                <span className="inline-flex items-center gap-1">
                  <Check className="h-3 w-3 text-emerald-600" />
                  Chair approved
                </span>
              )}
              {exp.treasurer_approved_at && (
                <span className="inline-flex items-center gap-1">
                  <Check className="h-3 w-3 text-emerald-600" />
                  Treasurer co-approved
                </span>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 mt-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mt-3">
            {exp.receipt_url && (
              <button
                type="button"
                onClick={openReceipt}
                disabled={pending === "receipt"}
                className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-brand-dark px-3 py-1.5 rounded-md text-xs font-heading font-bold uppercase tracking-widest hover:border-brand-blue disabled:opacity-50"
              >
                {pending === "receipt" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileText className="h-3.5 w-3.5" />
                )}
                Receipt
                <ExternalLink className="h-3 w-3 text-gray-400" />
              </button>
            )}

            {/* Chair: approve/reject on submitted */}
            {me.isChair && exp.status === "submitted" && !isOwner && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    runAction({ action: "chair_approve" }, "chair_approve")
                  }
                  disabled={!!pending}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-md text-xs font-heading font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50"
                >
                  {pending === "chair_approve" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => setRejectOpen(true)}
                  disabled={!!pending}
                  className="inline-flex items-center gap-1.5 bg-white border border-red-200 text-red-700 px-3 py-1.5 rounded-md text-xs font-heading font-bold uppercase tracking-widest hover:bg-red-50 disabled:opacity-50"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </button>
              </>
            )}
            {me.isChair && exp.status === "submitted" && isOwner && (
              <span className="text-xs text-gray-500 italic inline-flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                You can&rsquo;t approve your own submission
              </span>
            )}

            {/* Treasurer: co-approve on ≥£500 chair-approved */}
            {me.isTreasurer && needsCoApprove && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    runAction(
                      { action: "treasurer_approve" },
                      "treasurer_approve",
                    )
                  }
                  disabled={!!pending || exp.chair_approved_by === me.id}
                  title={
                    exp.chair_approved_by === me.id
                      ? "Same person can't be both approvers"
                      : ""
                  }
                  className="inline-flex items-center gap-1.5 bg-purple-600 text-white px-3 py-1.5 rounded-md text-xs font-heading font-bold uppercase tracking-widest hover:bg-purple-700 disabled:opacity-50"
                >
                  {pending === "treasurer_approve" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-3.5 w-3.5" />
                  )}
                  Co-approve
                </button>
                <button
                  type="button"
                  onClick={() => setRejectOpen(true)}
                  disabled={!!pending}
                  className="inline-flex items-center gap-1.5 bg-white border border-red-200 text-red-700 px-3 py-1.5 rounded-md text-xs font-heading font-bold uppercase tracking-widest hover:bg-red-50 disabled:opacity-50"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </button>
              </>
            )}

            {/* Treasurer: mark paid when ready */}
            {me.isTreasurer && readyPay && (
              <>
                <button
                  type="button"
                  onClick={() => setPayOpen(true)}
                  disabled={!!pending}
                  className="inline-flex items-center gap-1.5 bg-brand-blue text-white px-3 py-1.5 rounded-md text-xs font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50"
                >
                  <Wallet className="h-3.5 w-3.5" />
                  Mark paid
                </button>
                <button
                  type="button"
                  onClick={() => setRejectOpen(true)}
                  disabled={!!pending}
                  className="inline-flex items-center gap-1.5 bg-white border border-red-200 text-red-700 px-3 py-1.5 rounded-md text-xs font-heading font-bold uppercase tracking-widest hover:bg-red-50 disabled:opacity-50"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Reject modal */}
      <BottomSheet
        open={rejectOpen}
        onClose={() => !pending && setRejectOpen(false)}
        title="Reject this submission"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const reason = rejectReason.trim();
            if (!reason) {
              setError("Please add a reason so the submitter knows why.");
              return;
            }
            const ok = await runAction(
              { action: "reject", reason },
              "reject",
            );
            if (ok) {
              setRejectReason("");
              setRejectOpen(false);
            }
          }}
          className="space-y-3"
        >
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Please attach the receipt and resubmit."
            rows={4}
            autoFocus
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setRejectOpen(false)}
              disabled={!!pending}
              className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-brand-dark px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:border-brand-blue disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={!!pending}
              className="inline-flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-red-700 disabled:opacity-50"
            >
              {pending === "reject" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Reject
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Pay modal */}
      <BottomSheet
        open={payOpen}
        onClose={() => !pending && setPayOpen(false)}
        title="Mark paid + post to ledger"
      >
        <PayForm
          exp={exp}
          funds={funds}
          fundCategories={fundCategories}
          accounts={accounts}
          pending={pending === "mark_paid"}
          onCancel={() => setPayOpen(false)}
          onSubmit={async (payload) => {
            const ok = await runAction(
              { action: "mark_paid", ...payload },
              "mark_paid",
            );
            if (ok) setPayOpen(false);
          }}
        />
      </BottomSheet>
    </li>
  );
}

// ─── Pay form ────────────────────────────────────────────────────

function PayForm({
  exp,
  funds,
  fundCategories,
  accounts,
  pending,
  onCancel,
  onSubmit,
}: {
  exp: ExpenseSubmission;
  funds: Fund[];
  fundCategories: FundCategory[];
  accounts: Account[];
  pending: boolean;
  onCancel: () => void;
  onSubmit: (payload: {
    fund_id: string;
    fund_category_id: string;
    expense_account_id: string;
    paid_from_account_id: string;
    payment_reference?: string;
  }) => Promise<void>;
}) {
  const [fundId, setFundId] = React.useState(exp.fund_id ?? "");
  const [fundCategoryId, setFundCategoryId] = React.useState("");
  const [expenseAccountId, setExpenseAccountId] = React.useState("");
  const [paidFromAccountId, setPaidFromAccountId] = React.useState("");
  const [reference, setReference] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const expenseAccounts = accounts.filter((a) => a.account_type === "expense");
  const assetAccounts = accounts.filter((a) => a.account_type === "asset");
  const catsForFund = fundCategories.filter((c) =>
    fundId ? c.fund_id === fundId : true,
  );

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        if (!fundId || !fundCategoryId || !expenseAccountId || !paidFromAccountId) {
          setError("Fund, category, expense account and paid-from account are all required.");
          return;
        }
        try {
          await onSubmit({
            fund_id: fundId,
            fund_category_id: fundCategoryId,
            expense_account_id: expenseAccountId,
            paid_from_account_id: paidFromAccountId,
            payment_reference: reference.trim() || undefined,
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : "Error");
        }
      }}
      className="space-y-3"
    >
      <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm">
        <p className="font-heading font-bold text-brand-dark">
          {formatPence(exp.amount_pence)} · {exp.payee_name}
        </p>
        <p className="text-xs text-gray-600 mt-0.5">{exp.description}</p>
      </div>

      <label className="block">
        <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest inline-flex items-center gap-1">
          <Coins className="h-3 w-3" />
          Fund
        </span>
        <select
          value={fundId}
          onChange={(e) => {
            setFundId(e.target.value);
            setFundCategoryId("");
          }}
          required
          className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
        >
          <option value="">— Pick one —</option>
          {funds.map((f) => (
            <option key={f.id} value={f.id}>
              {f.code} · {f.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
          Fund category
        </span>
        <select
          value={fundCategoryId}
          onChange={(e) => setFundCategoryId(e.target.value)}
          required
          disabled={!fundId}
          className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm disabled:opacity-50"
        >
          <option value="">— Pick one —</option>
          {catsForFund.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} · {c.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
            Expense account
          </span>
          <select
            value={expenseAccountId}
            onChange={(e) => setExpenseAccountId(e.target.value)}
            required
            className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
          >
            <option value="">— Pick one —</option>
            {expenseAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} · {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
            Paid from
          </span>
          <select
            value={paidFromAccountId}
            onChange={(e) => setPaidFromAccountId(e.target.value)}
            required
            className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
          >
            <option value="">— Pick one —</option>
            {assetAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} · {a.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
          Payment reference (optional)
        </span>
        <input
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="e.g. BACS-2026-08-14-Kwame"
          className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
        />
      </label>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-2 justify-end pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-brand-dark px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:border-brand-blue disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 bg-brand-blue text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wallet className="h-4 w-4" />
          )}
          Mark paid + post
        </button>
      </div>
    </form>
  );
}
