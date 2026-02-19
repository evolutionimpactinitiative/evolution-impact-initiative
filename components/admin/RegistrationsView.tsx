"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Check, Clock, X } from "lucide-react";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { ViewToggle } from "@/components/admin/ViewToggle";
import { RegistrationCard } from "@/components/admin/RegistrationCard";
import type { Event, Registration, RegistrationChild } from "@/lib/supabase/types";

type RegistrationWithDetails = Registration & {
  registration_children: RegistrationChild[];
  events: Event;
};

interface RegistrationsViewProps {
  registrations: RegistrationWithDetails[];
}

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

export function RegistrationsView({ registrations }: RegistrationsViewProps) {
  const isMobile = useIsMobile();
  const [view, setView] = useState<"cards" | "table">(isMobile ? "cards" : "table");

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

  if (registrations.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="font-medium text-gray-900 mb-1">No registrations yet</p>
        <p className="text-sm text-gray-500">
          Registrations will appear here when people sign up for events
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex justify-end">
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {/* Card View */}
      {view === "cards" && (
        <div className="space-y-3">
          {registrations.map((reg) => (
            <RegistrationCard
              key={reg.id}
              registration={{
                ...reg,
                events: reg.events
                  ? { title: reg.events.title, date: reg.events.date }
                  : null,
                registration_children: reg.registration_children,
              }}
            />
          ))}
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
                    Event
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Children
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50">
                    <td className="px-4 lg:px-6 py-4">
                      <div className="font-medium text-gray-900 truncate max-w-[150px]">
                        {reg.parent_name}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-[150px]">
                        {reg.parent_email}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <Link
                        href={`/admin/events/${reg.event_id}/registrations`}
                        className="text-brand-blue hover:underline font-medium truncate block max-w-[150px]"
                      >
                        {reg.events?.title || "Unknown Event"}
                      </Link>
                      <div className="text-sm text-gray-500">
                        {reg.events?.date &&
                          new Date(reg.events.date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        {reg.registration_children?.length || 0}
                      </div>
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
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-500">
                      {new Date(reg.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
