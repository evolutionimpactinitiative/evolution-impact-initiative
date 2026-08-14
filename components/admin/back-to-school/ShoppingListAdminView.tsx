"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Loader2,
  Phone,
  Mail,
  MapPin,
  Clock,
} from "lucide-react";
import {
  skuGroupLabel,
  type StockCategory,
  type StockColour,
  type StockFit,
} from "@/lib/back-to-school-stock";
import type {
  ShoppingPledger,
  ShoppingReservation,
} from "@/lib/back-to-school/shopping-list";

interface Props {
  pledgers: ShoppingPledger[];
  reservations: ShoppingReservation[];
}

export function ShoppingListAdminView({ pledgers, reservations }: Props) {
  const byPledger = React.useMemo(() => {
    const map = new Map<string, ShoppingReservation[]>();
    for (const r of reservations) {
      const arr = map.get(r.pledger_id) ?? [];
      arr.push(r);
      map.set(r.pledger_id, arr);
    }
    return map;
  }, [reservations]);

  // Only show pledgers that have at least one reservation, sorted so ones
  // with active reservations bubble to the top.
  const visible = pledgers
    .map((p) => ({
      pledger: p,
      items: byPledger.get(p.id) ?? [],
    }))
    .filter((x) => x.items.length > 0)
    .sort((a, b) => {
      const activeA = a.items.filter((i) => i.status === "reserved").length;
      const activeB = b.items.filter((i) => i.status === "reserved").length;
      if (activeA !== activeB) return activeB - activeA;
      return (
        new Date(b.pledger.created_at).getTime() -
        new Date(a.pledger.created_at).getTime()
      );
    });

  if (visible.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-sm text-gray-500">
        No pledges yet. Once someone taps <em>&ldquo;I&rsquo;ll get one&rdquo;</em>{" "}
        on the shopping list, they&rsquo;ll appear here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visible.map((x) => (
        <PledgerCard
          key={x.pledger.id}
          pledger={x.pledger}
          reservations={x.items}
        />
      ))}
    </div>
  );
}

function PledgerCard({
  pledger,
  reservations,
}: {
  pledger: ShoppingPledger;
  reservations: ShoppingReservation[];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = React.useState(true);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const activeCount = reservations.filter((r) => r.status === "reserved")
    .length;
  const totalCount = reservations.length;
  const receivedCount = reservations.filter((r) => r.status === "received")
    .length;

  async function callApi(
    reservationId: string,
    action: "receive" | "cancel",
  ) {
    setBusy(`${action}:${reservationId}`);
    setError(null);
    try {
      const res = await fetch(
        `/api/back-to-school/shopping-list/${action}/${encodeURIComponent(reservationId)}`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-left active:bg-gray-50"
      >
        <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center font-heading font-black text-sm text-brand-blue shrink-0">
          {pledger.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-bold text-brand-dark truncate">
            {pledger.name}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {activeCount} reserved · {receivedCount} received ·{" "}
            {totalCount} total
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          {/* Contact + handover */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {pledger.email && (
              <a
                href={`mailto:${pledger.email}`}
                className="inline-flex items-center gap-2 text-brand-dark hover:text-brand-blue truncate"
              >
                <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                {pledger.email}
              </a>
            )}
            {pledger.phone && (
              <a
                href={`tel:${pledger.phone}`}
                className="inline-flex items-center gap-2 text-brand-dark hover:text-brand-blue"
              >
                <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                {pledger.phone}
              </a>
            )}
          </div>

          {pledger.delivery_method === "collection" ? (
            <div className="bg-brand-pale/40 rounded-xl p-3 text-sm text-brand-dark">
              <p className="text-[10px] uppercase tracking-widest font-heading font-bold text-brand-blue mb-2">
                Collection from donor
              </p>
              <div className="space-y-1">
                {(pledger.collection_date || pledger.collection_time) && (
                  <p className="inline-flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                    {[
                      pledger.collection_date
                        ? new Date(
                            pledger.collection_date,
                          ).toLocaleDateString("en-GB", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })
                        : null,
                      pledger.collection_time,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                {(pledger.collection_address || pledger.collection_postcode) && (
                  <p className="inline-flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                    <span>
                      {pledger.collection_address}
                      {pledger.collection_postcode
                        ? ` · ${pledger.collection_postcode}`
                        : ""}
                    </span>
                  </p>
                )}
                {!pledger.collection_date &&
                  !pledger.collection_time &&
                  !pledger.collection_address && (
                    <p className="text-xs text-gray-500">
                      No collection details — reach out to arrange.
                    </p>
                  )}
              </div>
            </div>
          ) : (
            <div className="bg-brand-pale/40 rounded-xl p-3 text-sm text-brand-dark">
              <p className="text-[10px] uppercase tracking-widest font-heading font-bold text-brand-blue mb-1">
                Donor is dropping off
              </p>
              <p className="text-xs text-gray-600">
                Expect them to bring items to the drive address themselves.
              </p>
            </div>
          )}

          {pledger.notes && (
            <div className="text-xs text-gray-700 bg-amber-50 border border-amber-200 rounded-lg p-3 italic">
              &ldquo;{pledger.notes}&rdquo;
            </div>
          )}

          {/* Reservations */}
          <ul className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
            {reservations.map((r) => (
              <li
                key={r.id}
                className="p-3 flex flex-wrap items-center gap-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-heading font-bold text-brand-dark">
                    {skuGroupLabel({
                      category: r.category as StockCategory,
                      colour: r.colour as StockColour,
                      sleeve: r.sleeve,
                      fit: r.fit as StockFit,
                    })}
                  </p>
                  <p className="text-xs text-gray-500">
                    Size {r.size} · qty {r.qty} ·{" "}
                    {new Date(r.created_at).toLocaleString("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <StatusPill status={r.status} />
                {r.status === "reserved" && (
                  <>
                    <button
                      type="button"
                      onClick={() => callApi(r.id, "receive")}
                      disabled={!!busy}
                      className="inline-flex items-center gap-1 bg-brand-green text-white px-3 py-1.5 rounded-md text-xs font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50"
                    >
                      {busy === `receive:${r.id}` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      Received
                    </button>
                    <button
                      type="button"
                      onClick={() => callApi(r.id, "cancel")}
                      disabled={!!busy}
                      className="inline-flex items-center gap-1 bg-white text-red-700 border border-red-200 px-3 py-1.5 rounded-md text-xs font-heading font-bold uppercase tracking-widest hover:bg-red-50 disabled:opacity-50"
                    >
                      {busy === `cancel:${r.id}` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                      Cancel
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>

          {error && (
            <p className="text-xs text-red-700">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    reserved: { bg: "bg-amber-100", text: "text-amber-800", label: "Reserved" },
    received: { bg: "bg-emerald-100", text: "text-emerald-800", label: "Received" },
    cancelled: { bg: "bg-gray-100", text: "text-gray-700", label: "Cancelled" },
  };
  const s = map[status] || { bg: "bg-gray-100", text: "text-gray-700", label: status };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-heading font-bold uppercase tracking-widest ${s.bg} ${s.text}`}
    >
      {s.label}
    </span>
  );
}
