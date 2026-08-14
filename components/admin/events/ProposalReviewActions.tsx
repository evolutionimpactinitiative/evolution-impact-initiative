"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftCircle,
  CheckCircle2,
  Eye,
  HelpCircle,
  Loader2,
  Send,
  XCircle,
} from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import type { ProposalStatus } from "@/lib/event-proposals/types";

type Action =
  | "submitted"
  | "in_review"
  | "needs_info"
  | "approved"
  | "rejected";

interface Props {
  proposalId: string;
  status: ProposalStatus;
  isAdmin: boolean;
}

const NOTE_PROMPT: Partial<Record<Action, { title: string; placeholder: string; required?: boolean }>> = {
  needs_info: {
    title: "What info do you need?",
    placeholder: "e.g. Please add a contingency plan for wet weather.",
    required: true,
  },
  approved: {
    title: "Approve — anything to add?",
    placeholder: "Optional note for the team (visible in the thread).",
  },
  rejected: {
    title: "Reason for rejecting",
    placeholder: "Explain briefly so the team knows what to revisit.",
    required: true,
  },
};

export function ProposalReviewActions({ proposalId, status, isAdmin }: Props) {
  const router = useRouter();
  const [pending, setPending] = React.useState<Action | null>(null);
  const [noteFor, setNoteFor] = React.useState<Action | null>(null);
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  async function run(action: Action, withNote?: string) {
    setPending(action);
    setError(null);
    try {
      const res = await fetch(`/api/event-proposals/${proposalId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action, note: withNote }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Action failed");
      setNoteFor(null);
      setNote("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setPending(null);
    }
  }

  function trigger(action: Action) {
    if (NOTE_PROMPT[action]) {
      setNote("");
      setError(null);
      setNoteFor(action);
    } else {
      run(action);
    }
  }

  // Available actions per status
  const canSubmit = status === "draft";
  const canMoveToReview = status === "submitted" || status === "needs_info";
  const canRequestInfo = status === "submitted" || status === "in_review";
  const canApproveReject =
    isAdmin && (status === "submitted" || status === "in_review" || status === "needs_info");

  const nothingToDo =
    !canSubmit && !canMoveToReview && !canRequestInfo && !canApproveReject;

  if (nothingToDo) {
    return (
      <p className="text-sm text-gray-500 italic">
        {status === "approved"
          ? "This proposal has been approved."
          : status === "rejected"
            ? "This proposal was rejected."
            : "No further actions available."}
      </p>
    );
  }

  const noteCfg = noteFor ? NOTE_PROMPT[noteFor] : undefined;

  return (
    <>
      {error && (
        <p className="text-sm text-red-700 mb-2 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {canSubmit && (
          <button
            type="button"
            onClick={() => run("submitted")}
            disabled={!!pending}
            className="inline-flex items-center gap-1.5 bg-brand-blue text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50"
          >
            {pending === "submitted" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Submit for review
          </button>
        )}
        {canMoveToReview && (
          <button
            type="button"
            onClick={() => run("in_review")}
            disabled={!!pending}
            className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-brand-dark px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:border-brand-blue disabled:opacity-50"
          >
            {pending === "in_review" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            Move to review
          </button>
        )}
        {canRequestInfo && (
          <button
            type="button"
            onClick={() => trigger("needs_info")}
            disabled={!!pending}
            className="inline-flex items-center gap-1.5 bg-amber-500 text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-amber-600 disabled:opacity-50"
          >
            <HelpCircle className="h-4 w-4" />
            Request info
          </button>
        )}
        {canApproveReject && (
          <>
            <button
              type="button"
              onClick={() => trigger("approved")}
              disabled={!!pending}
              className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              Approve
            </button>
            <button
              type="button"
              onClick={() => trigger("rejected")}
              disabled={!!pending}
              className="inline-flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-red-700 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </button>
          </>
        )}
      </div>

      <BottomSheet
        open={!!noteFor}
        onClose={() => !pending && setNoteFor(null)}
        title={noteCfg?.title ?? ""}
      >
        {noteFor && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (noteCfg?.required && !note.trim()) {
                setError("Please add a note.");
                return;
              }
              run(noteFor, note.trim() || undefined);
            }}
            className="space-y-3"
          >
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={noteCfg?.placeholder}
              rows={4}
              autoFocus
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
            {error && <p className="text-sm text-red-700">{error}</p>}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setNoteFor(null)}
                disabled={!!pending}
                className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-brand-dark px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:border-brand-blue disabled:opacity-50"
              >
                <ArrowLeftCircle className="h-4 w-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={!!pending}
                className="inline-flex items-center gap-1.5 bg-brand-blue text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50"
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Confirm
              </button>
            </div>
          </form>
        )}
      </BottomSheet>
    </>
  );
}
