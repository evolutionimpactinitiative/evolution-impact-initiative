import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Event, Registration, RegistrationChild, RegistrationAttendee } from "@/lib/supabase/types";
import { CheckCircle, Clock, Calendar, MapPin, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

// Helper to format time (remove seconds if present)
function formatTime(time: string | null | undefined): string {
  if (!time) return "";
  return time.replace(/^(\d{2}:\d{2}):\d{2}$/, "$1");
}

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string; id?: string }>;
};

type RegistrationWithDetails = Registration & {
  registration_children: RegistrationChild[];
  registration_attendees: RegistrationAttendee[];
};

export default async function ConfirmationPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { status, id } = await searchParams;

  if (!id) {
    notFound();
  }

  const supabase = await createClient();

  // Get event
  const { data: eventData } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .single();

  const event = eventData as Event | null;

  if (!event) {
    notFound();
  }

  // Get registration with children and attendees
  const { data: registrationData } = await supabase
    .from("registrations")
    .select(`
      *,
      registration_children (*),
      registration_attendees (*)
    `)
    .eq("id", id)
    .single();

  const registration = registrationData as RegistrationWithDetails | null;

  if (!registration) {
    notFound();
  }

  const isWaitlisted = status === "waitlisted" || registration.status === "waitlisted";

  return (
    <main className="min-h-screen bg-brand-pale pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Success message */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center mb-8">
            <div
              className={`w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center ${
                isWaitlisted ? "bg-yellow-100" : "bg-green-100"
              }`}
            >
              {isWaitlisted ? (
                <Clock className="w-8 h-8 text-yellow-600" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-600" />
              )}
            </div>

            <h1 className="font-heading font-black text-3xl text-brand-dark mb-4">
              {isWaitlisted ? "You're on the Waitlist!" : "Registration Confirmed!"}
            </h1>

            <p className="text-gray-600 text-lg mb-6">
              {isWaitlisted
                ? "We've added you to the waitlist. We'll notify you by email if a spot becomes available."
                : "Thank you for registering! A confirmation email has been sent to your email address."}
            </p>

            <div
              className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                isWaitlisted
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {isWaitlisted ? "Waitlisted" : "Confirmed"}
            </div>
          </div>

          {/* Event details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="font-heading font-bold text-xl text-gray-900 mb-4">{event.title}</h2>

            <div className="space-y-3 text-gray-600">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-brand-blue" />
                <span>
                  {new Date(event.date).toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-brand-blue" />
                <span>
                  {formatTime(event.start_time)}
                  {event.end_time && ` - ${formatTime(event.end_time)}`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-brand-blue" />
                <div>
                  <p>{event.venue_name}</p>
                  {event.venue_address && (
                    <p className="text-sm text-gray-500">{event.venue_address}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Registration details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="font-heading font-bold text-lg text-gray-900 mb-4">
              Registration Details
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">
                  {event.event_type === "children" ? "Parent/Guardian" : "Contact Details"}
                </p>
                <p className="font-medium text-gray-900">{registration.parent_name}</p>
                <p className="text-gray-600">{registration.parent_email}</p>
              </div>

              {/* Show children for children events */}
              {event.event_type === "children" && registration.registration_children.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Children Registered</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Users className="w-4 h-4 text-brand-blue" />
                    {registration.registration_children.map((child, i) => (
                      <span key={child.id} className="text-gray-700">
                        {child.child_name} ({child.child_age}y)
                        {i < registration.registration_children.length - 1 && ", "}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Show attendees for adult/mixed events */}
              {event.event_type !== "children" && registration.registration_attendees.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Attendees Registered</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Users className="w-4 h-4 text-brand-blue" />
                    {registration.registration_attendees.map((attendee, i) => (
                      <span key={attendee.id} className="text-gray-700">
                        {attendee.attendee_name}
                        {i < registration.registration_attendees.length - 1 && ", "}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {event.what_to_bring && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">What to Bring</p>
                  <div
                    className="text-gray-700 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: event.what_to_bring }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Next steps */}
          <div className="bg-brand-dark rounded-xl p-6 text-white mb-8">
            <h3 className="font-heading font-bold text-lg mb-4">What Happens Next?</h3>
            <ul className="space-y-3 text-white/80">
              {isWaitlisted ? (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-accent">1.</span>
                    We&apos;ll notify you by email if a spot becomes available
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-accent">2.</span>
                    You&apos;ll have 24 hours to confirm your spot once notified
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-accent">3.</span>
                    Keep an eye on your inbox (and spam folder!)
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-accent">1.</span>
                    Check your email for your confirmation receipt
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-accent">2.</span>
                    You&apos;ll receive a reminder 24 hours before the event
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-accent">3.</span>
                    Arrive 10-15 minutes early for check-in
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="outline">
              <Link href="/events">View More Events</Link>
            </Button>
            <Button asChild>
              <Link href="/" className="flex items-center gap-2">
                Back to Home
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
