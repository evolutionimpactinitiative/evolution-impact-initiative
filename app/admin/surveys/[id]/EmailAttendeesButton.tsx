"use client";

import { useState, useTransition } from "react";
import { Loader2, Mail, Check, AlertTriangle } from "lucide-react";
import { emailSurveyToAttendees, type BroadcastAudience } from "./actions";

export function EmailAttendeesButton({
  surveyId,
  audience,
  audienceLabel,
  audienceCount,
  previousSendCount,
}: {
  surveyId: string;
  /** "event" = attendees of this survey's linked event.
   *  "gt_all" = everyone who's ever attended any Growing Together session. */
  audience: BroadcastAudience;
  /** Short human label used in the confirm dialog, e.g. "who attended Slime Lab"
   *  or "who've attended any Growing Together session". */
  audienceLabel: string;
  audienceCount: number;
  previousSendCount: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<
    | { kind: "ok"; sent: number; failed: number; attempted: number }
    | { kind: "err"; message: string }
    | null
  >(null);

  const disabled = audienceCount === 0;

  function send() {
    const confirmLines = [
      `Email this survey to ${audienceCount} ${audienceCount === 1 ? "person" : "people"} ${audienceLabel}?`,
    ];
    if (previousSendCount > 0) {
      confirmLines.push(
        `\n⚠️ This survey has already been broadcast ${previousSendCount} ${
          previousSendCount === 1 ? "time" : "times"
        } before — this will send again to the full list, including people already emailed.`,
      );
    }
    if (!confirm(confirmLines.join("\n"))) return;

    setResult(null);
    startTransition(async () => {
      try {
        const r = await emailSurveyToAttendees(surveyId, audience);
        setResult({ kind: "ok", ...r });
      } catch (err) {
        setResult({
          kind: "err",
          message: err instanceof Error ? err.message : "Could not send",
        });
      }
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={send}
        disabled={isPending || disabled}
        className="inline-flex items-center gap-2 bg-brand-blue text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Mail className="w-4 h-4" />
        )}
        Email survey
        {audienceCount > 0 && (
          <span className="bg-white/20 text-white text-xs font-bold rounded-full px-2 py-0.5">
            {audienceCount}
          </span>
        )}
      </button>

      {disabled && (
        <p className="text-xs text-gray-500">
          {audience === "event"
            ? "No attendees recorded for this event yet. Check in people on the event's check-in page first."
            : "No Growing Together attendees recorded yet. Once families start checking in to sessions, they'll appear here."}
        </p>
      )}

      {previousSendCount > 0 && !result && (
        <p className="text-xs text-amber-700 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Previously broadcast {previousSendCount}{" "}
          {previousSendCount === 1 ? "time" : "times"}.
        </p>
      )}

      {result?.kind === "ok" && (
        <p className="text-xs text-emerald-700 flex items-center gap-1">
          <Check className="w-3 h-3" />
          Sent to {result.sent} of {result.attempted}.
          {result.failed > 0 && (
            <span className="text-red-600 ml-1">
              {result.failed} failed.
            </span>
          )}
        </p>
      )}

      {result?.kind === "err" && (
        <p className="text-xs text-red-600">{result.message}</p>
      )}
    </div>
  );
}
