import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RegistrationsTable } from "@/components/admin/RegistrationsTable";
import { RegistrationActions } from "@/components/admin/RegistrationActions";
import type { Event, Registration, RegistrationChild, RegistrationAttendee } from "@/lib/supabase/types";
import { slotsForRegistration } from "@/lib/events";
import { ArrowLeft } from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
};

type RegistrationWithDetails = Registration & {
  registration_children: RegistrationChild[];
  registration_attendees: RegistrationAttendee[];
};

export default async function EventRegistrationsPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Get event
  const { data: eventData } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  const event = eventData as Event | null;

  if (!event) {
    notFound();
  }

  // Get registrations with children and attendees
  const { data: registrationsData } = await supabase
    .from("registrations")
    .select(`
      *,
      registration_children (*),
      registration_attendees (*)
    `)
    .eq("event_id", id)
    .order("created_at", { ascending: false });

  const registrations = (registrationsData as RegistrationWithDetails[] | null) || [];

  // Count stats
  const confirmed = registrations.filter((r) => r.status === "confirmed").length;
  const waitlisted = registrations.filter((r) => r.status === "waitlisted").length;
  const cancelled = registrations.filter((r) => r.status === "cancelled").length;
  const attended = registrations.filter((r) => r.attended === "yes").length;

  // People counts (slots used), accounting for the lead booker on mixed/adults events
  const confirmedSlots = registrations
    .filter((r) => r.status === "confirmed")
    .reduce((sum, r) => sum + slotsForRegistration(r, event.event_type), 0);
  const waitlistedSlots = registrations
    .filter((r) => r.status === "waitlisted")
    .reduce((sum, r) => sum + slotsForRegistration(r, event.event_type), 0);
  const totalChildren = registrations
    .filter((r) => r.status === "confirmed")
    .reduce((sum, r) => sum + (r.registration_children?.length || 0), 0);
  const totalAttendees = registrations
    .filter((r) => r.status === "confirmed")
    .reduce((sum, r) => sum + (r.registration_attendees?.length || 0), 0);

  // Determine if this is an adults/mixed event
  const isAdultsEvent = event.event_type === "adults" || event.event_type === "mixed";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="font-heading font-black text-xl lg:text-2xl text-gray-900">
              Registrations
            </h1>
            <p className="text-gray-600 mt-1">{event.title}</p>
            <p className="text-sm text-gray-500">
              {new Date(event.date).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <RegistrationActions
            eventId={id}
            eventTitle={event.title}
            confirmedCount={confirmed}
            waitlistedCount={waitlisted}
          />
        </div>
      </div>

      {/* Stats - 2x3 grid on mobile, 5 cols on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-3 lg:p-4">
          <p className="text-xs lg:text-sm text-gray-500">Confirmed</p>
          <p className="text-xl lg:text-2xl font-bold text-green-600">
            {confirmedSlots}/{event.total_slots}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{confirmed} bookings</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 lg:p-4">
          <p className="text-xs lg:text-sm text-gray-500">Waitlist</p>
          <p className="text-xl lg:text-2xl font-bold text-yellow-600">
            {waitlistedSlots}/{event.waitlist_slots}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{waitlisted} bookings</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 lg:p-4">
          <p className="text-xs lg:text-sm text-gray-500">Cancelled</p>
          <p className="text-xl lg:text-2xl font-bold text-gray-600">{cancelled}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 lg:p-4">
          <p className="text-xs lg:text-sm text-gray-500">Attended</p>
          <p className="text-xl lg:text-2xl font-bold text-brand-blue">{attended}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 lg:p-4 col-span-2 lg:col-span-1">
          <p className="text-xs lg:text-sm text-gray-500">
            {isAdultsEvent ? "Total Attendees" : "Total Children"}
          </p>
          <p className="text-xl lg:text-2xl font-bold text-purple-600">
            {isAdultsEvent ? totalAttendees : totalChildren}
          </p>
        </div>
      </div>

      {/* Registrations Table */}
      <RegistrationsTable registrations={registrations} eventId={id} eventType={event.event_type || "children"} />
    </div>
  );
}
