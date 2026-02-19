"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { Registration, RegistrationChild } from "@/lib/supabase/types";
import { Search, MoreHorizontal, Check, X, Clock } from "lucide-react";

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

export function RegistrationsTable({ registrations, eventId }: RegistrationsTableProps) {
  const router = useRouter();
  const supabase = createClient();
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
    // Show confirmation status for upcoming events
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Filters */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            {(["all", "confirmed", "waitlisted", "cancelled"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Parent/Guardian
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Children
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Attendance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registered
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredRegistrations.length > 0 ? (
              filteredRegistrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{reg.parent_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {reg.registration_children?.map((child) => (
                        <div key={child.id} className="text-sm text-gray-600">
                          {child.child_name} ({child.child_age}y)
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{reg.parent_email}</div>
                    <div className="text-sm text-gray-500">{reg.parent_phone}</div>
                  </td>
                  <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(reg.status)}
                        {reg.status === "cancelled" && reg.cancellation_reason && (
                          <span className="text-xs text-gray-500 italic">
                            {formatCancellationReason(reg.cancellation_reason)}
                          </span>
                        )}
                      </div>
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getAttendanceBadge(reg)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(reg.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
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
  );
}
