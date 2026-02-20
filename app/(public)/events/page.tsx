import type { Metadata } from "next";
import { PageHero } from "@/components/shared/PageHero";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { EventCard } from "@/components/shared/EventCard";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Event } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Events | Evolution Impact Initiative CIC",
  description:
    "Upcoming and previous community events, workshops and programmes in Medway.",
};

type RegistrationStatus = "open" | "waitlist" | "full" | "closed";

interface EventWithStatus extends Event {
  registrationStatus: RegistrationStatus;
  spotsRemaining: number;
  waitlistRemaining: number;
}

export default async function EventsPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  // Fetch upcoming events (published, date >= today)
  const { data: upcomingData } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .gte("date", today)
    .order("date", { ascending: true });

  const upcomingEventsRaw = (upcomingData as Event[] | null) || [];

  // Fetch past events (published, date < today)
  const { data: pastData } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .lt("date", today)
    .order("date", { ascending: false })
    .limit(12);

  const pastEvents = (pastData as Event[] | null) || [];

  // Fetch registration counts for upcoming events using admin client to bypass RLS
  const adminClient = createAdminClient();
  const eventIds = upcomingEventsRaw.map((e) => e.id);
  const { data: registrationsData } = eventIds.length > 0
    ? await adminClient
        .from("registrations")
        .select("event_id, status")
        .in("event_id", eventIds)
    : { data: [] };

  const registrations = (registrationsData as { event_id: string; status: string }[] | null) || [];

  // Calculate registration counts per event
  const regCountsByEvent = registrations.reduce((acc, reg) => {
    if (!acc[reg.event_id]) {
      acc[reg.event_id] = { confirmed: 0, waitlisted: 0 };
    }
    if (reg.status === "confirmed") acc[reg.event_id].confirmed++;
    if (reg.status === "waitlisted") acc[reg.event_id].waitlisted++;
    return acc;
  }, {} as Record<string, { confirmed: number; waitlisted: number }>);

  // Add registration status to upcoming events
  const upcomingEvents: EventWithStatus[] = upcomingEventsRaw.map((event) => {
    const counts = regCountsByEvent[event.id] || { confirmed: 0, waitlisted: 0 };
    const spotsRemaining = Math.max(0, event.total_slots - counts.confirmed);
    const waitlistRemaining = Math.max(0, event.waitlist_slots - counts.waitlisted);

    let registrationStatus: RegistrationStatus;
    if (event.registration_status === "closed") {
      registrationStatus = "closed";
    } else if (spotsRemaining > 0) {
      registrationStatus = "open";
    } else if (waitlistRemaining > 0) {
      registrationStatus = "waitlist";
    } else {
      registrationStatus = "full";
    }

    return {
      ...event,
      registrationStatus,
      spotsRemaining,
      waitlistRemaining,
    };
  });
  return (
    <>
      <PageHero
        title="Events & Activities"
        subtitle="Join us at our upcoming events or see what we've been up to."
      />

      {/* Upcoming Events */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <SectionLabel text="What's Coming Up" color="brand-green" className="mb-6 mx-auto" />
            <h2 className="font-heading font-black text-3xl md:text-4xl text-brand-dark">
              Upcoming Events
            </h2>
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  title={event.title}
                  date={new Date(event.date).toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  time={event.start_time}
                  location={event.venue_name}
                  description={event.short_description}
                  image={event.card_image_url || "/placeholder-event.jpg"}
                  slug={event.slug}
                  registrationStatus={event.registrationStatus}
                  spotsRemaining={event.spotsRemaining}
                  waitlistRemaining={event.waitlistRemaining}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-brand-pale/30 rounded-lg">
              <p className="text-brand-dark/70 text-lg">
                No upcoming events at the moment. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Past Events */}
      <section className="bg-brand-pale/30 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <SectionLabel text="Looking Back" color="brand-blue" className="mb-6 mx-auto" />
            <h2 className="font-heading font-black text-3xl md:text-4xl text-brand-dark">
              Previous Events
            </h2>
          </div>

          {pastEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pastEvents.map((event) => (
                <EventCard
                  key={event.id}
                  title={event.title}
                  date={new Date(event.date).toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  location={event.venue_name}
                  description={event.short_description}
                  image={event.card_image_url || "/placeholder-event.jpg"}
                  slug={event.slug}
                  isPast
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/50 rounded-lg">
              <p className="text-brand-dark/70 text-lg">
                No past events to show yet.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-dark py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading font-black text-2xl md:text-3xl text-white mb-4">
            Want to stay in the loop?
          </h2>
          <p className="text-white/70 mb-6">
            Follow us on social media for event updates and announcements.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="#"
              className="bg-brand-accent text-brand-dark px-6 py-3 rounded-md font-heading font-bold hover:bg-brand-green hover:text-white transition-colors"
            >
              Follow on Instagram
            </a>
            <a
              href="#"
              className="border-2 border-brand-accent text-brand-accent px-6 py-3 rounded-md font-heading font-bold hover:bg-brand-accent hover:text-brand-dark transition-colors"
            >
              Like on Facebook
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
