"use client";

import { useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { createPaymentOut, createPaymentIn } from "@/lib/accounting/actions";
import type { Fund, FundCategory, Account } from "@/lib/accounting/types";
import { formatPenceShort } from "@/lib/accounting/format";
import { Loader2, Paperclip, X, AlertCircle, CheckCircle2 } from "lucide-react";

interface TransactionFormProps {
  funds: Fund[];
  fundCategories: FundCategory[];
  accounts: Account[];
}

type EntryType = "payment_out" | "payment_in";

export function TransactionForm({ funds, fundCategories, accounts }: TransactionFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [entryType, setEntryType] = useState<EntryType>("payment_out");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [fundId, setFundId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [accountId, setAccountId] = useState<string>("");
  const [bankAccountId, setBankAccountId] = useState<string>(
    accounts.find((a) => a.code === "1000")?.id ?? "",
  );
  const [reference, setReference] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter categories by selected fund
  const categoriesForFund = useMemo(
    () => fundCategories.filter((c) => c.fund_id === fundId),
    [fundId, fundCategories],
  );

  // Filter accounts by entry type (expense for out, income for in)
  const filteredAccounts = useMemo(() => {
    const targetType = entryType === "payment_out" ? "expense" : "income";
    return accounts
      .filter((a) => a.account_type === targetType && a.is_active)
      .sort((a, b) => a.display_order - b.display_order);
  }, [entryType, accounts]);

  // Bank/cash accounts (assets)
  const assetAccounts = useMemo(
    () =>
      accounts
        .filter((a) => a.account_type === "asset" && a.is_active)
        .sort((a, b) => a.display_order - b.display_order),
    [accounts],
  );

  function resetAfterSubmit() {
    setDescription("");
    setAmount("");
    setReference("");
    setFile(null);
    setCategoryId("");
    setAccountId("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadFileIfPresent(): Promise<
    | {
        filename: string;
        storage_path: string;
        mime_type: string;
        file_size_bytes: number;
      }
    | null
  > {
    if (!file) return null;
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "bin";
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${date.slice(0, 4)}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage
      .from("attachments")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    return {
      filename: file.name,
      storage_path: path,
      mime_type: file.type || `application/${ext}`,
      file_size_bytes: file.size,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fundId) return setError("Pick a fund");
    if (!categoryId) return setError("Pick a sub-category");
    if (!accountId) return setError("Pick an account");
    if (!bankAccountId) return setError("Pick a bank/cash account");
    if (!description.trim()) return setError("Description is required");
    if (!amount || Number(amount) <= 0) return setError("Amount must be > 0");

    setSubmitting(true);
    try {
      const attachment = await uploadFileIfPresent();

      const result =
        entryType === "payment_out"
          ? await createPaymentOut({
              transaction_date: date,
              description: description.trim(),
              amount_pounds: amount,
              fund_id: fundId,
              fund_category_id: categoryId,
              expense_account_id: accountId,
              paid_from_account_id: bankAccountId,
              reference: reference.trim() || undefined,
              attachment: attachment ?? undefined,
              post_immediately: true,
            })
          : await createPaymentIn({
              transaction_date: date,
              description: description.trim(),
              amount_pounds: amount,
              fund_id: fundId,
              fund_category_id: categoryId,
              income_account_id: accountId,
              received_into_account_id: bankAccountId,
              reference: reference.trim() || undefined,
              attachment: attachment ?? undefined,
              post_immediately: true,
            });

      if (!result.ok) {
        setError(result.error);
      } else {
        setSuccess(
          `Posted: ${formatPenceShort(Math.round(Number(amount) * 100))} — ${description}`,
        );
        resetAfterSubmit();
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Type toggle */}
      <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
        <button
          type="button"
          onClick={() => {
            setEntryType("payment_out");
            setAccountId("");
          }}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            entryType === "payment_out"
              ? "bg-white text-brand-dark shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Payment Out
        </button>
        <button
          type="button"
          onClick={() => {
            setEntryType("payment_in");
            setAccountId("");
          }}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            entryType === "payment_in"
              ? "bg-white text-brand-dark shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Payment In
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (£)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="450.00"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              entryType === "payment_out"
                ? "e.g. Facilitator fee — Sarah, Early Years session 12 Jul"
                : "e.g. CiN Q1 grant drawdown"
            }
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fund</label>
            <select
              value={fundId}
              onChange={(e) => {
                setFundId(e.target.value);
                setCategoryId("");
              }}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue bg-white"
            >
              <option value="">— Select fund —</option>
              {funds
                .filter((f) => f.is_active)
                .sort((a, b) => a.display_order - b.display_order)
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                    {f.fund_type === "restricted" ? " (Restricted)" : ""}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sub-category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              disabled={!fundId}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue bg-white disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">{fundId ? "— Select sub-category —" : "Pick a fund first"}</option>
              {categoriesForFund
                .sort((a, b) => a.display_order - b.display_order)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {entryType === "payment_out" ? "Expense category" : "Income category"}
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue bg-white"
            >
              <option value="">— Select category —</option>
              {filteredAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {entryType === "payment_out" ? "Paid from" : "Received into"}
            </label>
            <select
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue bg-white"
            >
              {assetAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reference (optional)
          </label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. INV-2026-001"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Receipt / invoice (optional)
          </label>
          {file ? (
            <div className="flex items-center justify-between gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center gap-2 min-w-0">
                <Paperclip className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-sm truncate">{file.name}</span>
                <span className="text-xs text-gray-500 shrink-0">
                  {(file.size / 1024).toFixed(0)} KB
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-blue hover:bg-brand-blue/5 transition-colors">
              <Paperclip className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                Click to attach a PDF / image (max 10 MB)
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting} size="lg">
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Posting…
            </>
          ) : (
            <>Post {entryType === "payment_out" ? "payment" : "receipt"}</>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/accounting/transactions")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
