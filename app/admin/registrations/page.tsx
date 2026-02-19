import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Users, Calendar, Search, Check, Clock, X } from "lucide-react";
import type { Event, Registration, RegistrationChild } from "@/lib/supabase/types";

type RegistrationWithDetails = Registration & {
  registration_children: RegistrationChild[];
  events: Event;
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

export default async function RegistrationsPage() {
  const supabase = await createClient();

  // Get all registrations with event details
  const { data: registrationsData } = await supabase
    .from("registrations")
    .select(`
      *,
      registration_children (*),
      events (*)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  const registrations = (registrationsData as RegistrationWithDetails[] | null) || [];

  // Calculate stats
  const totalRegistrations = registrations.length;
  const confirmedCount = registrations.filter((r) => r.status === "confirmed").length;
  const waitlistedCount = registrations.filter((r) => r.status === "waitlisted").length;
  const attendedCount = registrations.filter((r) => r.attended === "yes").length;

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading font-black text-2xl md:text-3xl text-gray-900">
          All Registrations
        </h1>
        <p className="text-gray-600 mt-1">View registrations across all events</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{totalRegistrations}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Confirmed</p>
          <p className="text-2xl font-bold text-green-600">{confirmedCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Waitlisted</p>
          <p className="text-2xl font-bold text-yellow-600">{waitlistedCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Attended</p>
          <p className="text-2xl font-bold text-brand-blue">{attendedCount}</p>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parent/Guardian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Children
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registered
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {registrations.length > 0 ? (
                registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{reg.parent_name}</div>
                      <div className="text-sm text-gray-500">{reg.parent_email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/events/${reg.event_id}/registrations`}
                        className="text-brand-blue hover:underline font-medium"
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
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        {reg.registration_children?.length || 0}
                      </div>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(reg.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="font-medium text-gray-900 mb-1">No registrations yet</p>
                    <p className="text-sm">
                      Registrations will appear here when people sign up for events
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
