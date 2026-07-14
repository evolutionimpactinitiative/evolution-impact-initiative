"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Clock,
  Package,
  Truck,
  Check,
  X,
} from "lucide-react";
import type { SupplyPledge } from "@/app/admin/back-to-school/supplies/page";

function statusPill(status: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    pending: {
      bg: "bg-amber-100",
      text: "text-amber-800",
      label: "Pending",
    },
    confirmed: {
      bg: "bg-blue-100",
      text: "text-blue-800",
      label: "Confirmed",
    },
    received: {
      bg: "bg-emerald-100",
      text: "text-emerald-800",
      label: "Received",
    },
    cancelled: {
      bg: "bg-gray-100",
      text: "text-gray-700",
      label: "Cancelled",
    },
  };
  const s = map[status] || {
    bg: "bg-gray-100",
    text: "text-gray-700",
    label: status,
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-heading font-bold uppercase tracking-widest ${s.bg} ${s.text}`}
    >
      {s.label}
    </span>
  );
}

const TRANSITIONS: Record<
  string,
  Array<{ to: SupplyPledge["status"]; label: string; icon: React.ReactNode }>
> = {
  pending: [
    {
      to: "confirmed",
      label: "Confirm",
      icon: <Check className="h-3.5 w-3.5" />,
    },
    {
      to: "cancelled",
      label: "Cancel",
      icon: <X className="h-3.5 w-3.5" />,
    },
  ],
  confirmed: [
    {
      to: "received",
      label: "Mark received",
      icon: <Package className="h-3.5 w-3.5" />,
    },
    {
      to: "cancelled",
      label: "Cancel",
      icon: <X className="h-3.5 w-3.5" />,
    },
  ],
  received: [],
  cancelled: [
    {
      to: "pending",
      label: "Reopen",
      icon: <Check className="h-3.5 w-3.5" />,
    },
  ],
};

interface Props {
  pledge: SupplyPledge;
}

export function SupplyPledgeRow({ pledge }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = React.useState(false);
  const [busy, setBusy] = React.useState<SupplyPledge["status"] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function transitionTo(newStatus: SupplyPledge["status"]) {
    setError(null);
    setBusy(newStatus);
    try {
      const res = await fetch(
        `/api/back-to-school/supply-pledges/${pledge.id}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  const totalQty = pledge.items.reduce((s, it) => s + (it.qty || 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-200">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 p-4 md:p-5 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="font-heading font-bold text-brand-dark">
              {pledge.donor_name}
            </p>
            {statusPill(pledge.status)}
            <span
              className={
                pledge.delivery_method === "collection"
                  ? "inline-flex items-center gap-1 text-xs bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded-full font-heading font-bold uppercase tracking-widest"
                  : "inline-flex items-center gap-1 text-xs bg-brand-green/10 text-brand-green px-2 py-0.5 rounded-full font-heading font-bold uppercase tracking-widest"
              }
            >
              {pledge.delivery_method === "collection" ? (
                <Truck className="h-3 w-3" />
              ) : (
                <Package className="h-3 w-3" />
              )}
              {pledge.delivery_method === "collection"
                ? "Collect"
                : "Drop off"}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {pledge.items.length} line
            {pledge.items.length === 1 ? "" : "s"} · {totalQty} item
            {totalQty === 1 ? "" : "s"} · {pledge.donor_email}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-gray-100 p-4 md:p-5 space-y-4">
          {/* Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <Mail className="h-4 w-4 text-gray-400" />
              <a
                href={`mailto:${pledge.donor_email}`}
                className="hover:text-brand-blue break-all"
              >
                {pledge.donor_email}
              </a>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="h-4 w-4 text-gray-400" />
              <a
                href={`tel:${pledge.donor_phone}`}
                className="hover:text-brand-blue"
              >
                {pledge.donor_phone}
              </a>
            </div>
            {pledge.delivery_method === "collection" && (
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="break-words">
                  {pledge.collection_address} · {pledge.collection_postcode}
                </span>
              </div>
            )}
          </div>

          {pledge.preferred_window && (
            <div className="text-sm text-gray-700">
              <span className="font-heading font-bold text-xs uppercase tracking-widest text-brand-blue mr-2">
                Preferred window
              </span>
              {pledge.preferred_window}
            </div>
          )}

          {/* Items */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-xs uppercase tracking-widest text-gray-500">
                  <th className="text-left px-4 py-2">Item</th>
                  <th className="text-left px-4 py-2">Size</th>
                  <th className="text-right px-4 py-2 w-16">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pledge.items.map((it, i) => (
                  <tr key={`${it.item}-${i}`}>
                    <td className="px-4 py-2 text-brand-dark">{it.item}</td>
                    <td className="px-4 py-2 text-gray-600">
                      {it.size || "-"}
                    </td>
                    <td className="px-4 py-2 text-right font-heading font-bold text-brand-dark">
                      {it.qty}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pledge.notes && (
            <div className="text-sm text-gray-700 bg-brand-pale/40 rounded-lg p-3">
              <span className="font-heading font-bold text-xs uppercase tracking-widest text-brand-blue mr-2">
                Donor notes
              </span>
              {pledge.notes}
            </div>
          )}

          {/* Meta */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Pledged{" "}
              {new Date(pledge.created_at).toLocaleString("en-GB", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
            {pledge.received_at && (
              <span className="inline-flex items-center gap-1">
                <Package className="h-3.5 w-3.5" />
                Received{" "}
                {new Date(pledge.received_at).toLocaleString("en-GB", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          {TRANSITIONS[pledge.status] &&
            TRANSITIONS[pledge.status].length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                {TRANSITIONS[pledge.status].map((t) => (
                  <button
                    key={t.to}
                    type="button"
                    onClick={() => transitionTo(t.to)}
                    disabled={!!busy}
                    className={
                      t.to === "cancelled"
                        ? "inline-flex items-center gap-1.5 bg-white text-red-700 border border-red-200 px-3 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-red-50 disabled:opacity-50"
                        : "inline-flex items-center gap-1.5 bg-brand-blue text-white px-3 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50"
                    }
                  >
                    {busy === t.to ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      t.icon
                    )}
                    {t.label}
                  </button>
                ))}
              </div>
            )}
        </div>
      )}
    </div>
  );
}
