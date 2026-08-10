"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  ArrowUpCircle,
} from "lucide-react";
import { uniformChoicesSummary } from "@/lib/back-to-school";
import type { B2SRegistration } from "@/app/admin/back-to-school/registrations/page";

const NEED_LABEL: Record<string, string> = {
  uniform: "Uniform",
  stationery: "Stationery",
  bag: "Bag",
};

function statusPill(status: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    pending: {
      bg: "bg-amber-100",
      text: "text-amber-800",
      label: "Pending",
    },
    approved: {
      bg: "bg-emerald-100",
      text: "text-emerald-800",
      label: "Approved",
    },
    declined: { bg: "bg-red-100", text: "text-red-800", label: "Declined" },
    confirmed: {
      bg: "bg-emerald-100",
      text: "text-emerald-800",
      label: "Confirmed",
    },
    waitlisted: {
      bg: "bg-blue-100",
      text: "text-blue-800",
      label: "Waitlisted",
    },
    cancelled: { bg: "bg-gray-100", text: "text-gray-700", label: "Cancelled" },
  };
  const s = map[status] || { bg: "bg-gray-100", text: "text-gray-700", label: status };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-heading font-bold uppercase tracking-widest ${s.bg} ${s.text}`}
    >
      {s.label}
    </span>
  );
}

function distributionPill(status: string | null) {
  if (!status) return null;
  const map: Record<string, { bg: string; text: string; label: string }> = {
    collected: {
      bg: "bg-brand-green/15",
      text: "text-brand-green",
      label: "Collected",
    },
    partial: {
      bg: "bg-amber-100",
      text: "text-amber-800",
      label: "Partial",
    },
    no_show: { bg: "bg-red-100", text: "text-red-800", label: "No-show" },
  };
  const s = map[status] || { bg: "bg-gray-100", text: "text-gray-700", label: status };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-heading font-bold uppercase tracking-widest ${s.bg} ${s.text}`}
    >
      {s.label}
    </span>
  );
}

interface Props {
  registration: B2SRegistration;
}

