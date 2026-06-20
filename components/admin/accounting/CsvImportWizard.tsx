"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  parseCsv,
  guessMapping,
  mapCsvRows,
  type CsvColumnMapping,
  type MappedCsvRow,
  type DateFormat,
} from "@/lib/accounting/csv";
import { bulkPostPayments, type BulkPostRow } from "@/lib/accounting/actions";
import { formatPence } from "@/lib/accounting/format";
import type { Fund, FundCategory, Account } from "@/lib/accounting/types";
import {
  Upload,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";

interface Props {
  funds: Fund[];
  fundCategories: FundCategory[];
  accounts: Account[];
}

type Step = "upload" | "map" | "classify";

interface RowAssignment {
  include: boolean;
  fund_id: string;
  fund_category_id: string;
  ledger_account_id: string;
  bank_account_id: string;
}

export function CsvImportWizard({ funds, fundCategories, accounts }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<CsvColumnMapping | null>(null);
  const [mappedRows, setMappedRows] = useState<MappedCsvRow[]>([]);
  const [assignments, setAssignments] = useState<RowAssignment[]>([]);
  const [defaultBankAccountId, setDefaultBankAccountId] = useState<string>(
    accounts.find((a) => a.code === "1000")?.id ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ posted: number; failures: { source_index: number; error: string }[] } | null>(null);

  // ────────────────────────────────────────────────────────────────────────
  // Step 1 — Upload
  // ────────────────────────────────────────────────────────────────────────
  async function handleFile(file: File) {
    setError(null);
    setFileName(file.name);
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      if (parsed.headers.length === 0) {
        setError("CSV is empty");
        return;
      }
      if (parsed.rows.length === 0) {
        setError("CSV has a header row but no data");
        return;
      }
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setMapping(guessMapping(parsed.headers));
      setStep("map");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read file");
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // Step 2 — Map columns
  // ────────────────────────────────────────────────────────────────────────
  function applyMapping() {
    if (!mapping) return;
    setError(null);
    // Require date + description + at least one amount field
    if (mapping.date_index < 0 || mapping.description_index < 0) {
      setError("Date and description columns are required");
      return;
    }
    if (
      mapping.amount_index == null &&
      mapping.money_in_index == null &&
      mapping.money_out_index == null
    ) {
      setError(
        "Select either a single amount column OR money in + money out columns",
      );
      return;
    }
    const mapped = mapCsvRows({ headers, rows }, mapping);

    // Default assignments — pre-fill the bank account everywhere
    const initial: RowAssignment[] = mapped.map((r) => ({
      include: r.parse_errors.length === 0,
      fund_id: "",
      fund_category_id: "",
      ledger_account_id: "",
      bank_account_id: defaultBankAccountId,
    }));

    setMappedRows(mapped);
    setAssignments(initial);
    setStep("classify");
  }

  // ────────────────────────────────────────────────────────────────────────
  // Step 3 — Classify + submit
  // ────────────────────────────────────────────────────────────────────────
  function updateAssignment(index: number, patch: Partial<RowAssignment>) {
    setAssignments((prev) =>
      prev.map((a, i) => (i === index ? { ...a, ...patch } : a)),
    );
  }

  function applyToAllIncluded(patch: Partial<RowAssignment>) {
    setAssignments((prev) =>
      prev.map((a) => (a.include ? { ...a, ...patch } : a)),
    );
  }

  const validRows = useMemo(() => {
    return mappedRows.reduce((sum, r, i) => {
      const a = assignments[i];
      if (!a?.include) return sum;
      if (r.parse_errors.length > 0) return sum;
      if (!a.fund_id || !a.fund_category_id || !a.ledger_account_id || !a.bank_account_id)
        return sum;
      return sum + 1;
    }, 0);
  }, [mappedRows, assignments]);

  async function handleSubmit() {
    setError(null);
    setResult(null);

    const rowsToPost: BulkPostRow[] = [];
    for (let i = 0; i < mappedRows.length; i++) {
      const r = mappedRows[i];
      const a = assignments[i];
      if (!a.include) continue;
      if (r.parse_errors.length > 0) continue;
      if (!a.fund_id || !a.fund_category_id || !a.ledger_account_id || !a.bank_account_id)
        continue;
      rowsToPost.push({
        source_index: r.source_index,
        transaction_date: r.transaction_date,
        description: r.description,
        reference: r.reference,
        amount_pence: r.amount_pence,
        fund_id: a.fund_id,
        fund_category_id: a.fund_category_id,
        ledger_account_id: a.ledger_account_id,
        bank_account_id: a.bank_account_id,
      });
    }

    if (rowsToPost.length === 0) {
      setError("No rows are ready to post — fill in fund, category, and account for at least one row.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await bulkPostPayments(rowsToPost);
      if (!res.ok) {
        setError(res.error);
      } else {
        setResult(res.data);
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStep("upload");
    setFileName(null);
    setHeaders([]);
    setRows([]);
    setMapping(null);
    setMappedRows([]);
    setAssignments([]);
    setError(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ────────────────────────────────────────────────────────────────────────
  // UI helpers
  // ────────────────────────────────────────────────────────────────────────
  const expenseAccounts = useMemo(
    () =>
      accounts
        .filter((a) => a.account_type === "expense" && a.is_active)
        .sort((a, b) => a.display_order - b.display_order),
    [accounts],
  );
  const incomeAccounts = useMemo(
    () =>
      accounts
        .filter((a) => a.account_type === "income" && a.is_active)
        .sort((a, b) => a.display_order - b.display_order),
    [accounts],
  );
  const assetAccounts = useMemo(
    () =>
      accounts
        .filter((a) => a.account_type === "asset" && a.is_active)
        .sort((a, b) => a.display_order - b.display_order),
    [accounts],
  );
  const activeFunds = useMemo(
    () => funds.filter((f) => f.is_active).sort((a, b) => a.display_order - b.display_order),
    [funds],
  );
  function categoriesFor(fundId: string): FundCategory[] {
    return fundCategories
      .filter((c) => c.fund_id === fundId)
      .sort((a, b) => a.display_order - b.display_order);
  }

  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <ol className="flex items-center gap-3 text-sm">
        {(["upload", "map", "classify"] as Step[]).map((s, i) => (
          <li
            key={s}
            className={`flex items-center gap-2 ${step === s ? "text-brand-blue font-medium" : "text-gray-400"}`}
          >
            <span
              className={`flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                step === s
                  ? "bg-brand-blue text-white"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {i + 1}
            </span>
            <span className="capitalize">{s === "classify" ? "Classify & post" : s}</span>
            {i < 2 && <ArrowRight className="w-3 h-3 text-gray-300" />}
          </li>
        ))}
      </ol>

      {/* Errors */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-green-800">
                Posted {result.posted} transaction{result.posted === 1 ? "" : "s"}
                {result.failures.length > 0
                  ? ` · ${result.failures.length} failed`
                  : ""}
              </p>
              {result.failures.length > 0 && (
                <ul className="mt-2 text-sm text-green-900 space-y-0.5">
                  {result.failures.map((f, i) => (
                    <li key={i} className="text-red-700">
                      Row {f.source_index + 2}: {f.error}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={reset}>
                  Import another
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push("/admin/accounting/transactions")}
                >
                  View transactions
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Step 1: Upload ────────────────────────────────────────────── */}
      {step === "upload" && !result && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <label className="flex flex-col items-center justify-center gap-2 px-4 py-12 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-blue hover:bg-brand-blue/5 transition-colors">
            <Upload className="h-8 w-8 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              {fileName ?? "Click to choose a CSV file"}
            </span>
            <span className="text-xs text-gray-500">
              Virgin Money, Barclays, Monzo, Excel exports — any CSV
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* ─── Step 2: Map columns ──────────────────────────────────────── */}
      {step === "map" && mapping && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <div>
            <h2 className="font-heading font-bold text-lg text-gray-900">
              Map columns
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {rows.length} data row{rows.length === 1 ? "" : "s"} found in{" "}
              <strong>{fileName}</strong>. Tell us which CSV column is which.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ColumnPicker
              label="Date column"
              headers={headers}
              value={mapping.date_index}
              onChange={(v) => setMapping({ ...mapping, date_index: v ?? 0 })}
              required
            />
            <ColumnPicker
              label="Description column"
              headers={headers}
              value={mapping.description_index}
              onChange={(v) =>
                setMapping({ ...mapping, description_index: v ?? 0 })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date format
            </label>
            <select
              value={mapping.date_format}
              onChange={(e) =>
                setMapping({
                  ...mapping,
                  date_format: e.target.value as DateFormat,
                })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="dmy">DD/MM/YYYY (UK)</option>
              <option value="ymd">YYYY-MM-DD (ISO)</option>
              <option value="mdy">MM/DD/YYYY (US)</option>
            </select>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Amount columns
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ColumnPicker
                label="Single amount column"
                headers={headers}
                value={mapping.amount_index}
                onChange={(v) =>
                  setMapping({
                    ...mapping,
                    amount_index: v,
                    money_in_index: v != null ? null : mapping.money_in_index,
                    money_out_index: v != null ? null : mapping.money_out_index,
                  })
                }
                hint="Use this if positive = money in, negative = money out"
              />
              <div className="text-xs text-gray-400 self-center text-center">
                — OR —
              </div>
              <ColumnPicker
                label="Money IN column"
                headers={headers}
                value={mapping.money_in_index}
                onChange={(v) =>
                  setMapping({
                    ...mapping,
                    money_in_index: v,
                    amount_index: v != null ? null : mapping.amount_index,
                  })
                }
              />
              <ColumnPicker
                label="Money OUT column"
                headers={headers}
                value={mapping.money_out_index}
                onChange={(v) =>
                  setMapping({
                    ...mapping,
                    money_out_index: v,
                    amount_index: v != null ? null : mapping.amount_index,
                  })
                }
              />
            </div>
            <label className="flex items-center gap-2 mt-3 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={mapping.flip_sign}
                onChange={(e) =>
                  setMapping({ ...mapping, flip_sign: e.target.checked })
                }
              />
              Flip sign convention (use if amounts look inverted in the preview)
            </label>
          </div>

          <ColumnPicker
            label="Reference / transaction id column (optional)"
            headers={headers}
            value={mapping.reference_index}
            onChange={(v) => setMapping({ ...mapping, reference_index: v })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default bank/cash account for these rows
            </label>
            <select
              value={defaultBankAccountId}
              onChange={(e) => setDefaultBankAccountId(e.target.value)}
              className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="">— Select bank account —</option>
              {assetAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Preview the first 3 rows */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Preview (first 3 rows)
            </p>
            <div className="overflow-x-auto">
              <table className="text-xs">
                <thead>
                  <tr className="text-gray-500 uppercase tracking-wide">
                    {headers.map((h, i) => (
                      <th key={i} className="text-left pr-4 py-1 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 3).map((r, i) => (
                    <tr key={i} className="border-t border-gray-50">
                      {r.map((cell, j) => (
                        <td key={j} className="pr-4 py-1 whitespace-nowrap">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={applyMapping}>Continue</Button>
            <Button variant="outline" onClick={reset}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* ─── Step 3: Classify + post ─────────────────────────────────── */}
      {step === "classify" && !result && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="text-gray-600">
              <strong>{validRows}</strong> of {mappedRows.length} rows ready to post.
            </span>
            <span className="text-gray-400">|</span>
            <BulkApply
              label="Apply fund to all"
              options={activeFunds.map((f) => ({ value: f.id, label: f.name }))}
              onApply={(v) => applyToAllIncluded({ fund_id: v, fund_category_id: "" })}
            />
            <BulkApply
              label="Apply bank account to all"
              options={assetAccounts.map((a) => ({ value: a.id, label: a.name }))}
              onApply={(v) => applyToAllIncluded({ bank_account_id: v })}
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="px-3 py-2 text-left">Use</th>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Description</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2 text-left">Fund</th>
                    <th className="px-3 py-2 text-left">Sub-category</th>
                    <th className="px-3 py-2 text-left">Ledger account</th>
                    <th className="px-3 py-2 text-left">Bank</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mappedRows.map((r, i) => {
                    const a = assignments[i];
                    const isOutflow = r.amount_pence < 0;
                    const ledgerOptions = isOutflow ? expenseAccounts : incomeAccounts;
                    const hasErrors = r.parse_errors.length > 0;
                    return (
                      <tr
                        key={i}
                        className={
                          hasErrors
                            ? "bg-red-50"
                            : a.include
                              ? ""
                              : "bg-gray-50 text-gray-400"
                        }
                      >
                        <td className="px-3 py-2 align-top">
                          <input
                            type="checkbox"
                            checked={a.include}
                            disabled={hasErrors}
                            onChange={(e) =>
                              updateAssignment(i, { include: e.target.checked })
                            }
                          />
                        </td>
                        <td className="px-3 py-2 align-top whitespace-nowrap">
                          {r.transaction_date || (
                            <span className="text-red-600 text-xs">
                              {r.parse_errors[0]}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 align-top max-w-xs truncate">
                          {r.description}
                          {r.reference && (
                            <div className="text-xs text-gray-400">
                              {r.reference}
                            </div>
                          )}
                        </td>
                        <td
                          className={`px-3 py-2 align-top text-right font-medium whitespace-nowrap ${
                            isOutflow ? "text-red-700" : "text-green-700"
                          }`}
                        >
                          {hasErrors
                            ? "—"
                            : (isOutflow ? "−" : "+") +
                              formatPence(Math.abs(r.amount_pence))}
                        </td>
                        <td className="px-3 py-2 align-top">
                          <select
                            value={a.fund_id}
                            disabled={!a.include || hasErrors}
                            onChange={(e) =>
                              updateAssignment(i, {
                                fund_id: e.target.value,
                                fund_category_id: "",
                              })
                            }
                            className="text-xs px-2 py-1 border border-gray-300 rounded bg-white max-w-[140px]"
                          >
                            <option value="">—</option>
                            {activeFunds.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <select
                            value={a.fund_category_id}
                            disabled={!a.include || hasErrors || !a.fund_id}
                            onChange={(e) =>
                              updateAssignment(i, { fund_category_id: e.target.value })
                            }
                            className="text-xs px-2 py-1 border border-gray-300 rounded bg-white max-w-[160px]"
                          >
                            <option value="">—</option>
                            {categoriesFor(a.fund_id).map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <select
                            value={a.ledger_account_id}
                            disabled={!a.include || hasErrors}
                            onChange={(e) =>
                              updateAssignment(i, { ledger_account_id: e.target.value })
                            }
                            className="text-xs px-2 py-1 border border-gray-300 rounded bg-white max-w-[180px]"
                          >
                            <option value="">—</option>
                            {ledgerOptions.map((acc) => (
                              <option key={acc.id} value={acc.id}>
                                {acc.code} — {acc.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <select
                            value={a.bank_account_id}
                            disabled={!a.include || hasErrors}
                            onChange={(e) =>
                              updateAssignment(i, { bank_account_id: e.target.value })
                            }
                            className="text-xs px-2 py-1 border border-gray-300 rounded bg-white max-w-[140px]"
                          >
                            <option value="">—</option>
                            {assetAccounts.map((acc) => (
                              <option key={acc.id} value={acc.id}>
                                {acc.name}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <Button
              onClick={handleSubmit}
              disabled={submitting || validRows === 0}
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Posting {validRows} rows…
                </>
              ) : (
                <>Post {validRows} transaction{validRows === 1 ? "" : "s"}</>
              )}
            </Button>
            <Button variant="outline" onClick={() => setStep("map")} disabled={submitting}>
              Back
            </Button>
            <Button variant="outline" onClick={reset} disabled={submitting}>
              <X className="w-4 h-4 mr-2" />
              Start over
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Small column-picker dropdown reused in step 2
// ────────────────────────────────────────────────────────────────────────────
function ColumnPicker({
  label,
  headers,
  value,
  onChange,
  required,
  hint,
}: {
  label: string;
  headers: string[];
  value: number | null;
  onChange: (v: number | null) => void;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : Number(e.target.value))
        }
        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
      >
        <option value="">{required ? "— Select column —" : "(none)"}</option>
        {headers.map((h, i) => (
          <option key={i} value={i}>
            {h}
          </option>
        ))}
      </select>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Inline "apply to all included rows" dropdown
// ────────────────────────────────────────────────────────────────────────────
function BulkApply({
  label,
  options,
  onApply,
}: {
  label: string;
  options: { value: string; label: string }[];
  onApply: (v: string) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-xs text-gray-600">
      <span>{label}:</span>
      <select
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) onApply(e.target.value);
          e.target.value = "";
        }}
        className="px-2 py-1 border border-gray-300 rounded bg-white"
      >
        <option value="" disabled>
          Choose…
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
