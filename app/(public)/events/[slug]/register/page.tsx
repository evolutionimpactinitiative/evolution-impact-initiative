import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RegistrationForm } from "@/components/registration/RegistrationForm";
import type { Event } from "@/lib/supabase/types";
import { ArrowLeft, Calendar, MapPin, Clock, AlertCircle, CheckCircle } from "lucide-react";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function RegisterPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  // Get event by slug
  const { data: eventData } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  const event = eventData as Event | null;

  if (!event) {
    notFound();
  }

  // Check if event date has passed
  const eventDate = new Date(event.date);
  const now = new Date();
  const isPast = eventDate < now;

  if (isPast) {
    redirect(`/events/${slug}`);
  }

  // Get current registration counts
  const { data: registrationsData } = await supabase
    .from("registrations")
    .select("status")
    .eq("event_id", event.id);

  type RegStatus = { status: string };
  const registrations = (registrationsData as RegStatus[] | null) || [];
  const confirmedCount = registrations.filter((r) => r.status === "confirmed").length;
  const waitlistedCount = registrations.filter((r) => r.status === "waitlisted").length;

  const spotsRemaining = event.total_slots - confirmedCount;
  const waitlistRemaining = event.waitlist_slots - waitlistedCount;

  // Determine registration status
  const isRegistrationOpen =
    event.registration_status === "open" ||
    (event.registration_status === "auto" && (spotsRemaining > 0 || waitlistRemaining > 0));

  const willBeWaitlisted = spotsRemaining <= 0 && waitlistRemaining > 0;
  const isFull = spotsRemaining <= 0 && waitlistRemaining <= 0;

  return (
    <main className="min-h-screen bg-brand-pale pt-24 pb-16">
      {/* Back navigation */}
      <div className="container mx-auto px-4 py-6">
        <Link
          href={`/events/${slug}`}
          className="inline-flex items-center gap-2 text-brand-blue hover:text-brand-dark transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Event
        </Link>
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Event summary card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h1 className="font-heading font-black text-2xl md:text-3xl text-brand-dark mb-2">
              Register for Event
            </h1>
            <h2 className="font-heading font-bold text-xl text-brand-blue mb-4">{event.title}</h2>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-blue" />
                {new Date(event.date).toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-blue" />
                {event.start_time}
                {event.end_time && ` - ${event.end_time}`}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-blue" />
                {event.venue_name}
              </div>
            </div>

            {/* Availability status */}
            {!isFull && !willBeWaitlisted && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">{spotsRemaining} spots available</span>
              </div>
            )}
            {willBeWaitlisted && (
              <div className="flex items-center gap-2 text-yellow-700 bg-yellow-50 px-4 py-2 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">
                  Event is full - {waitlistRemaining} waitlist spots available
                </span>
              </div>
            )}
            {isFull && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">This event is fully booked</span>
              </div>
            )}
          </div>

          {/* Registration form or closed message */}
          {isRegistrationOpen && !isFull ? (
            <RegistrationForm
              event={event}
              willBeWaitlisted={willBeWaitlisted}
              maxChildren={event.max_children_per_registration}
              maxAttendees={event.max_attendees_per_registration}
            />
          ) : event.registration_status === "closed" ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-heading font-bold text-xl text-gray-900 mb-2">
                Registration Closed
              </h3>
              <p className="text-gray-600 mb-6">
                Registration for this event has been closed by the organizers.
              </p>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 text-brand-blue hover:text-brand-dark font-medium"
              >
                View other events
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-heading font-bold text-xl text-gray-900 mb-2">Event Full</h3>
              <p className="text-gray-600 mb-6">
                Unfortunately, this event is fully booked including the waitlist.
              </p>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 text-brand-blue hover:text-brand-dark font-medium"
              >
                View other events
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
