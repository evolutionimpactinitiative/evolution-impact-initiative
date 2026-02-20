import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { ArrowLeft, Calendar, Clock, MapPin, Users, Tag, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import type { Event } from "@/lib/supabase/types";

type Props = {
  params: Promise<{ slug: string }>;
};

type RegistrationStatus = "open" | "waitlist" | "full" | "closed";

interface EventWithAvailability extends Event {
  spotsRemaining: number;
  waitlistRemaining: number;
  registrationStatus: RegistrationStatus;
}

async function getEvent(slug: string): Promise<EventWithAvailability | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!data) return null;

  const event = data as Event;

  // Fetch registration counts
  const { data: regsData } = await supabase
    .from("registrations")
    .select("status")
    .eq("event_id", event.id);

  const regs = (regsData as { status: string }[] | null) || [];
  const confirmedCount = regs.filter((r) => r.status === "confirmed").length;
  const waitlistedCount = regs.filter((r) => r.status === "waitlisted").length;

  const spotsRemaining = Math.max(0, event.total_slots - confirmedCount);
  const waitlistRemaining = Math.max(0, event.waitlist_slots - waitlistedCount);

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
    spotsRemaining,
    waitlistRemaining,
    registrationStatus,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event) {
    return {
      title: "Event Not Found",
    };
  }

  return {
    title: `${event.title} | Evolution Impact Initiative`,
    description: event.short_description,
  };
}

// Dynamic page - always fetch fresh data
export const dynamic = "force-dynamic";

// Helper to format time (remove seconds if present)
function formatTime(time: string | null | undefined): string {
  if (!time) return "";
  // Remove seconds from HH:MM:SS format
  return time.replace(/^(\d{2}:\d{2}):\d{2}$/, "$1");
}

