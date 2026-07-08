"use client";

import * as React from "react";
import {
  Loader2,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  Send,
  X,
  ShirtIcon,
  Heart,
  AlertOctagon,
  ShieldAlert,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import {
  assignVolunteerRole,
  declineVolunteer,
} from "@/app/admin/festival/volunteers/actions";
import { DBS_LEVELS, type FestivalVolunteer } from "@/lib/supabase/types";

function ageFromDob(dob: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function dbsLevelLabel(level: FestivalVolunteer["dbs_level"]): string {
  if (!level) return "—";
  return DBS_LEVELS.find((l) => l.value === level)?.label ?? level;
}

interface Props {
  volunteer: FestivalVolunteer;
}

const STATUS_STYLES: Record<FestivalVolunteer["status"], string> = {
  pending: "bg-orange-50 text-orange-800 border-orange-200",
  approved: "bg-blue-50 text-blue-800 border-blue-200",
  assigned: "bg-emerald-50 text-emerald-800 border-emerald-200",
  declined: "bg-gray-100 text-gray-700 border-gray-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
};

const STATUS_LABELS: Record<FestivalVolunteer["status"], string> = {
  pending: "Pending",
  approved: "Approved",
  assigned: "Assigned",
  declined: "Declined",
  cancelled: "Cancelled",
};

function availabilityShortLabel(
  a: FestivalVolunteer["availability"],
): string {
  if (!a) return "Flexible";
  const parts: string[] = [];
  if (a.setup) parts.push("Setup");
  if (a.am) parts.push("AM");
  if (a.pm) parts.push("PM");
  if (a.packdown) parts.push("Packdown");
  return parts.length === 0 ? "Not specified" : parts.join(" · ");
}

export function VolunteerAdminRow({ volunteer }: Props) {
  const age = ageFromDob(volunteer.date_of_birth);
  const isMinor = age !== null && age < 18;
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState<"assign" | "decline" | null>(
    null,
  );
  const [error, setError] = React.useState<string | null>(null);
  const [showAssign, setShowAssign] = React.useState(false);
  const [showDecline, setShowDecline] = React.useState(false);
  const [role, setRole] = React.useState(volunteer.assigned_role ?? "");
  const [shiftNote, setShiftNote] = React.useState("");
  const [declineNote, setDeclineNote] = React.useState("");

  const canAct =
    volunteer.status === "pending" || volunteer.status === "approved";

  async function onAssign() {
    setError(null);
    setPending("assign");
    const res = await assignVolunteerRole(
      volunteer.id,
      role,
      shiftNote.trim() || undefined,
    );
    setPending(null);
    setShowAssign(false);
    if (!res.ok) setError(res.error);
  }

  async function onDecline() {
    setError(null);
    setPending("decline");
    const res = await declineVolunteer(
      volunteer.id,
      declineNote.trim() || undefined,
    );
    setPending(null);
    setShowDecline(false);
    setDeclineNote("");
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
                {volunteer.full_name}
              </h3>
              <span
                className={`text-[10px] font-heading font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${STATUS_STYLES[volunteer.status]}`}
              >
                {STATUS_LABELS[volunteer.status]}
              </span>
              {isMinor && (
                <span className="text-[10px] font-heading font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border bg-amber-50 text-amber-800 border-amber-200">
                  Under 18 · {age}
                </span>
              )}
              {volunteer.has_dbs && (
                <span className="text-[10px] font-heading font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-200 inline-flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  DBS
                </span>
              )}
              {volunteer.has_safeguarding_training && (
                <span className="text-[10px] font-heading font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border bg-blue-50 text-blue-800 border-blue-200 inline-flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  Safeguarding
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {availabilityShortLabel(volunteer.availability)}
              {age !== null && ` · Age ${age}`}
              {volunteer.t_shirt_size && ` · T-shirt ${volunteer.t_shirt_size}`}
              {volunteer.assigned_role && ` · ${volunteer.assigned_role}`}
            </p>
          </div>

          {open ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 p-4 md:p-5 space-y-4">
          {/* Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <a
              href={`mailto:${volunteer.email}`}
              className="flex items-center gap-2 text-gray-700 hover:text-brand-blue"
            >
              <Mail className="h-4 w-4 text-gray-400" />
              {volunteer.email}
            </a>
            <a
              href={`tel:${volunteer.phone}`}
              className="flex items-center gap-2 text-gray-700 hover:text-brand-blue"
            >
              <Phone className="h-4 w-4 text-gray-400" />
              {volunteer.phone}
            </a>
          </div>

          {/* Detail grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <KeyValue label="Date of birth">
              {volunteer.date_of_birth
                ? `${new Date(volunteer.date_of_birth).toLocaleDateString("en-GB")}${age !== null ? ` (${age})` : ""}`
                : "—"}
            </KeyValue>
            <KeyValue label="T-shirt">
              {volunteer.t_shirt_size ? (
                <span className="inline-flex items-center gap-1">
                  <ShirtIcon className="h-3 w-3" />
                  {volunteer.t_shirt_size}
                </span>
              ) : (
                "—"
              )}
            </KeyValue>
            <KeyValue label="Dietary">
              {volunteer.dietary_requirements || "—"}
            </KeyValue>
            <KeyValue label="Accessibility">
              {volunteer.accessibility_needs || "—"}
            </KeyValue>
          </div>

          {/* Safeguarding & DBS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <KeyValue label="DBS check">
              {volunteer.has_dbs === true ? (
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  {dbsLevelLabel(volunteer.dbs_level)}
                </span>
              ) : volunteer.has_dbs === false ? (
                "No"
              ) : (
                "Not answered"
              )}
            </KeyValue>
            <KeyValue label="Safeguarding training">
              {volunteer.has_safeguarding_training === true ? (
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                  {volunteer.safeguarding_training_notes || "Yes"}
                </span>
              ) : volunteer.has_safeguarding_training === false ? (
                "No"
              ) : (
                "Not answered"
              )}
            </KeyValue>
          </div>

          {/* Parental consent (minors only) */}
          {isMinor && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
              <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs w-full">
                <p className="font-heading font-bold uppercase tracking-widest text-amber-800 mb-1">
                  Under 18 · Parental consent
                </p>
                <p className="text-amber-900">
                  <span className="font-bold">
                    {volunteer.parent_guardian_name || "—"}
                  </span>
                  {volunteer.parent_guardian_relationship &&
                    ` (${volunteer.parent_guardian_relationship})`}
                </p>
                <p className="text-amber-900 mt-0.5">
                  {volunteer.parent_guardian_phone && (
                    <a
                      href={`tel:${volunteer.parent_guardian_phone}`}
                      className="underline"
                    >
                      {volunteer.parent_guardian_phone}
                    </a>
                  )}
                  {volunteer.parent_guardian_phone &&
                    volunteer.parent_guardian_email &&
                    " · "}
                  {volunteer.parent_guardian_email && (
                    <a
                      href={`mailto:${volunteer.parent_guardian_email}`}
                      className="underline"
                    >
                      {volunteer.parent_guardian_email}
                    </a>
                  )}
                </p>
                <p className="text-amber-900 mt-1">
                  Consent confirmed:{" "}
                  <span className="font-bold">
                    {volunteer.parental_consent_confirmed ? "Yes ✓" : "No"}
                  </span>
                </p>
              </div>
            </div>
          )}

          {volunteer.skills && (
            <KeyValue label="Skills / interests">
              <span className="whitespace-pre-wrap">{volunteer.skills}</span>
            </KeyValue>
          )}
          {volunteer.prior_experience && (
            <KeyValue label="Prior experience">
              <span className="whitespace-pre-wrap">
                {volunteer.prior_experience}
              </span>
            </KeyValue>
          )}

          {/* Emergency */}
          <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-3">
            <AlertOctagon className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-heading font-bold uppercase tracking-widest text-red-700 mb-1">
                Emergency contact
              </p>
              <p className="text-red-900">
                {volunteer.emergency_contact_name} ·{" "}
                <a
                  href={`tel:${volunteer.emergency_contact_phone}`}
                  className="underline"
                >
                  {volunteer.emergency_contact_phone}
                </a>
              </p>
            </div>
          </div>

          {volunteer.admin_notes && (
            <KeyValue label="Admin notes">
              <span className="whitespace-pre-wrap">
                {volunteer.admin_notes}
              </span>
            </KeyValue>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Actions */}
          {canAct && (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              {showAssign && (
                <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Kids' zone steward, Setup crew, Photographer"
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                  <textarea
                    value={shiftNote}
                    onChange={(e) => setShiftNote(e.target.value)}
                    rows={2}
                    placeholder="Optional note about shift / arrival / things to bring…"
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              )}

              {showDecline && (
                <textarea
                  value={declineNote}
                  onChange={(e) => setDeclineNote(e.target.value)}
                  rows={2}
                  placeholder="Internal note (won't be sent to volunteer)…"
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              )}

              <div className="flex flex-wrap gap-2">
                {!showAssign && !showDecline && (
                  <>
                    <button
                      onClick={() => {
                        setShowAssign(true);
                        setShowDecline(false);
                      }}
                      disabled={!!pending}
                      className="inline-flex items-center gap-1.5 bg-brand-green text-white text-sm font-heading font-bold uppercase tracking-wider px-4 py-2 rounded-md hover:bg-brand-blue transition-colors disabled:opacity-50"
                    >
                      <Heart className="h-4 w-4" />
                      Assign role
                    </button>
                    <button
                      onClick={() => {
                        setShowDecline(true);
                        setShowAssign(false);
                      }}
                      disabled={!!pending}
                      className="inline-flex items-center gap-1.5 bg-white border-2 border-gray-300 text-gray-700 text-sm font-heading font-bold uppercase tracking-wider px-4 py-2 rounded-md hover:border-red-300 hover:text-red-700 transition-colors disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                      Decline
                    </button>
                  </>
                )}

                {showAssign && (
                  <>
                    <button
                      onClick={onAssign}
                      disabled={!!pending || !role.trim()}
                      className="inline-flex items-center gap-1.5 bg-brand-green text-white text-sm font-heading font-bold uppercase tracking-wider px-4 py-2 rounded-md hover:bg-brand-blue transition-colors disabled:opacity-50"
                    >
                      {pending === "assign" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Send assignment
                    </button>
                    <button
                      onClick={() => {
                        setShowAssign(false);
                        setShiftNote("");
                      }}
                      disabled={!!pending}
                      className="text-sm text-gray-500 hover:text-gray-700 px-3"
                    >
                      Cancel
                    </button>
                  </>
                )}

                {showDecline && (
                  <>
                    <button
                      onClick={onDecline}
                      disabled={!!pending}
                      className="inline-flex items-center gap-1.5 bg-red-600 text-white text-sm font-heading font-bold uppercase tracking-wider px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {pending === "decline" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      Confirm decline
                    </button>
                    <button
                      onClick={() => {
                        setShowDecline(false);
                        setDeclineNote("");
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
            Submitted {new Date(volunteer.created_at).toLocaleString("en-GB")}
            {volunteer.reviewed_at && (
              <>
                {" · "}
                Reviewed {new Date(volunteer.reviewed_at).toLocaleString("en-GB")}
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
