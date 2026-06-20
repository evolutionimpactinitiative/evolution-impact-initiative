import Link from "next/link";
import {
  Plus,
  ArrowRight,
  Upload,
  Wallet,
  Paperclip,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPence, formatPenceShort, formatDate } from "@/lib/accounting/format";
import type { Fund, AccountingPeriod } from "@/lib/accounting/types";

export const dynamic = "force-dynamic";

interface JournalLineRow {
  debit_pence: number;
  credit_pence: number;
  fund_id: string;
  transaction: {
    transaction_date: string;
    status: string;
  } | null;
  account: {
    account_type: string;
  } | null;
}

interface FundBalances {
  opening_pence: number;
  period_income_pence: number;
  period_expense_pence: number;
  current_pence: number;
}

interface RecentTxRow {
  id: string;
  transaction_date: string;
  description: string;
  status: string;
  journal_lines: {
    debit_pence: number;
    fund: { name: string } | null;
  }[];
}

function fundTypeLabel(t: Fund["fund_type"]): string {
  switch (t) {
    case "restricted":
      return "Restricted";
    case "designated":
      return "Designated";
    case "endowment":
      return "Endowment";
    case "unrestricted":
    default:
      return "Unrestricted";
  }
}

function fundTypeBadgeClass(t: Fund["fund_type"]): string {
  switch (t) {
    case "restricted":
      return "bg-amber-100 text-amber-700";
    case "designated":
      return "bg-blue-100 text-blue-700";
    case "endowment":
      return "bg-purple-100 text-purple-700";
    case "unrestricted":
    default:
      return "bg-green-100 text-green-700";
  }
}

