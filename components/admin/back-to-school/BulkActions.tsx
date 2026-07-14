"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, Check, AlertCircle } from "lucide-react";

interface Props {
  pendingCount: number;
  approvedNotEmailedCount: number;
}

export function B2SBulkActions({
  pendingCount,
  approvedNotEmailedCount,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<"approve-all" | "send-approvals" | null>(
    null,
  );
  const [message, setMessage] = React.useState<{
    kind: "ok" | "error";
    text: string;
  } | null>(null);

  async function approveAllPending() {
    if (
      !confirm(
        `Approve all ${pendingCount} pending registrations? You can still send approval emails as a separate step.`,
      )
    ) {
      return;
    }
    setMessage(null);
    setBusy("approve-all");
    try {
      const res = await fetch(
        "/api/back-to-school/registrations/bulk-approve",
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setMessage({
        kind: "ok",
        text: `Approved ${data.approved} registrations.`,
      });
      router.refresh();
    } catch (err) {
      setMessage({
        kind: "error",
        text: err instanceof Error ? err.message : "Error",
      });
    } finally {
      setBusy(null);
    }
  }

  async function sendApprovals() {
    if (
      !confirm(
        `Send approval emails to ${approvedNotEmailedCount} approved families? Each will get a unique QR code.`,
      )
    ) {
      return;
    }
    setMessage(null);
    setBusy("send-approvals");
    try {
      const res = await fetch(
        "/api/back-to-school/registrations/send-approvals",
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setMessage({
        kind: "ok",
        text: `Sent ${data.sent} approval emails${data.failed ? ` (${data.failed} failed)` : ""}.`,
      });
      router.refresh();
    } catch (err) {
      setMessage({
        kind: "error",
        text: err instanceof Error ? err.message : "Error",
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-heading font-bold text-brand-dark text-sm">
            Bulk actions
          </p>
          <p className="text-xs text-gray-500">
            Use these on the 21st at 6PM to run the day&rsquo;s workflow.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={approveAllPending}
            disabled={pendingCount === 0 || !!busy}
            className="inline-flex items-center gap-1.5 bg-white text-brand-blue border border-brand-blue px-3 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-blue hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {busy === "approve-all" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Approve all pending ({pendingCount})
          </button>
          <button
            type="button"
            onClick={sendApprovals}
            disabled={approvedNotEmailedCount === 0 || !!busy}
            className="inline-flex items-center gap-1.5 bg-brand-green text-white px-3 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {busy === "send-approvals" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Send approval emails ({approvedNotEmailedCount})
          </button>
        </div>
      </div>
      {message && (
        <div
          className={
            message.kind === "ok"
              ? "mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-800 text-sm flex items-start gap-2"
              : "mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm flex items-start gap-2"
          }
        >
          {message.kind === "ok" ? (
            <Check className="h-4 w-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
}
