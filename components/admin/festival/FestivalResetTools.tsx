"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Trash2,
  Loader2,
  XCircle,
} from "lucide-react";
import {
  resetAllFestivalCheckIns,
  resetAllFestivalRegistrations,
} from "@/app/admin/festival/test-ticket-email/actions";

interface Props {
  registrationCount: number;
  ticketCount: number;
  checkedInCount: number;
}

type ResultState =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export function FestivalResetTools({
  registrationCount,
  ticketCount,
  checkedInCount,
}: Props) {
  const [checkInResult, setCheckInResult] = React.useState<ResultState>({
    kind: "idle",
  });
  const [hardResetResult, setHardResetResult] = React.useState<ResultState>({
    kind: "idle",
  });

  async function onResetCheckIns() {
    if (checkedInCount === 0) {
      setCheckInResult({
        kind: "success",
        message: "Nothing to clear — no tickets are checked in.",
      });
      return;
    }
    const confirmed = confirm(
      `Clear ${checkedInCount} check-in${checkedInCount === 1 ? "" : "s"}? Tickets stay valid — only the "checked in" state is wiped.`,
    );
    if (!confirmed) return;
    setCheckInResult({ kind: "running" });
    const res = await resetAllFestivalCheckIns();
    if (!res.ok) {
      setCheckInResult({ kind: "error", message: res.error });
      return;
    }
    setCheckInResult({
      kind: "success",
      message: `Cleared ${res.cleared} check-in${res.cleared === 1 ? "" : "s"}. Tickets remain valid.`,
    });
  }

  async function onHardReset() {
    if (registrationCount === 0) {
      setHardResetResult({
        kind: "success",
        message: "Nothing to delete — there are no registrations.",
      });
      return;
    }
    const phrase = "DELETE";
    const input = prompt(
      `This will DELETE ${registrationCount} registration${registrationCount === 1 ? "" : "s"} and ALL ${ticketCount} ticket${ticketCount === 1 ? "" : "s"} for Evolution Fest 2026.\n\nThis cannot be undone.\n\nType ${phrase} to confirm:`,
    );
    if (input !== phrase) {
      setHardResetResult({
        kind: "error",
        message: `Cancelled — you need to type ${phrase} exactly.`,
      });
      return;
    }
    setHardResetResult({ kind: "running" });
    const res = await resetAllFestivalRegistrations();
    if (!res.ok) {
      setHardResetResult({ kind: "error", message: res.error });
      return;
    }
    setHardResetResult({
      kind: "success",
      message: `Deleted ${res.deleted} registration${res.deleted === 1 ? "" : "s"} and their tickets. Clean slate.`,
    });
  }

  return (
    <div className="bg-white border-2 border-red-200 rounded-xl overflow-hidden">
      <div className="bg-red-50 px-5 py-3 border-b border-red-200 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <p className="font-heading font-bold text-sm text-red-800 uppercase tracking-widest">
          Reset tools
        </p>
      </div>

      <div className="p-5 space-y-5">
        <p className="text-sm text-gray-600 leading-relaxed">
          Two ways to wipe the test state. The soft reset is safe to run any
          time; the hard reset is permanent and requires typing{" "}
          <code className="text-xs bg-gray-100 px-1.5 rounded">DELETE</code> to
          confirm.
        </p>

        {/* Current state summary */}
        <div className="grid grid-cols-3 gap-3">
          <SummaryTile label="Registrations" value={registrationCount} />
          <SummaryTile label="Tickets" value={ticketCount} />
          <SummaryTile label="Checked in" value={checkedInCount} />
        </div>

        {/* 1. Soft reset — clear check-ins */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold text-sm text-gray-900">
                1. Reset check-ins only
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Clears every <code className="bg-gray-100 px-1 rounded">checked_in_at</code> on
                festival tickets. Tickets stay valid and scannable — useful for
                re-testing the steward flow against the same QR codes.
              </p>
            </div>
            <button
              onClick={onResetCheckIns}
              disabled={checkInResult.kind === "running"}
              className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-heading font-bold uppercase tracking-wider px-4 py-2 rounded-md transition-colors disabled:opacity-50 shrink-0"
            >
              {checkInResult.kind === "running" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
              Clear check-ins
            </button>
          </div>
          <ResultLine result={checkInResult} />
        </div>

        {/* 2. Hard reset — delete everything */}
        <div className="border border-red-200 rounded-lg p-4 bg-red-50/30">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold text-sm text-red-900">
                2. Delete all registrations & tickets
              </p>
              <p className="text-xs text-red-700/80 mt-0.5">
                Permanently deletes every registration, every ticket, every
                check-in, every linked child/attendee row for this festival.
                Admins only. Requires typing{" "}
                <code className="bg-white px-1 rounded text-red-800">
                  DELETE
                </code>
                .
              </p>
            </div>
            <button
              onClick={onHardReset}
              disabled={hardResetResult.kind === "running"}
              className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-heading font-bold uppercase tracking-wider px-4 py-2 rounded-md transition-colors disabled:opacity-50 shrink-0"
            >
              {hardResetResult.kind === "running" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Delete everything
            </button>
          </div>
          <ResultLine result={hardResetResult} />
        </div>
      </div>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-center">
      <p className="font-heading font-black text-2xl text-brand-dark leading-none">
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-1.5">
        {label}
      </p>
    </div>
  );
}

function ResultLine({ result }: { result: ResultState }) {
  if (result.kind === "idle") return null;
  if (result.kind === "running") return null;
  if (result.kind === "success") {
    return (
      <div className="mt-3 inline-flex items-start gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        {result.message}
      </div>
    );
  }
  return (
    <div className="mt-3 inline-flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
      <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
      {result.message}
    </div>
  );
}
