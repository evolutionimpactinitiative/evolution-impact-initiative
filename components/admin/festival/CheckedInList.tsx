"use client";

import * as React from "react";
import { Search, Loader2, RotateCcw, Users } from "lucide-react";
import { undoCheckIn } from "@/app/admin/festival/check-in/actions";

export interface CheckedInRow {
  id: string;
  ticket_code: string;
  holder_name: string | null;
  holder_type: "lead" | "adult" | "child";
  checked_in_at: string;
  parent_name: string;
}

interface Props {
  rows: CheckedInRow[];
}

const TYPE_LABELS: Record<CheckedInRow["holder_type"], string> = {
  lead: "Lead booker",
  adult: "Adult",
  child: "Child",
};

const TYPE_COLORS: Record<CheckedInRow["holder_type"], string> = {
  lead: "bg-gray-800 text-white",
  adult: "bg-brand-green/15 text-brand-green",
  child: "bg-brand-blue/15 text-brand-blue",
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function relativeTime(iso: string, now: number): string {
  const diff = now - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function CheckedInList({ rows }: Props) {
  const [query, setQuery] = React.useState("");
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [now, setNow] = React.useState(Date.now());

  // Tick relative-time labels once a minute
  React.useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.holder_name?.toLowerCase().includes(q) ||
        r.parent_name.toLowerCase().includes(q) ||
        r.ticket_code.toLowerCase().includes(q),
    );
  }, [rows, query]);

  async function onUndo(ticketId: string, holder: string | null) {
    const label = holder || "this ticket";
    if (!confirm(`Undo check-in for ${label}?`)) return;
    setPendingId(ticketId);
    const res = await undoCheckIn(ticketId);
    setPendingId(null);
    if (!res.ok) alert(`Couldn't undo: ${res.error}`);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl">
      <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-heading font-black text-lg text-gray-900">
            Checked in
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {rows.length === 0
              ? "Nobody yet — scan the first QR to see them appear."
              : `${rows.length} ${rows.length === 1 ? "person" : "people"} so far`}
          </p>
        </div>

        {rows.length > 0 && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by name or code"
              className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 text-center">
          <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            {rows.length === 0
              ? "No check-ins yet."
              : "No matches for that search."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {filtered.map((row) => {
            const isPending = pendingId === row.id;
            return (
              <li
                key={row.id}
                className="p-4 md:px-5 flex items-center gap-3 md:gap-4 hover:bg-gray-50 transition-colors"
              >
                <span
                  className={`text-[10px] font-heading font-bold uppercase tracking-widest px-2 py-1 rounded-full whitespace-nowrap shrink-0 ${TYPE_COLORS[row.holder_type]}`}
                >
                  {TYPE_LABELS[row.holder_type]}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-sm text-gray-900 truncate">
                    {row.holder_name || "Guest"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    Party of {row.parent_name} ·{" "}
                    <span className="font-mono">{row.ticket_code}</span>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-heading font-bold text-brand-dark">
                    {formatTime(row.checked_in_at)}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {relativeTime(row.checked_in_at, now)}
                  </p>
                </div>

                <button
                  onClick={() => onUndo(row.id, row.holder_name)}
                  disabled={isPending}
                  className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 shrink-0"
                  title="Undo check-in"
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden md:inline">Undo</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
