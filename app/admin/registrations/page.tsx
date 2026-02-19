import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/admin/StatCard";
import { RegistrationsView } from "@/components/admin/RegistrationsView";
import type { Event, Registration, RegistrationChild } from "@/lib/supabase/types";

type RegistrationWithDetails = Registration & {
  registration_children: RegistrationChild[];
  events: Event;
};

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading font-black text-xl lg:text-2xl text-gray-900">
          All Registrations
        </h1>
        <p className="text-gray-600 text-sm lg:text-base mt-1">
          View registrations across all events
        </p>
      </div>

      {/* Stats - 2x2 grid on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          title="Total"
          value={totalRegistrations}
          icon="Users"
          iconColor="text-gray-600"
          iconBgColor="bg-gray-100"
        />
        <StatCard
          title="Confirmed"
          value={confirmedCount}
          icon="CheckCircle"
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <StatCard
          title="Waitlisted"
          value={waitlistedCount}
          icon="Clock"
          iconColor="text-yellow-600"
          iconBgColor="bg-yellow-100"
        />
        <StatCard
          title="Attended"
          value={attendedCount}
          icon="UserCheck"
          iconColor="text-brand-blue"
          iconBgColor="bg-brand-blue/10"
        />
      </div>

      {/* Registrations List/Table */}
      <RegistrationsView registrations={registrations} />
    </div>
  );
}
