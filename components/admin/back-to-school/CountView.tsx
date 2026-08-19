"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronRight,
  Loader2,
  Minus,
  PackageCheck,
  Play,
  Plus,
  Search,
  X,
} from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import {
  CATEGORY_LABELS,
  COLOUR_LABELS,
  FIT_LABELS,
  SLEEVE_LABELS,
  skuGroupLabel,
  type StockRow,
} from "@/lib/back-to-school-stock";
import {
  tallyKey,
  type CountSession,
  type CountTally,
} from "@/lib/back-to-school/stock-count";

interface Props {
  session: CountSession | null;
  stockRows: StockRow[];
  tallies: CountTally[];
  pastSessions: CountSession[];
}

// A "box" is a physical labelled box = one SKU cell.
interface Box {
  key: string;
  category: string;
  colour: string;
  sleeve: string | null;
  fit: string;
  size: string;
  systemStock: number;
  counted: number;
}

export function CountView({
  session,
  stockRows,
  tallies,
  pastSessions,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [hideMatched, setHideMatched] = React.useState(false);
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [startOpen, setStartOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");

  // Build box list: one per stock SKU + any tallied SKU that doesn't
  // yet exist in stock (i.e. found-during-count items).
  const boxes = React.useMemo<Box[]>(() => {
    const map = new Map<string, Box>();
    for (const s of stockRows) {
      const k = tallyKey(s);
      map.set(k, {
        key: k,
        category: s.category,
        colour: s.colour,
        sleeve: s.sleeve,
        fit: s.fit,
        size: s.size,
        systemStock: s.quantity,
        counted: 0,
      });
    }
    for (const t of tallies) {
      const k = tallyKey(t);
      const existing = map.get(k);
      if (existing) {
        existing.counted = t.counted;
      } else {
        map.set(k, {
          key: k,
          category: t.category,
          colour: t.colour,
          sleeve: t.sleeve,
          fit: t.fit,
          size: t.size,
          systemStock: 0,
          counted: t.counted,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      if (a.colour !== b.colour) return a.colour.localeCompare(b.colour);
      if (a.fit !== b.fit) return a.fit.localeCompare(b.fit);
      const sa = a.sleeve ?? "";
      const sb = b.sleeve ?? "";
      if (sa !== sb) return sa.localeCompare(sb);
      return a.size.localeCompare(b.size, undefined, { numeric: true });
    });
  }, [stockRows, tallies]);

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    for (const b of boxes) set.add(b.category);
    return Array.from(set).sort();
  }, [boxes]);

  const filteredBoxes = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return boxes.filter((b) => {
      if (categoryFilter !== "all" && b.category !== categoryFilter) return false;
      if (hideMatched && b.counted === b.systemStock) return false;
      if (q) {
        const label =
          `${b.category} ${b.colour} ${b.sleeve ?? ""} ${b.fit} ${b.size}`.toLowerCase();
        if (!label.includes(q)) return false;
      }
      return true;
    });
  }, [boxes, categoryFilter, search, hideMatched]);

  // ─── Actions ────────────────────────────────────────────────────
  async function startSession() {
    setPending("start");
    setError(null);
    try {
      const res = await fetch("/api/back-to-school/count-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Start failed");
      setStartOpen(false);
      setNewName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setPending(null);
    }
  }

  async function bumpTally(box: Box, delta: number, absolute?: number) {
    if (!session) return;
    const tag = `bump-${box.key}`;
    setPending(tag);
    setError(null);
    try {
      const res = await fetch(
        `/api/back-to-school/count-sessions/${session.id}/tally`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            typeof absolute === "number"
              ? {
                  category: box.category,
                  colour: box.colour,
                  sleeve: box.sleeve,
                  fit: box.fit,
                  size: box.size,
                  setTo: absolute,
                }
              : {
                  category: box.category,
                  colour: box.colour,
                  sleeve: box.sleeve,
                  fit: box.fit,
                  size: box.size,
                  delta,
                },
          ),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Save failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setPending(null);
    }
  }

  async function closeSession() {
    if (!session) return;
    setPending("close");
    setError(null);
    try {
      const res = await fetch(
        `/api/back-to-school/count-sessions/${session.id}/close`,
        { method: "POST" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Close failed");
      setReviewOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setPending(null);
    }
  }

  // ─── No open session — show start CTA + past sessions ───────────
  if (!session) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
          <PackageCheck className="h-10 w-10 text-brand-blue mx-auto mb-3" />
          <p className="font-heading font-bold text-brand-dark text-lg">
            No count in progress
          </p>
          <p className="text-sm text-gray-600 mt-1 max-w-md mx-auto">
            Start a count session, then tap +1 on each SKU as you box up
            that item. When you&rsquo;re done, review the diffs and one-tap
            reconcile.
          </p>
          <button
            type="button"
            onClick={() => setStartOpen(true)}
            className="mt-5 inline-flex items-center gap-1.5 bg-brand-blue text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark"
          >
            <Play className="h-4 w-4" />
            Start count session
          </button>
        </div>

        {pastSessions.length > 0 && (
          <div>
            <p className="text-xs font-heading font-bold uppercase tracking-widest text-gray-500 mb-2">
              Recent counts
            </p>
            <ul className="space-y-2">
              {pastSessions.map((s) => (
                <li
                  key={s.id}
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-brand-dark truncate">
                      {s.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(s.started_at).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {s.closed_at &&
                        ` → closed ${new Date(s.closed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
                    </p>
                  </div>
                  <span className="text-[10px] font-heading font-bold uppercase tracking-widest bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                    {s.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <BottomSheet
          open={startOpen}
          onClose={() => !pending && setStartOpen(false)}
          title="Start a count session"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              startSession();
            }}
            className="space-y-3"
          >
            <label className="block">
              <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
                Session name (optional)
              </span>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={`Stock count ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
                className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
              />
            </label>
            {error && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={pending === "start"}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-brand-blue text-white px-4 py-3 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50"
            >
              {pending === "start" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Start
            </button>
          </form>
        </BottomSheet>
      </div>
    );
  }

  // ─── Active session — tally UI ──────────────────────────────────
  const tallied = boxes.filter((b) => b.counted > 0).length;
  const diffs = boxes.filter((b) => b.counted !== b.systemStock);
  const totalCounted = boxes.reduce((s, b) => s + b.counted, 0);

  return (
    <div className="space-y-4">
      {/* Session header */}
      <div className="bg-brand-blue/5 border border-brand-blue/20 rounded-2xl p-4 md:p-5 flex flex-wrap items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 font-heading font-bold uppercase tracking-widest">
            Session
          </p>
          <p className="font-heading font-bold text-brand-dark">{session.name}</p>
          <p className="text-xs text-gray-600 mt-0.5">
            {tallied} of {boxes.length} SKUs tallied · {totalCounted} items in
            boxes so far
          </p>
        </div>
        <button
          type="button"
          onClick={() => setReviewOpen(true)}
          className="inline-flex items-center gap-1.5 bg-brand-blue text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark"
        >
          <Check className="h-4 w-4" />
          Review & reconcile
          <span className="ml-1 text-[10px] bg-white/20 px-1.5 rounded-full">
            {diffs.length}
          </span>
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search 'polo boys 5-6' etc"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip
            active={categoryFilter === "all"}
            onClick={() => setCategoryFilter("all")}
          >
            All
          </FilterChip>
          {categories.map((c) => (
            <FilterChip
              key={c}
              active={categoryFilter === c}
              onClick={() => setCategoryFilter(c)}
            >
              {CATEGORY_LABELS[c as keyof typeof CATEGORY_LABELS] ?? c}
            </FilterChip>
          ))}
          <label className="ml-auto inline-flex items-center gap-1.5 text-xs text-gray-600 select-none">
            <input
              type="checkbox"
              checked={hideMatched}
              onChange={(e) => setHideMatched(e.target.checked)}
              className="h-3.5 w-3.5"
            />
            Hide matched
          </label>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {/* Box list */}
      {filteredBoxes.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-sm text-gray-500">
          No boxes match the current filter.
        </div>
      ) : (
        <ul className="space-y-2">
          {filteredBoxes.map((b) => (
            <BoxRow
              key={b.key}
              box={b}
              busy={pending === `bump-${b.key}`}
              onBump={(delta) => bumpTally(b, delta)}
              onSet={(v) => bumpTally(b, 0, v)}
            />
          ))}
        </ul>
      )}

      {/* Review sheet */}
      <BottomSheet
        open={reviewOpen}
        onClose={() => !pending && setReviewOpen(false)}
        title="Review & reconcile"
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            When you tap <b>Reconcile</b>, the system stock updates to match
            your physical count. Untallied SKUs stay unchanged.
          </p>
          {diffs.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4 text-center">
              <Check className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
              <p className="font-heading font-bold text-emerald-900">
                Everything matches!
              </p>
              <p className="text-sm text-emerald-800 mt-0.5">
                No adjustments needed — close the session with confidence.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-500">
                <b className="text-brand-dark">{diffs.length}</b> SKU
                {diffs.length === 1 ? "" : "s"} will be adjusted:
              </p>
              <div className="max-h-72 overflow-y-auto -mx-1 px-1">
                <ul className="space-y-1">
                  {diffs.map((b) => {
                    const delta = b.counted - b.systemStock;
                    return (
                      <li
                        key={b.key}
                        className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-xs"
                      >
                        <span className="flex-1 min-w-0 truncate">
                          {skuGroupLabel({
                            category: b.category as never,
                            colour: b.colour as never,
                            sleeve: b.sleeve as never,
                            fit: b.fit as never,
                          })}{" "}
                          · sz {b.size}
                        </span>
                        <span className="text-gray-500">
                          {b.systemStock} → {b.counted}
                        </span>
                        <span
                          className={`font-heading font-bold ${delta > 0 ? "text-emerald-700" : "text-red-700"}`}
                        >
                          {delta > 0 ? "+" : ""}
                          {delta}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setReviewOpen(false)}
              disabled={!!pending}
              className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-brand-dark px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:border-brand-blue disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              Keep counting
            </button>
            <button
              type="button"
              onClick={closeSession}
              disabled={pending === "close"}
              className="inline-flex items-center gap-1.5 bg-brand-blue text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50"
            >
              {pending === "close" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PackageCheck className="h-4 w-4" />
              )}
              Reconcile &amp; close
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

// ─── Box row — tap +/- to tally ───────────────────────────────────

function BoxRow({
  box,
  busy,
  onBump,
  onSet,
}: {
  box: Box;
  busy: boolean;
  onBump: (delta: number) => void;
  onSet: (v: number) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(String(box.counted));

  React.useEffect(() => {
    if (!editing) setDraft(String(box.counted));
  }, [box.counted, editing]);

  const delta = box.counted - box.systemStock;
  const matched = delta === 0;

  return (
    <li
      className={`bg-white border rounded-xl p-3 flex items-center gap-3 ${
        matched
          ? "border-gray-200"
          : delta > 0
            ? "border-emerald-200 bg-emerald-50/40"
            : "border-red-200 bg-red-50/40"
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="font-heading font-bold text-brand-dark text-sm truncate">
          {COLOUR_LABELS[box.colour as keyof typeof COLOUR_LABELS] ?? box.colour}{" "}
          {CATEGORY_LABELS[box.category as keyof typeof CATEGORY_LABELS]?.toLowerCase() ?? box.category}
          {box.sleeve && (
            <span className="text-gray-500 font-normal">
              {" "}
              · {SLEEVE_LABELS[box.sleeve as keyof typeof SLEEVE_LABELS]}
            </span>
          )}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {FIT_LABELS[box.fit as keyof typeof FIT_LABELS] ?? box.fit} · size{" "}
          <b className="text-brand-dark">{box.size}</b> · system says{" "}
          <b className="text-brand-dark">{box.systemStock}</b>
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onBump(-1)}
          disabled={busy || box.counted <= 0}
          aria-label="Decrement"
          className="w-9 h-9 rounded-full bg-white border border-gray-200 text-brand-dark inline-flex items-center justify-center active:bg-gray-100 disabled:opacity-40"
        >
          <Minus className="h-4 w-4" />
        </button>
        {editing ? (
          <input
            type="number"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              const n = Math.max(0, Math.round(Number(draft) || 0));
              if (n !== box.counted) onSet(n);
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") {
                setDraft(String(box.counted));
                setEditing(false);
              }
            }}
            autoFocus
            className="w-16 text-center font-heading font-black text-xl text-brand-dark border border-gray-200 rounded-md py-1"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="w-16 text-center font-heading font-black text-xl text-brand-dark tabular-nums"
            aria-label="Type a number"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : box.counted}
          </button>
        )}
        <button
          type="button"
          onClick={() => onBump(1)}
          disabled={busy}
          aria-label="Increment"
          className="w-11 h-11 rounded-full bg-brand-blue text-white inline-flex items-center justify-center active:bg-brand-dark disabled:opacity-50 shadow-sm"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
      {!matched && (
        <ChevronRight
          className={`h-4 w-4 shrink-0 ${delta > 0 ? "text-emerald-600" : "text-red-600"}`}
          aria-label={delta > 0 ? "extras vs system" : "short vs system"}
        />
      )}
    </li>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-heading font-bold uppercase tracking-widest ${
        active
          ? "bg-brand-blue text-white"
          : "bg-white border border-gray-200 text-brand-dark hover:border-brand-blue"
      }`}
    >
      {children}
    </button>
  );
}
