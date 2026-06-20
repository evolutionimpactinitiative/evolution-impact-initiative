import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, ExternalLink, FileText } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPence, formatPenceShort, formatDate } from "@/lib/accounting/format";
import type { Fund, FundCategory } from "@/lib/accounting/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ code: string }>;
}

interface LineRow {
  debit_pence: number;
  credit_pence: number;
  fund_category_id: string | null;
  account: { account_type: string } | null;
  transaction: { transaction_date: string; status: string } | null;
}

interface TxRow {
  id: string;
  transaction_date: string;
  description: string;
  reference: string | null;
  status: string;
  journal_lines: { debit_pence: number; account: { account_type: string } | null }[];
}

interface CategoryRow {
  category: FundCategory;
  budget_pence: number | null;
  spent_pence: number;
  income_pence: number;
}

function fundTypeLabel(t: Fund["fund_type"]): string {
  switch (t) {
    case "restricted": return "Restricted";
    case "designated": return "Designated";
    case "endowment": return "Endowment";
    default: return "Unrestricted";
  }
}

function pctClass(pct: number): string {
  if (pct >= 100) return "bg-red-500";
  if (pct >= 85) return "bg-amber-500";
  if (pct >= 60) return "bg-blue-500";
  return "bg-green-500";
}

export default async function FundDetailPage({ params }: PageProps) {
  const { code } = await params;
  const admin = createAdminClient();

  const { data: fundRow } = await admin
    .from("funds")
    .select("*")
    .eq("code", code.toUpperCase())
    .maybeSingle();
  const fund = fundRow as Fund | null;
  if (!fund) notFound();

  const { data: catData } = await admin
    .from("fund_categories")
    .select("*")
    .eq("fund_id", fund.id)
    .order("display_order");
  const categories = (catData ?? []) as FundCategory[];

  // All posted journal lines for this fund + their account type
  const { data: lineData } = await admin
    .from("journal_lines")
    .select(
      `
      debit_pence, credit_pence, fund_category_id,
      account:accounts!inner ( account_type ),
      transaction:transactions!inner ( transaction_date, status )
    `,
    )
    .eq("fund_id", fund.id)
    .eq("transaction.status", "posted");
  const lines = (lineData ?? []) as unknown as LineRow[];

  // Per-category aggregation
  const byCategory = new Map<string, { spent: number; income: number }>();
  let totalIncome = 0;
  let totalExpense = 0;
  for (const l of lines) {
    if (!l.account) continue;
    if (l.account.account_type === "expense") totalExpense += l.debit_pence;
    if (l.account.account_type === "income") totalIncome += l.credit_pence;
    if (l.fund_category_id) {
      const cur = byCategory.get(l.fund_category_id) ?? { spent: 0, income: 0 };
      if (l.account.account_type === "expense") cur.spent += l.debit_pence;
      if (l.account.account_type === "income") cur.income += l.credit_pence;
      byCategory.set(l.fund_category_id, cur);
    }
  }

  const categoryRows: CategoryRow[] = categories.map((c) => {
    const m = byCategory.get(c.id) ?? { spent: 0, income: 0 };
    return {
      category: c,
      budget_pence: c.budget_amount_pence,
      spent_pence: m.spent,
      income_pence: m.income,
    };
  });

  const currentBalance = totalIncome - totalExpense;

  // Monthly buckets (last 12 months) — purely numeric, no chart
  const months = new Map<string, { income: number; expense: number }>();
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.set(key, { income: 0, expense: 0 });
  }
  for (const l of lines) {
    if (!l.transaction || !l.account) continue;
    const key = l.transaction.transaction_date.slice(0, 7);
    const bucket = months.get(key);
    if (!bucket) continue;
    if (l.account.account_type === "income") bucket.income += l.credit_pence;
    if (l.account.account_type === "expense") bucket.expense += l.debit_pence;
  }

  // Recent 15 transactions for this fund
  // Use the link-table approach: pull transaction ids from journal_lines then fetch
  const txIds = Array.from(
    new Set(
      (
        (
          await admin
            .from("journal_lines")
            .select("transaction_id, transaction:transactions(transaction_date, status)")
            .eq("fund_id", fund.id)
            .order("transaction_id")
            .limit(500)
        ).data ?? []
      ).map((r: { transaction_id: string }) => r.transaction_id),
    ),
  );
  let recentTx: TxRow[] = [];
  if (txIds.length > 0) {
    const { data: txData } = await admin
      .from("transactions")
      .select(
        `
        id, transaction_date, description, reference, status,
        journal_lines (
          debit_pence,
          account:accounts ( account_type )
        )
      `,
      )
      .in("id", txIds.slice(0, 500))
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(15);
    recentTx = (txData ?? []) as unknown as TxRow[];
  }

  const totalAwarded = fund.total_awarded_pence;
  const awardedSpentPct = totalAwarded && totalAwarded > 0
    ? Math.min(999, (totalExpense / totalAwarded) * 100)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/accounting"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to accounting
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-heading font-black text-xl lg:text-2xl text-gray-900">
              {fund.name}
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              {fundTypeLabel(fund.fund_type)} fund
              {fund.funder ? ` · ${fund.funder}` : ""}
              {fund.funder_reference ? ` · ${fund.funder_reference}` : ""}
            </p>
          </div>
          {fund.starts_on && fund.ends_on && (
            <div className="text-right text-xs text-gray-500 inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(fund.starts_on)} → {formatDate(fund.ends_on)}
            </div>
          )}
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500">Total income</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{formatPenceShort(totalIncome)}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500">Total expenditure</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{formatPenceShort(totalExpense)}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500">Current balance</p>
          <p className={`text-2xl font-bold mt-1 ${currentBalance < 0 ? "text-red-700" : "text-gray-900"}`}>
            {formatPenceShort(currentBalance)}
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500">
            {totalAwarded != null ? "Awarded · spent" : "Avg/month spend"}
          </p>
          {totalAwarded != null ? (
            <>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatPenceShort(totalAwarded)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {awardedSpentPct?.toFixed(1)}% spent
              </p>
            </>
          ) : (
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatPenceShort(Math.round(totalExpense / 12))}
            </p>
          )}
        </div>
      </div>

      {/* Per-category budget vs actual */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-heading font-bold text-lg text-gray-900">
            Budget vs actual
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Across {categoryRows.length} sub-categor{categoryRows.length === 1 ? "y" : "ies"}.
          </p>
        </div>
        {categoryRows.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No sub-categories defined for this fund.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {categoryRows.map((row) => {
              const pct =
                row.budget_pence && row.budget_pence > 0
                  ? Math.min(150, (row.spent_pence / row.budget_pence) * 100)
                  : null;
              return (
                <li key={row.category.id} className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">
                        {row.category.name}
                      </p>
                      {row.category.description && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {row.category.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatPence(row.spent_pence)}
                      </p>
                      {row.budget_pence != null && (
                        <p className="text-xs text-gray-500">
                          of {formatPenceShort(row.budget_pence)} budget
                        </p>
                      )}
                    </div>
                  </div>
                  {pct != null && (
                    <>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${pctClass(pct)}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-gray-500">
                        <span>{pct.toFixed(1)}% used</span>
                        {row.budget_pence != null && row.budget_pence > 0 && (
                          <span>
                            {formatPenceShort(row.budget_pence - row.spent_pence)} remaining
                          </span>
                        )}
                      </div>
                    </>
                  )}
                  {row.income_pence > 0 && (
                    <p className="text-xs text-green-700 mt-2">
                      + {formatPenceShort(row.income_pence)} income received into this category
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Monthly trend (12 months) */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-heading font-bold text-lg text-gray-900">
            Last 12 months
          </h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-12 gap-1">
            {Array.from(months.entries()).map(([key, v]) => {
              const max = Math.max(
                ...Array.from(months.values()).flatMap((m) => [m.income, m.expense]),
                1,
              );
              const incomeH = (v.income / max) * 100;
              const expenseH = (v.expense / max) * 100;
              const [y, m] = key.split("-");
              const monthLabel = new Date(Number(y), Number(m) - 1).toLocaleDateString("en-GB", {
                month: "short",
              });
              return (
                <div key={key} className="flex flex-col items-center">
                  <div className="h-24 flex items-end gap-0.5 w-full">
                    <div
                      className="flex-1 bg-green-300 rounded-t"
                      style={{ height: `${incomeH}%` }}
                      title={`${formatPence(v.income)} in`}
                    />
                    <div
                      className="flex-1 bg-red-300 rounded-t"
                      style={{ height: `${expenseH}%` }}
                      title={`${formatPence(v.expense)} out`}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1">{monthLabel}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end gap-4 text-xs text-gray-500 mt-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-300 rounded-sm" /> income
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 bg-red-300 rounded-sm" /> expense
            </span>
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-heading font-bold text-lg text-gray-900">
            Recent transactions
          </h2>
          <Link
            href="/admin/accounting/transactions"
            className="text-xs text-brand-blue hover:underline inline-flex items-center gap-1"
          >
            All transactions
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
        {recentTx.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No transactions touched this fund yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recentTx.map((tx) => {
              const total = tx.journal_lines.reduce((s, l) => s + l.debit_pence, 0);
              return (
                <li
                  key={tx.id}
                  className="p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">
                      {tx.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDate(tx.transaction_date)}
                      {tx.reference ? ` · ${tx.reference}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-gray-900 whitespace-nowrap">
                      {formatPence(total)}
                    </p>
                    {tx.status !== "posted" && (
                      <p className="text-xs text-gray-500 capitalize">{tx.status}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