// Helper to format plain text with newlines into HTML paragraphs
function formatDescription(text: string): string {
  if (!text) return "";

  // If it already has proper HTML paragraph tags with content
  if (/<p[^>]*>[\s\S]*<\/p>/i.test(text)) {
    // Clean up empty paragraphs and ensure proper spacing
    return text
      .replace(/<p>\s*<\/p>/gi, '') // Remove empty paragraphs
      .replace(/<p><\/p>/gi, '')    // Remove empty paragraphs (no space)
      .replace(/(<\/p>)(<p)/gi, '$1\n$2'); // Add newlines between paragraphs for readability
  }

  // Convert <br> and <br/> tags to newlines first
  let normalized = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Check if we have any newlines at all
  const hasNewlines = /\n/.test(normalized);

  // If no newlines, try to intelligently add paragraph breaks
  if (!hasNewlines) {
    // Add breaks before common section headers (What to Expect:, What to Bring:, etc.)
    normalized = normalized.replace(/\s+(What to \w+:)/gi, '\n\n$1');
    normalized = normalized.replace(/\s+(How to \w+:)/gi, '\n\n$1');
    normalized = normalized.replace(/\s+(Please note:)/gi, '\n\n$1');
    normalized = normalized.replace(/\s+(Important:)/gi, '\n\n$1');

    // Add breaks before bullet points
    normalized = normalized.replace(/\s+([•\-\*]\s)/g, '\n$1');

    // Add paragraph breaks after sentences that end a thought (period + space + capital starting common sentence starters)
    normalized = normalized.replace(/\.\s+(This\s)/g, '.\n\n$1');
    normalized = normalized.replace(/\.\s+(It\s)/g, '.\n\n$1');
    normalized = normalized.replace(/\.\s+(We\s)/g, '.\n\n$1');
    normalized = normalized.replace(/\.\s+(You\s)/g, '.\n\n$1');
    normalized = normalized.replace(/\.\s+(Spaces\s)/g, '.\n\n$1');
    normalized = normalized.replace(/\.\s+(Secure\s)/g, '.\n\n$1');
    normalized = normalized.replace(/\.\s+(Join\s)/g, '.\n\n$1');
    normalized = normalized.replace(/\.\s+(Don't\s)/g, '.\n\n$1');
    normalized = normalized.replace(/\.\s+(Whether\s)/g, '.\n\n$1');
  }

  // Check if we have any paragraph breaks (double newlines)
  const hasDoubleNewlines = /\n\n/.test(normalized);

  // If no double newlines but has single newlines, treat them as paragraph breaks
  if (!hasDoubleNewlines && /\n/.test(normalized)) {
    normalized = normalized.replace(/\n+/g, '\n\n');
  }

  // Split by double newlines for paragraphs
  const paragraphs = normalized.split(/\n\n+/);

  return paragraphs
    .filter(para => para.trim())
    .map(para => {
      // Check if this paragraph contains bullet points
      const lines = para.split('\n');
      const hasBullets = lines.some(line => /^[\s]*[•\-\*]/.test(line));

      if (hasBullets) {
        // Convert bullet lines to a list
        const listItems = lines
          .filter(line => line.trim())
          .map(line => {
            const cleanLine = line.replace(/^[\s]*[•\-\*]\s*/, '');
            if (/^[•\-\*]/.test(line.trim())) {
              return `<li>${cleanLine}</li>`;
            }
            return `<p><strong>${line}</strong></p>`;
          });

        // Group consecutive list items
        let result = '';
        let inList = false;
        listItems.forEach(item => {
          if (item.startsWith('<li>')) {
            if (!inList) {
              result += '<ul>';
              inList = true;
            }
            result += item;
          } else {
            if (inList) {
              result += '</ul>';
              inList = false;
            }
            result += item;
          }
        });
        if (inList) result += '</ul>';
        return result;
      }

      // Regular paragraph - let Tailwind prose handle spacing
      return `<p>${para.replace(/\n/g, '<br>')}</p>`;
    })
    .join('');
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event) {
    notFound();
  }

  const today = new Date().toISOString().split("T")[0];
  const isUpcoming = event.date >= today;
  const isPast = event.date < today;

  const formattedDate = new Date(event.date).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const categoryLabel = {
    creative: "Creative",
    sport: "Sport",
    support: "Support",
    community: "Community",
    workshop: "Workshop",
    social: "Social",
    training: "Training",
    family: "Family",
  }[event.category] || event.category;

  return (
    <main className="min-h-screen bg-white pt-24">
      {/* Back navigation */}
      <div className="container mx-auto px-4 py-6">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-brand-blue hover:text-brand-dark transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </Link>
      </div>

      {/* Hero section */}
      <section className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Event image - Polaroid style */}
          <div className="relative group">
            <div
              className="bg-white p-4 pb-6 shadow-lg hover:shadow-xl transition-all duration-300 -rotate-1 hover:rotate-0"
              style={{
                boxShadow: "0 4px 20px rgba(0,0,0,0.12), 0 8px 35px rgba(0,0,0,0.08)",
              }}
            >
              {/* Tape decoration at top */}
              <div
                className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-8 bg-amber-100/80 z-10"
                style={{
                  transform: "translateX(-50%) rotate(-2deg)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              />

              {/* Image container */}
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                <Image
                  src={event.hero_image_url || event.card_image_url || "/placeholder-event.jpg"}
                  alt={event.title}
                  fill
                  className="object-cover"
                  priority
                />

                {/* Status badge */}
                {isPast && (
                  <div className="absolute top-3 left-3 bg-gray-600 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm">
                    Past Event
                  </div>
                )}
                {isUpcoming && event.registrationStatus === "open" && (
                  <div className="absolute top-3 left-3 bg-brand-green text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm">
                    {event.spotsRemaining <= 5
                      ? `${event.spotsRemaining} ${event.spotsRemaining === 1 ? "spot" : "spots"} left!`
                      : "Registration Open"}
                  </div>
                )}
                {isUpcoming && event.registrationStatus === "waitlist" && (
                  <div className="absolute top-3 left-3 bg-yellow-500 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm">
                    Waitlist Open
                  </div>
                )}
                {isUpcoming && event.registrationStatus === "full" && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm">
                    Fully Booked
                  </div>
                )}
                {isUpcoming && event.registrationStatus === "closed" && (
                  <div className="absolute top-3 left-3 bg-gray-500 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm">
                    Registration Closed
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Event details */}
          <div>
            <span className="inline-block bg-brand-pale text-brand-blue px-3 py-1 rounded-full text-sm font-medium mb-4 capitalize">
              {categoryLabel}
            </span>
            <h1 className="font-heading font-black text-4xl md:text-5xl text-brand-dark mb-6">
              {event.title}
            </h1>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-brand-dark/70">
                <Calendar className="w-5 h-5 text-brand-blue" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-3 text-brand-dark/70">
                <Clock className="w-5 h-5 text-brand-blue" />
                <span>
                  {event.arrival_time && `Doors: ${formatTime(event.arrival_time)} · `}
                  {formatTime(event.start_time)}{event.end_time ? ` - ${formatTime(event.end_time)}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-3 text-brand-dark/70">
                <MapPin className="w-5 h-5 text-brand-blue" />
                <span>{event.venue_name}{event.venue_address ? `, ${event.venue_address}` : ""}</span>
              </div>
              {event.age_group && (
                <div className="flex items-center gap-3 text-brand-dark/70">
                  <Users className="w-5 h-5 text-brand-blue" />
                  <span>{event.age_group}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-brand-dark/70">
                <Tag className="w-5 h-5 text-brand-blue" />
                <span>{event.cost}</span>
              </div>
              <div className="flex items-center gap-3 text-brand-dark/70">
                <Info className="w-5 h-5 text-brand-blue" />
                {event.registrationStatus === "open" && (
                  <span>
                    {event.spotsRemaining} of {event.total_slots} places available
                  </span>
                )}
                {event.registrationStatus === "waitlist" && (
                  <span className="text-yellow-600 font-medium">
                    Event full &ndash; {event.waitlistRemaining} waitlist {event.waitlistRemaining === 1 ? "spot" : "spots"} available
                  </span>
                )}
                {event.registrationStatus === "full" && (
                  <span className="text-red-600 font-medium">
                    Fully booked (no waitlist available)
                  </span>
                )}
                {event.registrationStatus === "closed" && (
                  <span className="text-gray-500 font-medium">
                    Registration closed
                  </span>
                )}
              </div>
            </div>

            {isUpcoming && (
              <div className="flex flex-col sm:flex-row gap-4">
                {event.registrationStatus === "open" && (
                  <Button asChild size="lg">
                    <Link href={`/events/${event.slug}/register`}>Register Now</Link>
                  </Button>
                )}
                {event.registrationStatus === "waitlist" && (
                  <Button asChild size="lg" variant="secondary">
                    <Link href={`/events/${event.slug}/register`}>Join Waitlist</Link>
                  </Button>
                )}
                {(event.registrationStatus === "full" || event.registrationStatus === "closed") && (
                  <Button size="lg" disabled className="opacity-60 cursor-not-allowed">
                    {event.registrationStatus === "full" ? "Fully Booked" : "Registration Closed"}
                  </Button>
                )}
                <Button asChild variant="outline" size="lg">
                  <Link href="/donate">Support This Event</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Full description */}
      <section className="bg-brand-pale py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-heading font-bold text-2xl text-brand-dark mb-6">
              About This Event
            </h2>
            <div
              className="prose prose-lg max-w-none prose-headings:font-heading prose-headings:text-brand-dark prose-p:text-brand-dark/80"
              dangerouslySetInnerHTML={{
                __html: formatDescription(event.full_description || event.short_description)
              }}
            />
          </div>
        </div>
      </section>

      {/* What to bring / Accessibility (for upcoming events) */}
      {(event.what_to_bring || event.accessibility_info) && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
              {event.what_to_bring && (
                <div className="bg-white border-2 border-brand-blue rounded-xl p-6">
                  <h3 className="font-heading font-bold text-xl text-brand-blue mb-4">
                    What to Bring
                  </h3>
                  <div
                    className="prose prose-sm max-w-none prose-p:text-brand-dark/70"
                    dangerouslySetInnerHTML={{ __html: formatDescription(event.what_to_bring) }}
                  />
                </div>
              )}

              {event.accessibility_info && (
                <div className="bg-white border-2 border-brand-green rounded-xl p-6">
                  <h3 className="font-heading font-bold text-xl text-brand-green mb-4">
                    Accessibility
                  </h3>
                  <p className="text-brand-dark/70">{event.accessibility_info}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* CTA section */}
      <section className="bg-brand-dark py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading font-bold text-3xl text-white mb-4">
            {isUpcoming ? "Join Us at This Event" : "Want to Be Part of Future Events?"}
          </h2>
          <p className="text-white/70 mb-8 max-w-2xl mx-auto">
            {isUpcoming
              ? "Register now to secure your place at this event."
              : "Stay connected with us to hear about upcoming events and opportunities to get involved."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isUpcoming && event.registrationStatus === "open" && (
              <Button asChild size="lg">
                <Link href={`/events/${event.slug}/register`}>Register Now</Link>
              </Button>
            )}
            {isUpcoming && event.registrationStatus === "waitlist" && (
              <Button asChild size="lg">
                <Link href={`/events/${event.slug}/register`}>Join Waitlist</Link>
              </Button>
            )}
            {isUpcoming && (event.registrationStatus === "full" || event.registrationStatus === "closed") && (
              <Button asChild size="lg">
                <Link href="/events">View Other Events</Link>
              </Button>
            )}
            {!isUpcoming && (
              <Button asChild size="lg">
                <Link href="/events">View Upcoming Events</Link>
              </Button>
            )}
            <Button asChild variant="secondary" size="lg">
              <Link href="/get-involved">Get Involved</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