export function B2SRegistrationRow({ registration }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = React.useState(false);
  const [busy, setBusy] = React.useState<
    "approve" | "decline" | "email" | "promote" | null
  >(null);
  const [error, setError] = React.useState<string | null>(null);

  async function setDecision(decision: "approve" | "decline") {
    setError(null);
    setBusy(decision);
    try {
      const res = await fetch(
        `/api/back-to-school/registrations/${registration.id}/decision`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision }),
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

  async function resendApproval() {
    setError(null);
    setBusy("email");
    try {
      const res = await fetch(
        `/api/back-to-school/registrations/${registration.id}/send-approval`,
        { method: "POST" },
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

  async function promoteFromWaitlist() {
    setError(null);
    setBusy("promote");
    try {
      const res = await fetch(
        `/api/back-to-school/registrations/${registration.id}/promote`,
        { method: "POST" },
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

  const children = [...registration.registration_children].sort(
    (a, b) => a.display_order - b.display_order,
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-200">
      {/* HEADER ROW */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 p-4 md:p-5 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="font-heading font-bold text-brand-dark">
              {registration.parent_name}
            </p>
            {statusPill(registration.status)}
            {distributionPill(registration.distribution_status)}
            {registration.approval_email_sent_at && (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-brand-green font-heading font-bold">
                <Send className="h-3 w-3" />
                Emailed
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">
            {children.length} {children.length === 1 ? "child" : "children"} ·{" "}
            {registration.parent_email} · {registration.parent_postcode || "-"}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />
        )}
      </button>

      {/* EXPANDED */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 md:p-5 space-y-4">
          {/* Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <Mail className="h-4 w-4 text-gray-400" />
              <a
                href={`mailto:${registration.parent_email}`}
                className="hover:text-brand-blue break-all"
              >
                {registration.parent_email}
              </a>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="h-4 w-4 text-gray-400" />
              <a
                href={`tel:${registration.parent_phone}`}
                className="hover:text-brand-blue"
              >
                {registration.parent_phone}
              </a>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>{registration.parent_postcode || "-"}</span>
            </div>
          </div>

          {/* Children */}
          <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
            {children.map((child) => {
              const items = child.items_given || {};
              return (
                <div key={child.id} className="p-4">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <p className="font-heading font-bold text-brand-dark">
                      {child.child_name}
                    </p>
                    {child.child_age != null && (
                      <span className="text-xs text-gray-500">
                        · age {child.child_age}
                      </span>
                    )}
                    {child.uniform_size && (
                      <span className="text-xs bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded-full font-heading font-bold uppercase tracking-widest">
                        Size {child.uniform_size}
                      </span>
                    )}
                    {child.sex && (
                      <span className="text-xs text-gray-500">
                        · {child.sex.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                  {child.school && (
                    <p className="text-xs text-gray-600 mb-1">
                      School: {child.school}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(child.needs ?? []).map((n) => {
                      const given = items[n] === true;
                      return (
                        <span
                          key={n}
                          className={
                            given
                              ? "inline-flex items-center gap-1 text-xs bg-brand-green/15 text-brand-green px-2 py-0.5 rounded-full font-semibold"
                              : "inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full"
                          }
                        >
                          {given && <Check className="h-3 w-3" />}
                          {NEED_LABEL[n] || n}
                        </span>
                      );
                    })}
                  </div>
                  {child.uniform_choices && (
                    <p className="text-xs text-brand-blue mt-2 font-semibold">
                      Uniform: {uniformChoicesSummary(child.uniform_choices)}
                    </p>
                  )}
                  {child.notes && (
                    <p className="text-xs text-gray-600 mt-2 italic">
                      &ldquo;{child.notes}&rdquo;
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Registered{" "}
              {new Date(registration.created_at).toLocaleString("en-GB", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
            {registration.approval_email_sent_at && (
              <span className="inline-flex items-center gap-1">
                <Send className="h-3.5 w-3.5" />
                Approval sent{" "}
                {new Date(registration.approval_email_sent_at).toLocaleString(
                  "en-GB",
                  {
                    dateStyle: "medium",
                    timeStyle: "short",
                  },
                )}
              </span>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
            {registration.status === "waitlisted" && (
              <button
                type="button"
                onClick={promoteFromWaitlist}
                disabled={!!busy}
                className="inline-flex items-center gap-1.5 bg-brand-blue text-white px-3 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50"
              >
                {busy === "promote" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ArrowUpCircle className="h-3.5 w-3.5" />
                )}
                Promote (offer a place)
              </button>
            )}
            {registration.status === "pending" && (
              <>
                <button
                  type="button"
                  onClick={() => setDecision("approve")}
                  disabled={!!busy}
                  className="inline-flex items-center gap-1.5 bg-brand-green text-white px-3 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50"
                >
                  {busy === "approve" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => setDecision("decline")}
                  disabled={!!busy}
                  className="inline-flex items-center gap-1.5 bg-white text-red-700 border border-red-200 px-3 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-red-50 disabled:opacity-50"
                >
                  {busy === "decline" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                  Decline
                </button>
              </>
            )}
            {registration.status === "approved" && (
              <button
                type="button"
                onClick={resendApproval}
                disabled={!!busy}
                className="inline-flex items-center gap-1.5 bg-brand-blue text-white px-3 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50"
              >
                {busy === "email" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {registration.approval_email_sent_at
                  ? "Resend approval email"
                  : "Send approval email"}
              </button>
            )}
            {(registration.status === "declined" ||
              registration.status === "approved") && (
              <button
                type="button"
                onClick={() => setDecision("approve")}
                disabled={!!busy || registration.status === "approved"}
                className="inline-flex items-center gap-1.5 bg-white text-gray-700 border border-gray-200 px-3 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-gray-50 disabled:opacity-30"
              >
                Mark approved
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