export default async function AccountingLandingPage() {
  const admin = createAdminClient();

  // 1. Active funds
  const { data: fundsData } = await admin
    .from("funds")
    .select("*")
    .eq("is_active", true)
    .order("display_order");
  const funds = (fundsData ?? []) as Fund[];

  // 2. Find the current open accounting period (the one that covers today)
  const today = new Date().toISOString().split("T")[0];
  const { data: periodData } = await admin
    .from("accounting_periods")
    .select("*")
    .lte("starts_on", today)
    .gte("ends_on", today)
    .maybeSingle();
  const currentPeriod = periodData as AccountingPeriod | null;
  const periodStart = currentPeriod?.starts_on ?? null;
  const periodEnd = currentPeriod?.ends_on ?? null;

  // 3. Pull all posted journal lines with their fund + account type + date,
  //    then compute per-fund balances in JS.
  const { data: linesData } = await admin
    .from("journal_lines")
    .select(
      `
      debit_pence,
      credit_pence,
      fund_id,
      transaction:transactions!inner ( transaction_date, status ),
      account:accounts!inner ( account_type )
    `,
    )
    .eq("transaction.status", "posted");

  const lines = (linesData ?? []) as unknown as JournalLineRow[];

  const balancesByFund = new Map<string, FundBalances>();
  for (const f of funds) {
    balancesByFund.set(f.id, {
      opening_pence: 0,
      period_income_pence: 0,
      period_expense_pence: 0,
      current_pence: 0,
    });
  }

  for (const line of lines) {
    const fundId = line.fund_id;
    const bucket = balancesByFund.get(fundId);
    if (!bucket || !line.transaction || !line.account) continue;

    const txDate = line.transaction.transaction_date;
    const inPeriod =
      periodStart && periodEnd && txDate >= periodStart && txDate <= periodEnd;
    const beforePeriod = periodStart ? txDate < periodStart : false;

    const accountType = line.account.account_type;

    // Fund balance contribution: income credits add, expense debits subtract.
    // Asset/liability/equity lines net to zero across a fund (they're the
    // bank-side of double entry, not the cause of the change).
    let delta = 0;
    if (accountType === "income") {
      delta = line.credit_pence; // money in
    } else if (accountType === "expense") {
      delta = -line.debit_pence; // money out
    }

    bucket.current_pence += delta;
    if (beforePeriod) {
      bucket.opening_pence += delta;
    }
    if (inPeriod) {
      if (accountType === "income") bucket.period_income_pence += line.credit_pence;
      if (accountType === "expense") bucket.period_expense_pence += line.debit_pence;
    }
  }

  // 4. Recent 10 transactions
  const { data: recentData } = await admin
    .from("transactions")
    .select(
      `
      id,
      transaction_date,
      description,
      status,
      journal_lines (
        debit_pence,
        fund:funds ( name )
      )
    `,
    )
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(10);
  const recent = (recentData ?? []) as unknown as RecentTxRow[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading font-black text-xl lg:text-2xl text-gray-900">
            Accounting
          </h1>
          <p className="text-gray-600 text-sm lg:text-base mt-1">
            {currentPeriod ? (
              <>
                Current period: <strong>{currentPeriod.name}</strong>
                {currentPeriod.status === "closed" && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-gray-500">
                    <Lock className="w-3 h-3" />
                    closed
                  </span>
                )}
              </>
            ) : (
              <span className="text-amber-600">
                No accounting period covers today — create one in settings.
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/admin/accounting/transactions/new">
              <Plus className="w-4 h-4 mr-2" />
              New transaction
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/accounting/import">
              <Upload className="w-4 h-4 mr-2" />
              Import bank CSV
            </Link>
          </Button>
        </div>
      </div>

      {/* Fund cards */}
      {funds.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-12 text-center">
          <Wallet className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            No funds set up yet. Seed the migration to add the starter funds.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {funds.map((fund) => {
            const b = balancesByFund.get(fund.id) ?? {
              opening_pence: 0,
              period_income_pence: 0,
              period_expense_pence: 0,
              current_pence: 0,
            };
            return (
              <div
                key={fund.id}
                className="bg-white border border-gray-100 rounded-xl shadow-sm p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <h3 className="font-heading font-bold text-gray-900 truncate">
                      {fund.name}
                    </h3>
                    {fund.funder && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {fund.funder}
                      </p>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${fundTypeBadgeClass(fund.fund_type)}`}
                  >
                    {fundTypeLabel(fund.fund_type)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Opening</p>
                    <p className="font-medium text-gray-900">
                      {formatPenceShort(b.opening_pence)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Current balance</p>
                    <p
                      className={`font-bold ${b.current_pence < 0 ? "text-red-600" : "text-gray-900"}`}
                    >
                      {formatPenceShort(b.current_pence)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Period in</p>
                    <p className="font-medium text-green-700">
                      {formatPenceShort(b.period_income_pence)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Period out</p>
                    <p className="font-medium text-red-700">
                      {formatPenceShort(b.period_expense_pence)}
                    </p>
                  </div>
                </div>

                {fund.total_awarded_pence != null && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                    <span>Total awarded</span>
                    <span className="font-medium text-gray-700">
                      {formatPence(fund.total_awarded_pence)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Recent transactions */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-heading font-bold text-lg text-gray-900">
            Recent transactions
          </h2>
          <Link
            href="/admin/accounting/transactions"
            className="text-sm text-brand-blue font-medium flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="p-8 text-center">
            <Paperclip className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm mb-3">No transactions yet.</p>
            <Button asChild size="sm">
              <Link href="/admin/accounting/transactions/new">
                Record the first one
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recent.map((tx) => {
              const total = tx.journal_lines.reduce(
                (sum, l) => sum + l.debit_pence,
                0,
              );
              const fundName =
                tx.journal_lines.find((l) => l.fund)?.fund?.name ?? "—";
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
                      {formatDate(tx.transaction_date)} · {fundName}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-gray-900 whitespace-nowrap">
                      {formatPence(total)}
                    </p>
                    {tx.status !== "posted" && (
                      <p className="text-xs text-gray-500 capitalize">
                        {tx.status}
                      </p>
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
