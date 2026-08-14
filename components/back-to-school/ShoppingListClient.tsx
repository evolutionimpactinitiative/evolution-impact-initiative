"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ShoppingBag,
  MapPin,
  Truck,
  Pencil,
  Plus,
  Minus,
  Info,
  Check,
} from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import type {
  NeedRow,
  ShoppingReservation,
} from "@/lib/back-to-school/shopping-list";

const LS_KEY = "b2s.shopping-list.pledger";

interface StoredSession {
  pledgerId: string;
  name: string;
  email: string;
  phone: string;
  deliveryMethod: "collection" | "drop_off";
  collectionDate: string;
  collectionTime: string;
  collectionAddress: string;
  collectionPostcode: string;
  notes: string;
}

interface Venue {
  name: string;
  address: string;
  area: string;
  dateLabel: string;
  timeLabel: string;
}

interface Props {
  keyParam: string;
  needRows: NeedRow[];
  reservations: ShoppingReservation[];
  venue: Venue;
}

const EMPTY_SESSION: StoredSession = {
  pledgerId: "",
  name: "",
  email: "",
  phone: "",
  deliveryMethod: "collection",
  collectionDate: "",
  collectionTime: "",
  collectionAddress: "",
  collectionPostcode: "",
  notes: "",
};

export function ShoppingListClient({
  keyParam,
  needRows,
  reservations,
  venue,
}: Props) {
  const router = useRouter();
  const [session, setSession] = React.useState<StoredSession | null>(null);
  const [intakeOpen, setIntakeOpen] = React.useState(false);
  const [dropOffOpen, setDropOffOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Load stored session from localStorage on first paint. If nothing there,
  // open the intake sheet automatically so the donor gets straight into
  // filling their details.
  React.useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredSession;
        if (parsed?.pledgerId) {
          setSession(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }
    setIntakeOpen(true);
  }, []);

  function persist(next: StoredSession) {
    setSession(next);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  // Reservations that belong to the current pledger — surface with -1
  // controls + counts.
  const myReservations = React.useMemo(() => {
    if (!session) return new Map<string, ShoppingReservation[]>();
    const out = new Map<string, ShoppingReservation[]>();
    for (const r of reservations) {
      if (r.pledger_id !== session.pledgerId) continue;
      const key = cellKey(r);
      const arr = out.get(key) ?? [];
      arr.push(r);
      out.set(key, arr);
    }
    return out;
  }, [reservations, session]);

  return (
    <div className="min-h-screen bg-brand-pale/40 pb-20">
      {/* HEADER */}
      <section className="bg-gradient-to-br from-brand-blue to-brand-dark text-white pt-14 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-widest font-heading font-bold text-brand-accent mb-2">
            Back to School Drive · Shopping list
          </p>
          <h1 className="font-heading font-black text-2xl md:text-3xl leading-tight mb-3">
            Grab an item for a Medway family
          </h1>
          <p className="text-white/85 text-sm md:text-base leading-relaxed">
            Tap <strong className="text-brand-accent">I&rsquo;ll get one</strong>{" "}
            next to anything you can pick up. It reserves the item so nobody
            else duplicates. Bring what you&rsquo;ve pledged and we&rsquo;ll
            collect from you.
          </p>
        </div>
      </section>

      {/* SESSION HEADER — who's shopping */}
      <div className="max-w-2xl mx-auto px-4 -mt-4">
        {mounted && session && (
          <div className="bg-white rounded-2xl border border-brand-blue/20 p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-brand-blue text-white flex items-center justify-center font-heading font-black text-sm shrink-0">
              {session.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold text-brand-dark truncate">
                Pledging as {session.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {session.deliveryMethod === "collection"
                  ? "We collect from you"
                  : "You drop off"}
                {" · "}
                {[session.email, session.phone].filter(Boolean).join(" · ") ||
                  "no contact yet"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIntakeOpen(true)}
              className="inline-flex items-center gap-1 text-brand-blue text-xs font-heading font-bold uppercase tracking-widest hover:text-brand-dark shrink-0"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
          </div>
        )}
        {mounted && !session && (
          <div className="bg-white rounded-2xl border-2 border-brand-blue p-4 space-y-2">
            <p className="font-heading font-bold text-brand-dark">
              First, tell us who you are
            </p>
            <button
              type="button"
              onClick={() => setIntakeOpen(true)}
              className="w-full bg-brand-blue text-white px-4 py-3 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark"
            >
              Start pledging
            </button>
          </div>
        )}
      </div>

      {/* LIST */}
      <section className="max-w-2xl mx-auto px-4 mt-6 space-y-3">
        {needRows.length === 0 ? (
          <div className="bg-white border-2 border-brand-green/25 rounded-2xl p-8 text-center">
            <ShoppingBag className="h-10 w-10 text-brand-green mx-auto mb-3" />
            <p className="font-heading font-bold text-brand-dark text-lg mb-1">
              Everything&rsquo;s covered
            </p>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              We&rsquo;ve either got enough in stock or someone else has
              already committed to grabbing every outstanding item. Thank
              you for wanting to help.
            </p>
          </div>
        ) : (
          needRows.map((row) => (
            <NeedRowCard
              key={cellKey(row)}
              row={row}
              keyParam={keyParam}
              session={session}
              mineHere={myReservations.get(cellKey(row)) ?? []}
              onReserved={() => router.refresh()}
              onNeedsSession={() => setIntakeOpen(true)}
            />
          ))
        )}

        {needRows.length > 0 && (
          <button
            type="button"
            onClick={() => setDropOffOpen(true)}
            className="w-full mt-4 inline-flex items-center justify-center gap-2 bg-white text-brand-dark border border-gray-200 hover:border-brand-blue px-4 py-3 rounded-md text-sm font-heading font-bold uppercase tracking-widest"
          >
            <Truck className="h-4 w-4 text-brand-blue" />
            Prefer to drop off yourself? Show me where
          </button>
        )}
      </section>

      {/* INTAKE SHEET */}
      <IntakeSheet
        open={intakeOpen}
        onClose={() => {
          if (session) setIntakeOpen(false);
        }}
        keyParam={keyParam}
        initial={session ?? EMPTY_SESSION}
        onSaved={(next) => {
          persist(next);
          setIntakeOpen(false);
        }}
      />

      {/* DROP-OFF SHEET */}
      <BottomSheet
        open={dropOffOpen}
        onClose={() => setDropOffOpen(false)}
        title="Drop-off address"
      >
        <div className="space-y-4 text-sm">
          <p className="text-gray-600">
            If it&rsquo;s easier for you to drop off the items yourself, aim
            for the drive venue:
          </p>
          <div className="bg-brand-pale/60 rounded-xl p-4 flex items-start gap-3">
            <MapPin className="h-5 w-5 text-brand-blue shrink-0 mt-0.5" />
            <div>
              <p className="font-heading font-bold text-brand-dark">
                {venue.name}
              </p>
              <p className="text-gray-700 text-sm">{venue.address}</p>
              <p className="text-xs text-gray-500 mt-2">
                Distribution day is {venue.dateLabel} · {venue.timeLabel}. For
                earlier drop-off arrangements, reply to your confirmation email
                or use the phone on the drive page and we&rsquo;ll coordinate.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDropOffOpen(false)}
            className="w-full bg-brand-blue text-white px-4 py-3 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark"
          >
            Got it
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}

function cellKey(r: {
  category: string;
  colour: string;
  sleeve: string | null;
  fit: string;
  size: string;
}): string {
  return `${r.category}|${r.colour}|${r.sleeve ?? ""}|${r.fit}|${r.size}`;
}

function NeedRowCard({
  row,
  keyParam,
  session,
  mineHere,
  onReserved,
  onNeedsSession,
}: {
  row: NeedRow;
  keyParam: string;
  session: StoredSession | null;
  mineHere: ShoppingReservation[];
  onReserved: () => void;
  onNeedsSession: () => void;
}) {
  const [busy, setBusy] = React.useState<"reserve" | "remove" | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const mineCount = mineHere.reduce((s, r) => s + (r.qty ?? 1), 0);

  async function reserveOne() {
    if (!session) {
      onNeedsSession();
      return;
    }
    setBusy("reserve");
    setError(null);
    try {
      const res = await fetch(
        "/api/back-to-school/shopping-list/reserve",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            k: keyParam,
            pledgerId: session.pledgerId,
            category: row.category,
            colour: row.colour,
            sleeve: row.sleeve,
            fit: row.fit,
            size: row.size,
            qty: 1,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      onReserved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  async function removeMostRecent() {
    if (!session) return;
    const latest = [...mineHere].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0];
    if (!latest) return;
    setBusy("remove");
    setError(null);
    try {
      const res = await fetch(
        `/api/back-to-school/shopping-list/reserve/${encodeURIComponent(latest.id)}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            k: keyParam,
            pledgerId: session.pledgerId,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      onReserved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-4 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-heading font-bold text-brand-dark leading-tight">
            {row.label}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="inline-flex items-baseline gap-1.5 bg-brand-pale/70 px-2.5 py-1 rounded-full text-xs">
              <span className="font-heading font-bold text-brand-blue">
                Size {row.size}
              </span>
            </span>
            <span className="text-sm">
              <span className="font-heading font-black text-brand-dark text-base">
                {row.needed}
              </span>{" "}
              <span className="text-gray-500">
                more needed
              </span>
            </span>
            {row.reserved > 0 && (
              <span className="text-xs text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                {row.reserved} reserved
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-gray-100 bg-brand-pale/20 px-4 py-3 flex items-center gap-2">
        {mineCount > 0 && (
          <button
            type="button"
            onClick={removeMostRecent}
            disabled={!!busy}
            className="inline-flex items-center gap-1 bg-white text-red-700 border border-red-200 px-3 py-2 rounded-md text-xs font-heading font-bold uppercase tracking-widest hover:bg-red-50 disabled:opacity-50"
          >
            {busy === "remove" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Minus className="h-3.5 w-3.5" />
            )}
            Remove one
          </button>
        )}
        <button
          type="button"
          onClick={reserveOne}
          disabled={!!busy}
          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-brand-blue text-white px-3 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50"
        >
          {busy === "reserve" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          I&rsquo;ll get one
          {mineCount > 0 && (
            <span className="ml-1 bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full">
              you: {mineCount}
            </span>
          )}
        </button>
      </div>
      {error && (
        <div className="px-4 pb-3 text-xs text-red-700">
          <Info className="h-3.5 w-3.5 inline mr-1" />
          {error}
        </div>
      )}
    </div>
  );
}

function IntakeSheet({
  open,
  onClose,
  keyParam,
  initial,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  keyParam: string;
  initial: StoredSession;
  onSaved: (next: StoredSession) => void;
}) {
  const [form, setForm] = React.useState<StoredSession>(initial);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) setForm(initial);
  }, [open, initial]);

  function update<K extends keyof StoredSession>(k: K, v: StoredSession[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        "/api/back-to-school/shopping-list/session",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            k: keyParam,
            pledgerId: form.pledgerId || null,
            name: form.name,
            email: form.email,
            phone: form.phone,
            deliveryMethod: form.deliveryMethod,
            collectionDate: form.collectionDate || null,
            collectionTime: form.collectionTime,
            collectionAddress: form.collectionAddress,
            collectionPostcode: form.collectionPostcode,
            notes: form.notes,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      onSaved({ ...form, pledgerId: data.pledgerId });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Your details"
      labelledBy="shopping-intake-title"
    >
      <form onSubmit={submit} className="space-y-3">
        <label className="block">
          <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
            Your name *
          </span>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            required
            className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
          />
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
              Email
            </span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
              inputMode="email"
              autoComplete="email"
            />
          </label>
          <label className="block">
            <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
              Phone
            </span>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
              inputMode="tel"
              autoComplete="tel"
            />
          </label>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
            Handover
          </legend>
          <div className="grid grid-cols-2 gap-2">
            <label
              className={
                (form.deliveryMethod === "collection"
                  ? "bg-brand-blue text-white border-brand-blue "
                  : "bg-white text-brand-dark border-gray-200 ") +
                "border-2 rounded-lg px-3 py-2 text-sm font-heading font-bold cursor-pointer flex items-center gap-2"
              }
            >
              <input
                type="radio"
                name="deliveryMethod"
                value="collection"
                checked={form.deliveryMethod === "collection"}
                onChange={() => update("deliveryMethod", "collection")}
                className="sr-only"
              />
              {form.deliveryMethod === "collection" && (
                <Check className="h-4 w-4" />
              )}
              We collect
            </label>
            <label
              className={
                (form.deliveryMethod === "drop_off"
                  ? "bg-brand-blue text-white border-brand-blue "
                  : "bg-white text-brand-dark border-gray-200 ") +
                "border-2 rounded-lg px-3 py-2 text-sm font-heading font-bold cursor-pointer flex items-center gap-2"
              }
            >
              <input
                type="radio"
                name="deliveryMethod"
                value="drop_off"
                checked={form.deliveryMethod === "drop_off"}
                onChange={() => update("deliveryMethod", "drop_off")}
                className="sr-only"
              />
              {form.deliveryMethod === "drop_off" && (
                <Check className="h-4 w-4" />
              )}
              I&rsquo;ll drop off
            </label>
          </div>
        </fieldset>

        {form.deliveryMethod === "collection" && (
          <div className="space-y-3 border-t border-gray-100 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
                  Best pickup date
                </span>
                <input
                  type="date"
                  value={form.collectionDate}
                  onChange={(e) => update("collectionDate", e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
                  Time window
                </span>
                <input
                  type="text"
                  value={form.collectionTime}
                  onChange={(e) => update("collectionTime", e.target.value)}
                  placeholder="e.g. after 5pm"
                  className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
                />
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="block sm:col-span-2">
                <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
                  Pickup address
                </span>
                <input
                  type="text"
                  value={form.collectionAddress}
                  onChange={(e) => update("collectionAddress", e.target.value)}
                  placeholder="Number + street"
                  className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
                  Postcode
                </span>
                <input
                  type="text"
                  value={form.collectionPostcode}
                  onChange={(e) =>
                    update("collectionPostcode", e.target.value.toUpperCase())
                  }
                  className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm uppercase"
                />
              </label>
            </div>
          </div>
        )}

        <label className="block">
          <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
            Notes (optional)
          </span>
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={2}
            className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
            placeholder="Anything the team should know?"
          />
        </label>

        {error && (
          <p className="text-sm text-red-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full inline-flex items-center justify-center gap-1.5 bg-brand-blue text-white px-4 py-3 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save &amp; start pledging
        </button>
      </form>
    </BottomSheet>
  );
}
