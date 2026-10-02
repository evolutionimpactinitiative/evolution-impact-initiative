import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/shared/PageHero";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { EventCard } from "@/components/shared/EventCard";
// B2S 2026 promo banner archived — re-import for the 2027 drive:
// import { B2SPromoBanner } from "@/components/back-to-school/B2SPromoBanner";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Event } from "@/lib/supabase/types";
import { slotsForRegistration } from "@/lib/events";

const PAST_EVENTS_PER_PAGE = 10;

// Helper to format time (remove seconds if present)
function formatTime(time: string | null | undefined): string {
  if (!time) return "";
  return time.replace(/^(\d{2}:\d{2}):\d{2}$/, "$1");
}

export const metadata: Metadata = {
  title: "Events | Evolution Impact Initiative CIC",
  description:
    "Upcoming and previous community events, workshops and programmes in Medway.",
};

type RegistrationStatus = "open" | "waitlist" | "full" | "closed" | "scheduled";

interface EventWithStatus extends Event {
  registrationStatus: RegistrationStatus;
  spotsRemaining: number;
  waitlistRemaining: number;
}

type EventsPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function EventsPage({ searchParams }: EventsPageProps) {
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

  // Past events — paginated
  const { page: pageParam } = await searchParams;
  const parsedPage = Number.parseInt(pageParam ?? "1", 10);
  const requestedPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const from = (requestedPage - 1) * PAST_EVENTS_PER_PAGE;
  const to = from + PAST_EVENTS_PER_PAGE - 1;

  const { data: pastData, count: pastCountRaw } = await supabase
    .from("events")
    .select("*", { count: "exact" })
    .eq("status", "published")
    .lt("date", today)
    .order("date", { ascending: false })
    .range(from, to);

  const pastEvents = (pastData as Event[] | null) || [];
  const pastEventsTotal = pastCountRaw ?? 0;
  const totalPages = Math.max(1, Math.ceil(pastEventsTotal / PAST_EVENTS_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);

  // Fetch registration counts for upcoming events using admin client to bypass RLS
  const adminClient = createAdminClient();
  const eventIds = upcomingEventsRaw.map((e) => e.id);
  const { data: registrationsData } = eventIds.length > 0
    ? await adminClient
        .from("registrations")
        .select(`
          event_id,
          status,
          registration_children (id),
          registration_attendees (id)
        `)
        .in("event_id", eventIds)
    : { data: [] };

  type RegWithCounts = {
    event_id: string;
    status: string;
    registration_children: { id: string }[];
    registration_attendees: { id: string }[];
  };
  const registrations = (registrationsData as RegWithCounts[] | null) || [];

  // Create a map of event_id -> event_type for slot calculation
  const eventTypeMap = upcomingEventsRaw.reduce((acc, e) => {
    acc[e.id] = e.event_type || "children";
    return acc;
  }, {} as Record<string, string>);

  // Calculate registration counts per event based on actual attendees/children
  const regCountsByEvent = registrations.reduce((acc, reg) => {
    if (!acc[reg.event_id]) {
      acc[reg.event_id] = { confirmed: 0, waitlisted: 0 };
    }

    const slotsForReg = slotsForRegistration(reg, eventTypeMap[reg.event_id]);

    if (reg.status === "confirmed") acc[reg.event_id].confirmed += slotsForReg;
    if (reg.status === "waitlisted") acc[reg.event_id].waitlisted += slotsForReg;
    return acc;
  }, {} as Record<string, { confirmed: number; waitlisted: number }>);

  // Add registration status to upcoming events
  const now = new Date();
  const upcomingEvents: EventWithStatus[] = upcomingEventsRaw.map((event) => {
    const counts = regCountsByEvent[event.id] || { confirmed: 0, waitlisted: 0 };
    const spotsRemaining = Math.max(0, event.total_slots - counts.confirmed);
    const waitlistRemaining = Math.max(0, event.waitlist_slots - counts.waitlisted);

    let registrationStatus: RegistrationStatus;

    // Check if event has a scheduled publish date in the future
    if (event.publish_at && new Date(event.publish_at) > now) {
      registrationStatus = "scheduled";
    } else if (event.registration_status === "closed") {
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

      {/* B2S 2026 featured-campaign banner archived — restore for the
          2027 drive when registration reopens. */}

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
                  time={formatTime(event.start_time)}
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
      <section id="past-events" className="bg-brand-pale/30 py-16 md:py-24 scroll-mt-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <SectionLabel text="Looking Back" color="brand-blue" className="mb-6 mx-auto" />
            <h2 className="font-heading font-black text-3xl md:text-4xl text-brand-dark">
              Previous Events
            </h2>
            {pastEventsTotal > 0 && (
              <p className="mt-4 text-brand-dark/70">
                {pastEventsTotal === 1
                  ? "1 event in our archive"
                  : `${pastEventsTotal} events in our archive`}
                {totalPages > 1 && (
                  <>
                    {" · "}
                    <span>
                      Page {currentPage} of {totalPages}
                    </span>
                  </>
                )}
              </p>
            )}
          </div>

          {pastEvents.length > 0 ? (
            <>
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

              {totalPages > 1 && (
                <nav
                  aria-label="Previous events pagination"
                  className="mt-12 flex flex-wrap items-center justify-center gap-2"
                >
                  {currentPage > 1 ? (
                    <Link
                      href={
                        currentPage - 1 === 1
                          ? "/events#past-events"
                          : `/events?page=${currentPage - 1}#past-events`
                      }
                      className="px-4 py-2 rounded-md border border-brand-dark/20 bg-white text-brand-dark font-heading font-bold hover:bg-brand-dark hover:text-white transition-colors"
                    >
                      ← Previous
                    </Link>
                  ) : (
                    <span className="px-4 py-2 rounded-md border border-brand-dark/10 bg-white/50 text-brand-dark/40 font-heading font-bold cursor-not-allowed">
                      ← Previous
                    </span>
                  )}

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    const isCurrent = pageNum === currentPage;
                    const href =
                      pageNum === 1 ? "/events#past-events" : `/events?page=${pageNum}#past-events`;
                    return isCurrent ? (
                      <span
                        key={pageNum}
                        aria-current="page"
                        className="min-w-10 px-3 py-2 rounded-md bg-brand-dark text-white font-heading font-bold text-center"
                      >
                        {pageNum}
                      </span>
                    ) : (
                      <Link
                        key={pageNum}
                        href={href}
                        className="min-w-10 px-3 py-2 rounded-md border border-brand-dark/20 bg-white text-brand-dark font-heading font-bold text-center hover:bg-brand-dark hover:text-white transition-colors"
                      >
                        {pageNum}
                      </Link>
                    );
                  })}

                  {currentPage < totalPages ? (
                    <Link
                      href={`/events?page=${currentPage + 1}#past-events`}
                      className="px-4 py-2 rounded-md border border-brand-dark/20 bg-white text-brand-dark font-heading font-bold hover:bg-brand-dark hover:text-white transition-colors"
                    >
                      Next →
                    </Link>
                  ) : (
                    <span className="px-4 py-2 rounded-md border border-brand-dark/10 bg-white/50 text-brand-dark/40 font-heading font-bold cursor-not-allowed">
                      Next →
                    </span>
                  )}
                </nav>
              )}
            </>
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
