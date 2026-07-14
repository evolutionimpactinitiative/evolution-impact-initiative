"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Mail,
  Phone,
  Clock,
  Check,
  X,
  MessageCircle,
} from "lucide-react";
import type { SponsorInquiry } from "@/app/admin/back-to-school/sponsors/page";

const TIER_LABEL: Record<string, string> = {
  friend: "Friend · £50",
  bronze: "Bronze · £100",
  silver: "Silver · £250",
  gold: "Gold · £500",
  family: "Family · £750",
  champion: "Champion · £1,000+",
  major: "Major · £1,500",
  title: "Title Partner · £3,000",
  custom: "Custom",
  undecided: "Exploring",
};

function statusPill(status: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: "bg-amber-100", text: "text-amber-800", label: "Pending" },
    contacted: { bg: "bg-blue-100", text: "text-blue-800", label: "Contacted" },
    confirmed: {
      bg: "bg-emerald-100",
      text: "text-emerald-800",
      label: "Confirmed",
    },
    declined: { bg: "bg-red-100", text: "text-red-800", label: "Declined" },
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
  Array<{
    to: SponsorInquiry["status"];
    label: string;
    icon: React.ReactNode;
  }>
> = {
  pending: [
    {
      to: "contacted",
      label: "Mark contacted",
      icon: <MessageCircle className="h-3.5 w-3.5" />,
    },
    {
      to: "declined",
      label: "Decline",
      icon: <X className="h-3.5 w-3.5" />,
    },
  ],
  contacted: [
    {
      to: "confirmed",
      label: "Mark confirmed",
      icon: <Check className="h-3.5 w-3.5" />,
    },
    {
      to: "declined",
      label: "Decline",
      icon: <X className="h-3.5 w-3.5" />,
    },
  ],
  confirmed: [
    {
      to: "cancelled",
      label: "Cancel",
      icon: <X className="h-3.5 w-3.5" />,
    },
  ],
  declined: [
    {
      to: "pending",
      label: "Reopen",
      icon: <Check className="h-3.5 w-3.5" />,
    },
  ],
  cancelled: [
    {
      to: "pending",
      label: "Reopen",
      icon: <Check className="h-3.5 w-3.5" />,
    },
  ],
};

interface Props {
  inquiry: SponsorInquiry;
}

export function SponsorInquiryRow({ inquiry }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = React.useState(false);
  const [busy, setBusy] = React.useState<SponsorInquiry["status"] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function transitionTo(newStatus: SponsorInquiry["status"]) {
    setError(null);
    setBusy(newStatus);
    try {
      const res = await fetch(
        `/api/back-to-school/sponsor-inquiries/${inquiry.id}/status`,
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

  const amountText = inquiry.amount_gbp
    ? `£${inquiry.amount_gbp.toLocaleString("en-GB")}`
    : TIER_LABEL[inquiry.tier] || inquiry.tier;

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
              {inquiry.business_name}
            </p>
            {statusPill(inquiry.status)}
            <span className="inline-flex items-center text-xs bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded-full font-heading font-bold uppercase tracking-widest">
              {TIER_LABEL[inquiry.tier] || inquiry.tier}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {inquiry.contact_name}
            {inquiry.contact_role ? ` · ${inquiry.contact_role}` : ""} ·{" "}
            {inquiry.contact_email}
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <Mail className="h-4 w-4 text-gray-400" />
              <a
                href={`mailto:${inquiry.contact_email}`}
                className="hover:text-brand-blue break-all"
              >
                {inquiry.contact_email}
              </a>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="h-4 w-4 text-gray-400" />
              <a
                href={`tel:${inquiry.contact_phone}`}
                className="hover:text-brand-blue"
              >
                {inquiry.contact_phone}
              </a>
            </div>
            <div className="text-gray-700">
              <span className="font-heading font-bold text-xs uppercase tracking-widest text-brand-blue mr-2">
                Tier
              </span>
              {amountText}
            </div>
          </div>

          {inquiry.message && (
            <div className="text-sm text-gray-700 bg-brand-pale/40 rounded-lg p-3">
              <span className="font-heading font-bold text-xs uppercase tracking-widest text-brand-blue mr-2">
                Message
              </span>
              <span className="whitespace-pre-wrap">{inquiry.message}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Inquired{" "}
              {new Date(inquiry.created_at).toLocaleString("en-GB", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
            {inquiry.followed_up_at && (
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5" />
                Contacted{" "}
                {new Date(inquiry.followed_up_at).toLocaleString("en-GB", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            )}
            {inquiry.confirmed_at && (
              <span className="inline-flex items-center gap-1">
                <Check className="h-3.5 w-3.5" />
                Confirmed{" "}
                {new Date(inquiry.confirmed_at).toLocaleString("en-GB", {
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

          {TRANSITIONS[inquiry.status] &&
            TRANSITIONS[inquiry.status].length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                {TRANSITIONS[inquiry.status].map((t) => (
                  <button
                    key={t.to}
                    type="button"
                    onClick={() => transitionTo(t.to)}
                    disabled={!!busy}
                    className={
                      t.to === "declined" || t.to === "cancelled"
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
