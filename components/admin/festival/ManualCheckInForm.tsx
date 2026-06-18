"use client";

import * as React from "react";
import { Loader2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { adminManualCheckIn } from "@/app/admin/festival/check-in/actions";

type ResultState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "success"; status: "checked_in" | "already_checked_in"; holder: string | null; lead: string }
  | { kind: "error"; message: string };

export function ManualCheckInForm() {
  const [code, setCode] = React.useState("");
  const [result, setResult] = React.useState<ResultState>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setResult({ kind: "checking" });
    const res = await adminManualCheckIn(code);
    if (!res.ok) {
      setResult({ kind: "error", message: res.error });
      return;
    }
    setResult({
      kind: "success",
      status: res.status,
      holder: res.holder,
      lead: res.lead,
    });
    setCode("");
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h2 className="font-heading font-black text-lg text-gray-900">
        Manual check-in
      </h2>
      <p className="text-sm text-gray-500 mt-1 mb-4">
        Type a ticket code if the QR can&rsquo;t be scanned (e.g. damaged phone, no signal).
      </p>

      <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Ticket code"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-blue uppercase"
        />
        <button
          type="submit"
          disabled={!code.trim() || result.kind === "checking"}
          className="inline-flex items-center justify-center gap-1.5 bg-brand-green text-white text-sm font-heading font-bold uppercase tracking-wider px-4 py-2.5 rounded-md hover:bg-brand-blue transition-colors disabled:opacity-50"
        >
          {result.kind === "checking" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Check in"
          )}
        </button>
      </form>

      {result.kind === "success" && (
        <div
          className={`mt-3 rounded-lg p-3 flex items-start gap-3 ${
            result.status === "already_checked_in"
              ? "bg-amber-50 border border-amber-200 text-amber-900"
              : "bg-emerald-50 border border-emerald-200 text-emerald-900"
          }`}
        >
          {result.status === "already_checked_in" ? (
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          )}
          <div className="text-sm">
            <p className="font-heading font-bold">
              {result.status === "already_checked_in"
                ? "Already checked in"
                : "Checked in"}
            </p>
            <p>
              {result.holder || "Guest"} · party led by {result.lead}
            </p>
          </div>
        </div>
      )}

      {result.kind === "error" && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3 text-red-800 text-sm">
          <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{result.message}</span>
        </div>
      )}
    </div>
  );
}
