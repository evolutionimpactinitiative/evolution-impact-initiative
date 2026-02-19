import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RegistrationsTable } from "@/components/admin/RegistrationsTable";
import { RegistrationActions } from "@/components/admin/RegistrationActions";
import type { Event, Registration, RegistrationChild } from "@/lib/supabase/types";
import { ArrowLeft } from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
};

type RegistrationWithChildren = Registration & {
  registration_children: RegistrationChild[];
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

  // Get registrations with children
  const { data: registrationsData } = await supabase
    .from("registrations")
    .select(`
      *,
      registration_children (*)
    `)
    .eq("event_id", id)
    .order("created_at", { ascending: false });

  const registrations = (registrationsData as RegistrationWithChildren[] | null) || [];

  // Count stats
  const confirmed = registrations.filter((r) => r.status === "confirmed").length;
  const waitlisted = registrations.filter((r) => r.status === "waitlisted").length;
  const cancelled = registrations.filter((r) => r.status === "cancelled").length;
  const attended = registrations.filter((r) => r.attended === "yes").length;
  const totalChildren = registrations
    .filter((r) => r.status === "confirmed")
    .reduce((sum, r) => sum + (r.registration_children?.length || 0), 0);

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
            {confirmed}/{event.total_slots}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 lg:p-4">
          <p className="text-xs lg:text-sm text-gray-500">Waitlist</p>
          <p className="text-xl lg:text-2xl font-bold text-yellow-600">
            {waitlisted}/{event.waitlist_slots}
          </p>
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
          <p className="text-xs lg:text-sm text-gray-500">Total Children</p>
          <p className="text-xl lg:text-2xl font-bold text-purple-600">{totalChildren}</p>
        </div>
      </div>

      {/* Registrations Table */}
      <RegistrationsTable registrations={registrations} eventId={id} />
    </div>
  );
}
