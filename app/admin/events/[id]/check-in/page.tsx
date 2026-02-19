import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CheckInList } from "@/components/admin/CheckInList";
import type { Event, Registration, RegistrationChild } from "@/lib/supabase/types";
import { ArrowLeft } from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
};

type RegistrationWithChildren = Registration & {
  registration_children: RegistrationChild[];
};

export default async function CheckInPage({ params }: Props) {
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

  // Get confirmed registrations with children
  const { data: registrationsData } = await supabase
    .from("registrations")
    .select(`
      *,
      registration_children (*)
    `)
    .eq("event_id", id)
    .in("status", ["confirmed", "waitlisted"])
    .order("parent_name", { ascending: true });

  const registrations = (registrationsData as RegistrationWithChildren[] | null) || [];

  // Count children, not registrations
  const allChildren = registrations.flatMap((r) => r.registration_children || []);
  const totalChildren = allChildren.length;
  const checkedInChildren = allChildren.filter((c) => c.attended === true).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/admin/events/${id}/registrations`}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Registrations
        </Link>

        <div className="bg-brand-dark rounded-xl p-6 text-white">
          <h1 className="font-heading font-black text-2xl md:text-3xl">Check-In Mode</h1>
          <p className="text-white/70 mt-1">{event.title}</p>
          <p className="text-white/50 text-sm mt-1">
            {new Date(event.date).toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            at {event.start_time}
          </p>

          <div className="flex items-center gap-8 mt-6">
            <div>
              <p className="text-4xl font-bold text-brand-accent">
                {checkedInChildren}/{totalChildren}
              </p>
              <p className="text-white/50 text-sm">Children Checked In</p>
            </div>
            <div>
              <p className="text-4xl font-bold">
                {totalChildren - checkedInChildren}
              </p>
              <p className="text-white/50 text-sm">Pending</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white/70">
                {registrations.length}
              </p>
              <p className="text-white/50 text-sm">Families</p>
            </div>
          </div>
        </div>
      </div>

      {/* Check-in List */}
      <CheckInList registrations={registrations} eventId={id} />
    </div>
  );
}
