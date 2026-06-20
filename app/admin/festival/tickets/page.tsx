import { createClient } from "@/lib/supabase/server";
import { RegistrationsTable } from "@/components/admin/RegistrationsTable";
import { RegistrationActions } from "@/components/admin/RegistrationActions";
import { FestivalAdminTabs } from "@/components/admin/festival/FestivalAdminTabs";
import { FESTIVAL_SLUG } from "@/lib/festival";
import type {
  Event,
  Registration,
  RegistrationChild,
  RegistrationAttendee,
} from "@/lib/supabase/types";

type RegistrationWithDetails = Registration & {
  registration_children: RegistrationChild[];
  registration_attendees: RegistrationAttendee[];
};

export const revalidate = 0;

export default async function FestivalTicketsAdminPage() {
  const supabase = await createClient();

  const { data: eventData } = await supabase
    .from("events")
    .select("*")
    .eq("slug", FESTIVAL_SLUG)
    .maybeSingle();

  const event = eventData as Event | null;

  if (!event) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading font-black text-xl text-gray-900">
          Festival Ticket Buyers
        </h1>
        <FestivalAdminTabs />
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">
            The festival event row doesn&rsquo;t exist yet.
          </p>
        </div>
      </div>
    );
  }

  const { data: registrationsData } = await supabase
    .from("registrations")
    .select(
      `*, registration_children (*), registration_attendees (*)`,
    )
    .eq("event_id", event.id)
    .order("created_at", { ascending: false });

  const registrations =
    (registrationsData as RegistrationWithDetails[] | null) || [];

  const confirmed = registrations.filter((r) => r.status === "confirmed").length;
  const waitlisted = registrations.filter((r) => r.status === "waitlisted").length;
  const cancelled = registrations.filter((r) => r.status === "cancelled").length;
  const attended = registrations.filter((r) => r.attended === "yes").length;
  const totalAttendees = registrations
    .filter((r) => r.status === "confirmed")
    .reduce(
      (sum, r) =>
        sum +
        (r.registration_attendees?.length || 0) +
        (r.registration_children?.length || 0),
      0,
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-black text-xl lg:text-2xl text-gray-900">
          Ticket Buyers
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

      <FestivalAdminTabs />

      <div className="flex justify-end">
        <RegistrationActions
          eventId={event.id}
          eventTitle={event.title}
          confirmedCount={confirmed}
          waitlistedCount={waitlisted}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-3 lg:p-4">
          <p className="text-xs lg:text-sm text-gray-500">Confirmed</p>
          <p className="text-xl lg:text-2xl font-bold text-green-600">
            {confirmed}
            {event.total_slots ? `/${event.total_slots}` : ""}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 lg:p-4">
          <p className="text-xs lg:text-sm text-gray-500">Waitlist</p>
          <p className="text-xl lg:text-2xl font-bold text-yellow-600">
            {waitlisted}
            {event.waitlist_slots ? `/${event.waitlist_slots}` : ""}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 lg:p-4">
          <p className="text-xs lg:text-sm text-gray-500">Cancelled</p>
          <p className="text-xl lg:text-2xl font-bold text-gray-600">
            {cancelled}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 lg:p-4">
          <p className="text-xs lg:text-sm text-gray-500">Attended</p>
          <p className="text-xl lg:text-2xl font-bold text-brand-blue">
            {attended}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 lg:p-4 col-span-2 lg:col-span-1">
          <p className="text-xs lg:text-sm text-gray-500">Total Attendees</p>
          <p className="text-xl lg:text-2xl font-bold text-purple-600">
            {totalAttendees}
          </p>
        </div>
      </div>

      <RegistrationsTable
        registrations={registrations}
        eventId={event.id}
        eventType={event.event_type || "mixed"}
      />
    </div>
  );
}
