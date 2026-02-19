"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { ViewToggle } from "@/components/admin/ViewToggle";
import type { Registration, RegistrationChild } from "@/lib/supabase/types";
import { Search, Check, X, Clock, Users, Mail, Phone, ChevronDown, ChevronUp } from "lucide-react";

type RegistrationWithChildren = Registration & {
  registration_children: RegistrationChild[];
};

function formatCancellationReason(reason: string): string {
  const reasonMap: Record<string, string> = {
    schedule_conflict: "Schedule conflict",
    illness: "Illness",
    travel: "Travel/transport issues",
    changed_mind: "Changed mind",
    other: "Other",
  };
  return reasonMap[reason] || reason;
}

interface RegistrationsTableProps {
  registrations: RegistrationWithChildren[];
  eventId: string;
}

function RegistrationMobileCard({
  reg,
  onPromote,
  onCancel,
}: {
  reg: RegistrationWithChildren;
  onPromote?: () => void;
  onCancel?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            <Check className="w-3 h-3" />
            Confirmed
          </span>
        );
      case "waitlisted":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
            <Clock className="w-3 h-3" />
            Waitlist
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
            <X className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">{reg.parent_name}</p>
          <div className="flex items-center gap-2 mt-1">
            {getStatusBadge(reg.status)}
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Users className="w-3 h-3" />
              {reg.registration_children?.length || 0} children
            </span>
          </div>
        </div>
      </div>

      {/* Children names with ages */}
      <div className="mt-3 text-sm text-gray-600">
        {reg.registration_children?.map((c) => `${c.child_name} (${c.child_age}yr)`).join(", ")}
      </div>

      {/* Expandable details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-sm text-brand-blue font-medium mt-3 w-full justify-center py-2"
      >
        {expanded ? (
          <>
            <ChevronUp className="w-4 h-4" />
            Less details
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4" />
            More details
          </>
        )}
      </button>

      {expanded && (
        <div className="mt-2 pt-3 border-t border-gray-100 space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="w-4 h-4 flex-shrink-0" />
            <a href={`mailto:${reg.parent_email}`} className="text-brand-blue truncate">
              {reg.parent_email}
            </a>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="w-4 h-4 flex-shrink-0" />
            <a href={`tel:${reg.parent_phone}`} className="text-brand-blue">
              {reg.parent_phone}
            </a>
          </div>
          {reg.status === "cancelled" && reg.cancellation_reason && (
            <p className="text-gray-500 italic text-xs">
              Reason: {formatCancellationReason(reg.cancellation_reason)}
            </p>
          )}
          <p className="text-xs text-gray-400">
            Registered: {new Date(reg.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      )}

      {/* Actions */}
      {(reg.status === "waitlisted" || reg.status === "confirmed") && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
          {reg.status === "waitlisted" && onPromote && (
            <Button size="sm" variant="outline" onClick={onPromote} className="flex-1">
              Promote
            </Button>
          )}
          {reg.status === "confirmed" && onCancel && (
            <Button
              size="sm"
              variant="outline"
              onClick={onCancel}
              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Cancel
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function RegistrationsTable({ registrations, eventId }: RegistrationsTableProps) {
  const router = useRouter();
  const supabase = createClient();
  const isMobile = useIsMobile();
  const [view, setView] = useState<"cards" | "table">(isMobile ? "cards" : "table");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "confirmed" | "waitlisted" | "cancelled">("all");

  const filteredRegistrations = registrations.filter((reg) => {
    const matchesSearch =
      reg.parent_name.toLowerCase().includes(search.toLowerCase()) ||
      reg.parent_email.toLowerCase().includes(search.toLowerCase()) ||
      reg.registration_children?.some((child) =>
        child.child_name.toLowerCase().includes(search.toLowerCase())
      );

    const matchesFilter = filter === "all" || reg.status === filter;

    return matchesSearch && matchesFilter;
  });

  const handleStatusChange = async (registrationId: string, newStatus: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("registrations")
      .update({ status: newStatus })
      .eq("id", registrationId);

    if (!error) {
      router.refresh();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            <Check className="w-3 h-3" />
            Confirmed
          </span>
        );
      case "waitlisted":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
            <Clock className="w-3 h-3" />
            Waitlist
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
            <X className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const getAttendanceBadge = (reg: RegistrationWithChildren) => {
    if (reg.attended === "yes") {
      return <span className="text-xs text-green-600 font-medium">Attended</span>;
    }
    if (reg.attended === "no") {
      return <span className="text-xs text-red-600 font-medium">No Show</span>;
    }
    if (reg.status === "confirmed") {
      if (reg.attendance_confirmed) {
        return (
          <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
            <Check className="w-3 h-3" />
            Confirmed
          </span>
        );
      }
      return <span className="text-xs text-gray-400">Not confirmed</span>;
    }
    return <span className="text-xs text-gray-400">-</span>;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(["all", "confirmed", "waitlisted", "cancelled"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  filter === status
                    ? "bg-brand-blue text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex justify-end">
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {/* Card View */}
      {view === "cards" && (
        <div className="space-y-3">
          {filteredRegistrations.length > 0 ? (
            filteredRegistrations.map((reg) => (
              <RegistrationMobileCard
                key={reg.id}
                reg={reg}
                onPromote={
                  reg.status === "waitlisted"
                    ? () => handleStatusChange(reg.id, "confirmed")
                    : undefined
                }
                onCancel={
                  reg.status === "confirmed"
                    ? () => handleStatusChange(reg.id, "cancelled")
                    : undefined
                }
              />
            ))
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-500">No registrations found</p>
            </div>
          )}
        </div>
      )}

      {/* Table View */}
      {view === "table" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parent/Guardian
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Children
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRegistrations.length > 0 ? (
                  filteredRegistrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-gray-50">
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{reg.parent_name}</div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="space-y-1">
                          {reg.registration_children?.map((child) => (
                            <div key={child.id} className="text-sm text-gray-600">
                              {child.child_name} ({child.child_age}y)
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="text-sm text-gray-900 truncate max-w-[120px]">{reg.parent_email}</div>
                        <div className="text-sm text-gray-500">{reg.parent_phone}</div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(reg.status)}
                          {reg.status === "cancelled" && reg.cancellation_reason && (
                            <span className="text-xs text-gray-500 italic">
                              {formatCancellationReason(reg.cancellation_reason)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">{getAttendanceBadge(reg)}</td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(reg.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {reg.status === "waitlisted" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(reg.id, "confirmed")}
                            >
                              Promote
                            </Button>
                          )}
                          {reg.status === "confirmed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(reg.id, "cancelled")}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No registrations found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
