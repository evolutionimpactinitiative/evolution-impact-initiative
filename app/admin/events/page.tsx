import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Event } from "@/lib/supabase/types";

export default async function EventsPage() {
  const supabase = await createClient();

  const { data: eventsData } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: false });

  const events = (eventsData as Event[] | null) || [];

  // Get registration counts for each event
  const eventIds = events.map((e) => e.id);
  const { data: registrationCounts } = await supabase
    .from("registrations")
    .select("event_id, status")
    .in("event_id", eventIds.length > 0 ? eventIds : ["none"]);

  type RegCount = { event_id: string; status: string };
  const countsByEvent = ((registrationCounts as RegCount[] | null) || []).reduce(
    (acc, reg) => {
      if (!acc[reg.event_id]) {
        acc[reg.event_id] = { confirmed: 0, waitlisted: 0 };
      }
      if (reg.status === "confirmed") acc[reg.event_id].confirmed++;
      if (reg.status === "waitlisted") acc[reg.event_id].waitlisted++;
      return acc;
    },
    {} as Record<string, { confirmed: number; waitlisted: number }>
  );

  const getStatusBadge = (event: Event) => {
    const now = new Date();
    const eventDate = new Date(event.date);

    if (event.status === "draft") {
      return <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">Draft</span>;
    }
    if (event.status === "cancelled") {
      return <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">Cancelled</span>;
    }
    if (eventDate < now) {
      return <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">Past</span>;
    }
    return <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">Published</span>;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "creative":
        return "bg-brand-blue/10 text-brand-blue";
      case "sport":
        return "bg-brand-green/10 text-brand-green";
      case "support":
        return "bg-orange-100 text-orange-700";
      case "community":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-black text-xl lg:text-2xl text-gray-900">Events</h1>
          <p className="text-gray-600 text-sm lg:text-base mt-1">Manage your events and registrations</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/admin/events/new">
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Link>
        </Button>
      </div>

      {/* Events list */}
      {events.length > 0 ? (
        <div className="space-y-3">
          {events.map((event) => {
            const counts = countsByEvent[event.id] || { confirmed: 0, waitlisted: 0 };
            return (
              <div
                key={event.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6"
              >
                {/* Mobile Layout */}
                <div className="lg:hidden space-y-3">
                  {/* Badges row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(event)}
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryColor(event.category)}`}>
                      {event.category}
                    </span>
                  </div>

                  {/* Title */}
                  <Link
                    href={`/admin/events/${event.id}`}
                    className="block font-semibold text-gray-900 hover:text-brand-blue transition-colors"
                  >
                    {event.title}
                  </Link>

                  {/* Date & Registrations */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      {new Date(event.date).toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 flex-shrink-0" />
                      {counts.confirmed}/{event.total_slots} registered
                    </div>
                  </div>

                  {/* Venue */}
                  <p className="text-sm text-gray-500 truncate">{event.venue_name}</p>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/admin/events/${event.id}/registrations`}>Registrations</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/admin/events/${event.id}`}>Edit</Link>
                    </Button>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden lg:block">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Link
                          href={`/admin/events/${event.id}`}
                          className="font-semibold text-gray-900 hover:text-brand-blue transition-colors truncate"
                        >
                          {event.title}
                        </Link>
                        {getStatusBadge(event)}
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryColor(event.category)}`}>
                          {event.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(event.date).toLocaleDateString("en-GB", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {counts.confirmed}/{event.total_slots} registered
                          {counts.waitlisted > 0 && ` (+${counts.waitlisted} waitlist)`}
                        </div>
                      </div>

                      <p className="text-sm text-gray-500 mt-2 truncate">{event.venue_name}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/events/${event.id}/registrations`}>Registrations</Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/events/${event.id}`}>Edit</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">No events yet</h3>
          <p className="text-gray-500 mb-4">Create your first event to get started</p>
          <Button asChild>
            <Link href="/admin/events/new">
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
