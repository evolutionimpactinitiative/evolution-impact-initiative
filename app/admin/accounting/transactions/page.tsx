import Link from "next/link";
import { ArrowLeft, Plus, Paperclip, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPence, formatDate } from "@/lib/accounting/format";

export const dynamic = "force-dynamic";

interface JoinedJournalLine {
  id: string;
  debit_pence: number;
  credit_pence: number;
  account: { id: string; code: string; name: string; account_type: string } | null;
  fund: { id: string; code: string; name: string; fund_type: string } | null;
}

interface JoinedTransaction {
  id: string;
  transaction_date: string;
  reference: string | null;
  description: string;
  status: "draft" | "posted" | "reversed";
  created_at: string;
  journal_lines: JoinedJournalLine[];
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "posted":
      return "bg-green-100 text-green-700";
    case "reversed":
      return "bg-red-100 text-red-700";
    case "draft":
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export default async function TransactionsListPage() {
  const admin = createAdminClient();

  const { data: txData } = await admin
    .from("transactions")
    .select(
      `
      id,
      transaction_date,
      reference,
      description,
      status,
      created_at,
      journal_lines (
        id,
        debit_pence,
        credit_pence,
        account:accounts ( id, code, name, account_type ),
        fund:funds ( id, code, name, fund_type )
      )
    `,
    )
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  const transactions = (txData ?? []) as unknown as JoinedTransaction[];

  // Attachment counts in one query
  const txIds = transactions.map((t) => t.id);
  let attachmentCountByTx = new Map<string, number>();
  if (txIds.length > 0) {
    const { data: atts } = await admin
      .from("attachments")
      .select("entity_id")
      .eq("entity_type", "transaction")
      .in("entity_id", txIds);
    const list = (atts ?? []) as { entity_id: string }[];
    attachmentCountByTx = list.reduce((acc, a) => {
      acc.set(a.entity_id, (acc.get(a.entity_id) ?? 0) + 1);
      return acc;
    }, new Map<string, number>());
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            href="/admin/accounting"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to accounting
          </Link>
          <h1 className="font-heading font-black text-xl lg:text-2xl text-gray-900">
            Transactions
          </h1>
          <p className="text-gray-600 text-sm lg:text-base mt-1">
            {transactions.length === 0
              ? "No transactions yet."
              : `Showing ${transactions.length} most recent.`}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/accounting/transactions/new">
            <Plus className="w-4 h-4 mr-2" />
            New transaction
          </Link>
        </Button>
      </div>

      {transactions.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-12 text-center">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-4">
            No transactions recorded yet.
          </p>
          <Button asChild size="sm">
            <Link href="/admin/accounting/transactions/new">
              Record the first one
            </Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Description</th>
                  <th className="text-left px-4 py-3">Fund</th>
                  <th className="text-right px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Ref</th>
                  <th className="text-center px-4 py-3">Files</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((tx) => {
                  const total = tx.journal_lines.reduce(
                    (sum, l) => sum + l.debit_pence,
                    0,
                  );
                  const fundName =
                    tx.journal_lines.find((l) => l.fund)?.fund?.name ?? "—";
                  const attachmentCount = attachmentCountByTx.get(tx.id) ?? 0;
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {formatDate(tx.transaction_date)}
                      </td>
                      <td className="px-4 py-3 text-gray-900 max-w-md truncate">
                        {tx.description}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{fundName}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                        {formatPence(total)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(tx.status)}`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {tx.reference ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-400">
                        {attachmentCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-gray-600">
                            <Paperclip className="w-3.5 h-3.5" />
                            {attachmentCount}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {transactions.map((tx) => {
              const total = tx.journal_lines.reduce(
                (sum, l) => sum + l.debit_pence,
                0,
              );
              const fundName =
                tx.journal_lines.find((l) => l.fund)?.fund?.name ?? "—";
              const attachmentCount = attachmentCountByTx.get(tx.id) ?? 0;
              return (
                <div
                  key={tx.id}
                  className="bg-white border border-gray-100 rounded-xl shadow-sm p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">
                        {tx.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatDate(tx.transaction_date)} · {fundName}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusBadgeClass(tx.status)}`}
                    >
                      {tx.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className="font-semibold text-gray-900">
                      {formatPence(total)}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {tx.reference && <span>{tx.reference}</span>}
                      {attachmentCount > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Paperclip className="w-3.5 h-3.5" />
                          {attachmentCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
