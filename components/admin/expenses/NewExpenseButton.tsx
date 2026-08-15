"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Receipt, Upload, User } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { createClient } from "@/lib/supabase/client";
import type { Fund } from "@/lib/accounting/types";
import type { Event } from "@/lib/supabase/types";
import type { ExpenseKind } from "@/lib/expenses/types";

interface Props {
  funds: Fund[];
  events: Pick<Event, "id" | "title" | "date">[];
}

export function NewExpenseButton({ funds, events }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = React.useState(false);
  const [kind, setKind] = React.useState<ExpenseKind>("reimbursement");
  const [amount, setAmount] = React.useState("");
  const [incurredOn, setIncurredOn] = React.useState(
    new Date().toISOString().slice(0, 10),
  );
  const [description, setDescription] = React.useState("");
  const [payeeName, setPayeeName] = React.useState("");
  const [payeeNotes, setPayeeNotes] = React.useState("");
  const [fundId, setFundId] = React.useState("");
  const [eventId, setEventId] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function reset() {
    setKind("reimbursement");
    setAmount("");
    setIncurredOn(new Date().toISOString().slice(0, 10));
    setDescription("");
    setPayeeName("");
    setPayeeNotes("");
    setFundId("");
    setEventId("");
    setFile(null);
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const amountPence = Math.round(parseFloat(amount) * 100);
      if (!amountPence || amountPence <= 0) {
        throw new Error("Amount must be greater than zero");
      }

      // 1. Upload receipt if provided
      let receiptUrl: string | null = null;
      let receiptFilename: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop() || "bin";
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("expense-receipts")
          .upload(fileName, file);
        if (upErr) throw new Error(upErr.message);
        receiptUrl = fileName;    // storage path; we'll sign at read time
        receiptFilename = file.name;
      }

      // 2. Create the submission
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          payee_name: payeeName.trim() || undefined,
          payee_notes: payeeNotes.trim() || undefined,
          description: description.trim(),
          amount_pence: amountPence,
          incurred_on: incurredOn,
          fund_id: fundId || null,
          event_id: eventId || null,
          receipt_url: receiptUrl,
          receipt_filename: receiptFilename,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Submit failed");

      reset();
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 bg-brand-blue text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark"
      >
        <Plus className="h-4 w-4" />
        New submission
      </button>

      <BottomSheet
        open={open}
        onClose={() => !busy && setOpen(false)}
        title="Submit an expense"
      >
        <form onSubmit={submit} className="space-y-3">
          {/* Kind toggle */}
          <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setKind("reimbursement")}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest transition-colors ${
                kind === "reimbursement"
                  ? "bg-white text-brand-dark shadow-sm"
                  : "text-gray-500"
              }`}
            >
              <User className="h-4 w-4" />
              Reimburse me
            </button>
            <button
              type="button"
              onClick={() => setKind("invoice")}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest transition-colors ${
                kind === "invoice"
                  ? "bg-white text-brand-dark shadow-sm"
                  : "text-gray-500"
              }`}
            >
              <Receipt className="h-4 w-4" />
              Supplier invoice
            </button>
          </div>

          <p className="text-xs text-gray-600 -mt-1">
            {kind === "reimbursement"
              ? "You bought something and want the CIC to pay you back."
              : "A supplier or contractor has invoiced the CIC — we need to pay them."}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
                Amount (£)
              </span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="42.00"
                className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
                Date incurred
              </span>
              <input
                type="date"
                value={incurredOn}
                onChange={(e) => setIncurredOn(e.target.value)}
                required
                className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
              What was this for?
            </span>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder={
                kind === "reimbursement"
                  ? "e.g. Bibs + cones for football day"
                  : "e.g. Coaching services 12 Sept 2026"
              }
              className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
            />
          </label>

          {kind === "invoice" && (
            <label className="block">
              <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
                Payee name
              </span>
              <input
                type="text"
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
                required
                placeholder="e.g. Kwame Coaching Ltd"
                className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
              />
            </label>
          )}

          <label className="block">
            <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
              Payment details for treasurer (optional)
            </span>
            <textarea
              value={payeeNotes}
              onChange={(e) => setPayeeNotes(e.target.value)}
              rows={2}
              placeholder={
                kind === "reimbursement"
                  ? "Only needed if treasurer doesn't already have your bank details"
                  : "Sort code + account number, IBAN, etc."
              }
              className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
                Fund (optional)
              </span>
              <select
                value={fundId}
                onChange={(e) => setFundId(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
              >
                <option value="">— Not yet —</option>
                {funds.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.code} · {f.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
                Event (optional)
              </span>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
              >
                <option value="">— None —</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
              Receipt / invoice
            </span>
            <div className="mt-1 flex items-center gap-2">
              <label className="flex-1 cursor-pointer inline-flex items-center justify-center gap-1.5 bg-white border border-gray-200 border-dashed text-brand-dark px-4 py-2.5 rounded-md text-sm hover:border-brand-blue">
                <Upload className="h-4 w-4" />
                {file ? file.name : "Choose file (photo or PDF)"}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
              {file && (
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-xs text-gray-500 hover:text-red-600"
                >
                  Remove
                </button>
              )}
            </div>
          </label>

          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-1.5 bg-brand-blue text-white px-4 py-3 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit for approval
          </button>
        </form>
      </BottomSheet>
    </>
  );
}
