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
import {
  confirmSponsor,
  cancelSponsor,
} from "@/app/admin/festival/sponsors/actions";
import { getSponsorTier } from "@/lib/festival";
import type { FestivalSponsor } from "@/lib/supabase/types";

interface Props {
  sponsor: FestivalSponsor;
}

const STATUS_STYLES: Record<FestivalSponsor["status"], string> = {
  pending_payment: "bg-purple-50 text-purple-800 border-purple-200",
  pending_review: "bg-orange-50 text-orange-800 border-orange-200",
  confirmed: "bg-emerald-50 text-emerald-800 border-emerald-200",
  cancelled: "bg-gray-100 text-gray-700 border-gray-200",
  refunded: "bg-gray-100 text-gray-700 border-gray-200",
};

const STATUS_LABELS: Record<FestivalSponsor["status"], string> = {
  pending_payment: "Awaiting payment",
  pending_review: "Pending review",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const PATH_LABELS: Record<FestivalSponsor["path"], string> = {
  premium: "Premium",
  community: "Community",
  activity: "Activity",
  custom: "Custom",
};

export function SponsorAdminRow({ sponsor }: Props) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState<"confirm" | "cancel" | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [showCancelInput, setShowCancelInput] = React.useState(false);
  const [note, setNote] = React.useState("");

  const tierLabel =
    sponsor.path === "custom"
      ? "Custom partnership"
      : getSponsorTier(sponsor.tier_key)?.label ?? sponsor.tier_key;

  const canConfirm =
    sponsor.status === "pending_review" ||
    sponsor.status === "pending_payment";
  const canCancel =
    sponsor.status === "pending_review" ||
    sponsor.status === "pending_payment" ||
    sponsor.status === "confirmed";

  async function onConfirm() {
    setError(null);
    setPending("confirm");
    const res = await confirmSponsor(sponsor.id);
    setPending(null);
    if (!res.ok) setError(res.error);
  }

  async function onCancel() {
    setError(null);
    setPending("cancel");
    const res = await cancelSponsor(sponsor.id, note.trim() || undefined);
    setPending(null);
    setShowCancelInput(false);
    setNote("");
    if (!res.ok) setError(res.error);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left p-4 md:p-5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-heading font-bold text-base text-gray-900 truncate">
                {sponsor.organisation_name}
              </h3>
              <span
                className={`text-[10px] font-heading font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${STATUS_STYLES[sponsor.status]}`}
              >
                {STATUS_LABELS[sponsor.status]}
              </span>
              <span className="text-[10px] font-heading font-bold uppercase tracking-widest text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {PATH_LABELS[sponsor.path]}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {tierLabel} ·{" "}
              {sponsor.amount_pledged === 0
                ? "Amount to discuss"
                : `£${(sponsor.amount_pledged / 100).toFixed(0)}`}{" "}
              · {sponsor.contact_name}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {sponsor.paid_at && (
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

      {open && (
        <div className="border-t border-gray-100 p-4 md:p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <a
              href={`mailto:${sponsor.email}`}
              className="flex items-center gap-2 text-gray-700 hover:text-brand-blue"
            >
              <Mail className="h-4 w-4 text-gray-400" />
              {sponsor.email}
            </a>
            {sponsor.phone && (
              <a
                href={`tel:${sponsor.phone}`}
                className="flex items-center gap-2 text-gray-700 hover:text-brand-blue"
              >
                <Phone className="h-4 w-4 text-gray-400" />
                {sponsor.phone}
              </a>
            )}
            {sponsor.website && (
              <a
                href={sponsor.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-700 hover:text-brand-blue truncate"
              >
                <ExternalLink className="h-4 w-4 text-gray-400" />
                {sponsor.website}
              </a>
            )}
            {sponsor.logo_url && (
              <a
                href={sponsor.logo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-700 hover:text-brand-blue truncate"
              >
                <ExternalLink className="h-4 w-4 text-gray-400" />
                Logo link
              </a>
            )}
          </div>

          {sponsor.display_name &&
            sponsor.display_name !== sponsor.organisation_name && (
              <KeyValue label="Public display name">
                {sponsor.display_name}
              </KeyValue>
            )}

          {sponsor.message && (
            <KeyValue label="Message from sponsor">
              <span className="whitespace-pre-wrap">{sponsor.message}</span>
            </KeyValue>
          )}

          {sponsor.admin_notes && (
            <KeyValue label="Admin notes">
              <span className="whitespace-pre-wrap">{sponsor.admin_notes}</span>
            </KeyValue>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {(canConfirm || canCancel) && (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              {showCancelInput && (
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  placeholder="Internal note for the audit trail…"
                />
              )}
              <div className="flex flex-wrap gap-2">
                {canConfirm && (
                  <button
                    onClick={onConfirm}
                    disabled={!!pending}
                    className="inline-flex items-center gap-1.5 bg-brand-green text-white text-sm font-heading font-bold uppercase tracking-wider px-4 py-2 rounded-md hover:bg-brand-blue transition-colors disabled:opacity-50"
                  >
                    {pending === "confirm" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Confirm partnership
                  </button>
                )}

                {canCancel &&
                  (!showCancelInput ? (
                    <button
                      onClick={() => setShowCancelInput(true)}
                      disabled={!!pending}
                      className="inline-flex items-center gap-1.5 bg-white border-2 border-gray-300 text-gray-700 text-sm font-heading font-bold uppercase tracking-wider px-4 py-2 rounded-md hover:border-red-300 hover:text-red-700 transition-colors disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={onCancel}
                        disabled={!!pending}
                        className="inline-flex items-center gap-1.5 bg-red-600 text-white text-sm font-heading font-bold uppercase tracking-wider px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {pending === "cancel" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                        Confirm cancel {sponsor.paid_at && "& refund"}
                      </button>
                      <button
                        onClick={() => {
                          setShowCancelInput(false);
                          setNote("");
                        }}
                        disabled={!!pending}
                        className="text-sm text-gray-500 hover:text-gray-700 px-3"
                      >
                        Back
                      </button>
                    </>
                  ))}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400 pt-2">
            Submitted {new Date(sponsor.created_at).toLocaleString("en-GB")}
            {sponsor.reviewed_at && (
              <>
                {" · "}
                Reviewed {new Date(sponsor.reviewed_at).toLocaleString("en-GB")}
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
