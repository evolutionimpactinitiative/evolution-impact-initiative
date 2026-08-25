"use client";

import * as React from "react";
import { AlertTriangle, Loader2, Send } from "lucide-react";

interface Props {
  recipientCount: number;
}

// Simple review-and-send screen. Server-rendered subject + body live
// here so the chair can tweak before firing. On confirm, POSTs to the
// blast endpoint which loops through August no-shows and calls Resend.
export function NoShowBlastForm({ recipientCount }: Props) {
  const [subject, setSubject] = React.useState(
    "Missed our August drive? Second chance — Sat 5 September",
  );
  const [body, setBody] = React.useState(defaultBody);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<{
    sent: number;
    failed: number;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        "/api/back-to-school/collection/no-show-blast",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject, body }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Send failed");
      setResult({ sent: data.sent ?? 0, failed: data.failed ?? 0 });
      setConfirmOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
        <p className="font-heading font-black text-brand-dark text-lg mb-2">
          Blast sent.
        </p>
        <p className="text-sm text-emerald-800">
          {result.sent} emails delivered
          {result.failed > 0 && ` · ${result.failed} failed`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="block text-xs font-heading font-bold uppercase tracking-widest text-gray-600 mb-1">
          Subject
        </span>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
        />
      </label>
      <label className="block">
        <span className="block text-xs font-heading font-bold uppercase tracking-widest text-gray-600 mb-1">
          Message (HTML supported — {`{{name}}`} gets replaced per recipient)
        </span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={16}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm font-mono"
        />
      </label>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      {!confirmOpen ? (
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={recipientCount === 0}
          className="w-full inline-flex items-center justify-center gap-1.5 bg-brand-blue text-white px-4 py-3 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          Review &amp; send to {recipientCount}
        </button>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900">
              About to email <b>{recipientCount}</b> parents. Everyone gets
              this same message with their name swapped in. There&rsquo;s no
              undo once it fires.
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-brand-dark px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:border-brand-blue disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={send}
              disabled={busy}
              className="inline-flex items-center gap-1.5 bg-brand-blue text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Yes, send it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const defaultBody = `<p>Hi {{name}},</p>
<p>You registered for our Back to School Drive in August but didn't get to collect your items — no drama, we still have stock, and we're doing a second collection day on <b>Saturday 5 September, 12pm–3pm</b> at the Sunlight Centre in Gillingham.</p>
<p><b>This is your second chance.</b></p>
<p>The catch: because a lot of prep, money and volunteer time goes into every drive, and there are other families who need the space, <b>if you register this time and don't turn up, you'll be blocked from all our future programs</b>.</p>
<p>Book a slot here — the form takes 3 minutes and only shows you what we actually have in stock for your child's size:</p>
<p><a href="https://www.evolutionimpactinitiative.co.uk/back-to-school/collection/register">Book your Collection Day slot</a></p>
<p>Any questions, just reply to this email.</p>
<p>— The Evolution Impact Initiative team</p>`;
