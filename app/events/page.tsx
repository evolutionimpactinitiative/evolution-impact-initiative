import type { Metadata } from "next";
import { PageHero } from "@/components/shared/PageHero";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { EventCard } from "@/components/shared/EventCard";
import { upcomingEvents, pastEvents } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Events — Evolution Impact Initiative CIC",
  description:
    "Upcoming and previous community events, workshops and programmes in Medway.",
};

export default function EventsPage() {
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
                  date={event.date}
                  time={event.time}
                  location={event.location}
                  description={event.description}
                  image={event.image}
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pastEvents.map((event) => (
              <EventCard
                key={event.id}
                title={event.title}
                date={event.date}
                location="Medway"
                description={event.description}
                image={event.image}
                isPast
                stats={event.stats}
                testimonial={event.testimonial}
              />
            ))}
          </div>
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
