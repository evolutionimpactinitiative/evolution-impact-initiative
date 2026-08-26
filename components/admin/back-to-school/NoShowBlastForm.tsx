"use client";

import * as React from "react";
import { AlertTriangle, Loader2, Search, Send } from "lucide-react";

export interface NoShowRecipient {
  id: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
}

interface Props {
  recipients: NoShowRecipient[];
}

// Review-and-send screen. Full list of recipients shown with per-row
// checkboxes so the chair can drop anyone they don't want to email
// (e.g. someone they've spoken to in person). Body supports {{name}}
// substitution. Nothing sends until the two-step confirm.
export function NoShowBlastForm({ recipients }: Props) {
  const [subject, setSubject] = React.useState(
    "Missed our August drive? Second chance — Sat 5 September",
  );
  const [body, setBody] = React.useState(defaultBody);
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<Set<string>>(
    () => new Set(recipients.map((r) => r.id)),
  );
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<{
    sent: number;
    failed: number;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return recipients;
    return recipients.filter(
      (r) =>
        r.parent_name.toLowerCase().includes(q) ||
        r.parent_email.toLowerCase().includes(q) ||
        r.parent_phone.toLowerCase().includes(q),
    );
  }, [recipients, search]);

  const filteredIds = React.useMemo(
    () => new Set(filtered.map((r) => r.id)),
    [filtered],
  );
  const selectedInFilter = React.useMemo(
    () => filtered.filter((r) => selected.has(r.id)).length,
    [filtered, selected],
  );
  const allFilteredChecked =
    filtered.length > 0 && selectedInFilter === filtered.length;

  function toggleOne(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllFiltered() {
    setSelected((s) => {
      const next = new Set(s);
      if (allFilteredChecked) {
        for (const id of filteredIds) next.delete(id);
      } else {
        for (const id of filteredIds) next.add(id);
      }
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(recipients.map((r) => r.id)));
  }
  function selectNone() {
    setSelected(new Set());
  }

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        "/api/back-to-school/collection/no-show-blast",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject,
            body,
            recipientIds: Array.from(selected),
          }),
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
    <div className="space-y-6">
      {/* Recipient picker */}
      <fieldset className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <legend className="px-2 text-sm font-heading font-bold uppercase tracking-widest text-brand-blue">
          Recipients
        </legend>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-700">
            <b>{selected.size}</b> of {recipients.length} selected
          </p>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={selectAll}
              className="text-brand-blue hover:text-brand-dark underline"
            >
              Select all
            </button>
            <span className="text-gray-300">·</span>
            <button
              type="button"
              onClick={selectNone}
              className="text-brand-blue hover:text-brand-dark underline"
            >
              Select none
            </button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm"
          />
        </div>
        {filtered.length > 0 && (
          <label className="flex items-center gap-2 text-xs text-gray-600 select-none px-2">
            <input
              type="checkbox"
              checked={allFilteredChecked}
              onChange={toggleAllFiltered}
              className="h-3.5 w-3.5"
            />
            {search.trim()
              ? `Select all ${filtered.length} in this search`
              : "Toggle everyone"}
          </label>
        )}
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500 italic text-center py-6">
            No matches for &ldquo;{search}&rdquo;.
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto -mx-1 px-1 border-t border-gray-100 pt-2">
            <ul className="divide-y divide-gray-100">
              {filtered.map((r) => {
                const on = selected.has(r.id);
                return (
                  <li key={r.id}>
                    <label
                      className={`flex items-start gap-3 px-2 py-2.5 cursor-pointer rounded hover:bg-gray-50 ${
                        on ? "" : "opacity-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggleOne(r.id)}
                        className="mt-1 h-4 w-4"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-heading font-bold text-brand-dark truncate">
                          {r.parent_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {r.parent_email} · {r.parent_phone}
                        </p>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </fieldset>

      {/* Message */}
      <fieldset className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <legend className="px-2 text-sm font-heading font-bold uppercase tracking-widest text-brand-blue">
          Message
        </legend>
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
            Body (HTML supported, {`{{name}}`} gets swapped per recipient)
          </span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={14}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm font-mono"
          />
        </label>
      </fieldset>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      {!confirmOpen ? (
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={selected.size === 0}
          className="w-full inline-flex items-center justify-center gap-1.5 bg-brand-blue text-white px-4 py-3 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          Review &amp; send to {selected.size}
        </button>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900">
              About to email <b>{selected.size}</b> parent
              {selected.size === 1 ? "" : "s"}. Everyone gets this same
              message with their name swapped in. There&rsquo;s no undo
              once it fires.
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
<p>You registered for our Back to School Drive in August but didn't get to collect your items. No drama, we still have stock, and we're doing a second collection day on <b>Saturday 5 September, 12pm to 3pm</b> at ECA, 86 King Street, Rochester, ME1 1YD.</p>
<p><b>This is your second chance.</b></p>
<p>The catch: a lot of prep, money and volunteer time goes into every drive, and there are other families who need the space. If you register this time and don't turn up, you'll be blocked from all our future programs.</p>
<p>Book a slot here. The form takes 3 minutes and only shows you what we actually have in stock for your child's size:</p>
<p><a href="https://www.evolutionimpactinitiative.co.uk/back-to-school/collection/register">Book your Collection Day slot</a></p>
<p>Any questions, just reply to this email.</p>
<p>The Evolution Impact Initiative team</p>`;
