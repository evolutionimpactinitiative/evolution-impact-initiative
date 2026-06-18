"use client";

import * as React from "react";
import {
  Check,
  X,
  Loader2,
  ExternalLink,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { approveVendor, rejectVendor } from "@/app/admin/festival/vendors/actions";
import { VENDOR_CATEGORIES } from "@/lib/festival";
import type { FestivalVendor } from "@/lib/supabase/types";

interface Props {
  vendor: FestivalVendor;
}

const STATUS_STYLES: Record<FestivalVendor["status"], string> = {
  pending_payment: "bg-purple-50 text-purple-800 border-purple-200",
  pending_review: "bg-orange-50 text-orange-800 border-orange-200",
  approved: "bg-emerald-50 text-emerald-800 border-emerald-200",
  rejected: "bg-gray-100 text-gray-700 border-gray-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
  waitlisted: "bg-blue-50 text-blue-700 border-blue-200",
};

const STATUS_LABELS: Record<FestivalVendor["status"], string> = {
  pending_payment: "Awaiting payment",
  pending_review: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
  waitlisted: "Waitlisted",
};

export function VendorAdminRow({ vendor }: Props) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState<"approve" | "reject" | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [showRejectInput, setShowRejectInput] = React.useState(false);
  const [reason, setReason] = React.useState("");

  const categoryLabel =
    VENDOR_CATEGORIES.find((c) => c.key === vendor.category)?.label ??
    vendor.category;

  const canDecide =
    vendor.status === "pending_review" || vendor.status === "pending_payment";

  async function onApprove() {
    setError(null);
    setPending("approve");
    const res = await approveVendor(vendor.id);
    setPending(null);
    if (!res.ok) setError(res.error);
  }

  async function onReject() {
    setError(null);
    setPending("reject");
    const res = await rejectVendor(vendor.id, reason.trim() || undefined);
    setPending(null);
    setShowRejectInput(false);
    setReason("");
    if (!res.ok) setError(res.error);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Summary row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left p-4 md:p-5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-heading font-bold text-base text-gray-900 truncate">
                {vendor.business_name}
              </h3>
              <span
                className={`text-[10px] font-heading font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${STATUS_STYLES[vendor.status]}`}
              >
                {STATUS_LABELS[vendor.status]}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {categoryLabel} ·{" "}
              {vendor.contribution_amount === 0
                ? "Free"
                : `£${(vendor.contribution_amount / 100).toFixed(0)}`}{" "}
              · {vendor.contact_name}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {vendor.paid_at && (
              <span className="text-[10px] font-heading font-bold uppercase tracking-widest text-emerald-700">
                Paid
              </span>
            )}
            {open ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
      </button>

      {/* Detail */}
      {open && (
        <div className="border-t border-gray-100 p-4 md:p-5 space-y-4">
          {/* Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <a
              href={`mailto:${vendor.email}`}
              className="flex items-center gap-2 text-gray-700 hover:text-brand-blue"
            >
              <Mail className="h-4 w-4 text-gray-400" />
              {vendor.email}
            </a>
            <a
              href={`tel:${vendor.phone}`}
              className="flex items-center gap-2 text-gray-700 hover:text-brand-blue"
            >
              <Phone className="h-4 w-4 text-gray-400" />
              {vendor.phone}
            </a>
            {vendor.website && (
              <a
                href={vendor.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-700 hover:text-brand-blue truncate"
              >
                <ExternalLink className="h-4 w-4 text-gray-400" />
                {vendor.website}
              </a>
            )}
          </div>

          {/* Description */}
          {vendor.description && (
            <KeyValue label="About">{vendor.description}</KeyValue>
          )}
          {vendor.what_selling && (
            <KeyValue label="Selling">{vendor.what_selling}</KeyValue>
          )}

          {/* Logistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <KeyValue label="Gazebo">
              {vendor.gazebo_size || "—"}
            </KeyValue>
            <KeyValue label="Power">
              {vendor.power_needed ? vendor.power_notes || "Yes" : "Not needed"}
            </KeyValue>
            <KeyValue label="PLI">
              {vendor.has_public_liability ? "Yes ✓" : "No"}
            </KeyValue>
            <KeyValue label="Risk assess.">
              {vendor.has_risk_assessment ? "Yes ✓" : "No"}
            </KeyValue>
            {vendor.category === "food" && (
              <KeyValue label="Food Hygiene">
                {vendor.has_food_hygiene_rating
                  ? vendor.food_hygiene_score !== null
                    ? `Score ${vendor.food_hygiene_score}`
                    : "Yes"
                  : "No"}
              </KeyValue>
            )}
          </div>

          {vendor.admin_notes && (
            <KeyValue label="Admin notes">
              <span className="whitespace-pre-wrap">{vendor.admin_notes}</span>
            </KeyValue>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Actions */}
          {canDecide && (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              {showRejectInput && (
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  placeholder="Optional note for the applicant (will be included in the email)…"
                />
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={onApprove}
                  disabled={!!pending}
                  className="inline-flex items-center gap-1.5 bg-brand-green text-white text-sm font-heading font-bold uppercase tracking-wider px-4 py-2 rounded-md hover:bg-brand-blue transition-colors disabled:opacity-50"
                >
                  {pending === "approve" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Approve
                </button>

                {!showRejectInput ? (
                  <button
                    onClick={() => setShowRejectInput(true)}
                    disabled={!!pending}
                    className="inline-flex items-center gap-1.5 bg-white border-2 border-gray-300 text-gray-700 text-sm font-heading font-bold uppercase tracking-wider px-4 py-2 rounded-md hover:border-red-300 hover:text-red-700 transition-colors disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </button>
                ) : (
                  <>
                    <button
                      onClick={onReject}
                      disabled={!!pending}
                      className="inline-flex items-center gap-1.5 bg-red-600 text-white text-sm font-heading font-bold uppercase tracking-wider px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {pending === "reject" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      Confirm reject {vendor.paid_at && "& refund"}
                    </button>
                    <button
                      onClick={() => {
                        setShowRejectInput(false);
                        setReason("");
                      }}
                      disabled={!!pending}
                      className="text-sm text-gray-500 hover:text-gray-700 px-3"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400 pt-2">
            Submitted {new Date(vendor.created_at).toLocaleString("en-GB")}
            {vendor.reviewed_at && (
              <>
                {" · "}
                Reviewed {new Date(vendor.reviewed_at).toLocaleString("en-GB")}
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

function KeyValue({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-gray-400 mb-1">
        {label}
      </p>
      <p className="text-sm text-gray-800 leading-relaxed">{children}</p>
    </div>
  );
}
