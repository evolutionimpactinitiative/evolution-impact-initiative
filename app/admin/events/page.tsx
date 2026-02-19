import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Calendar, Users, MoreHorizontal } from "lucide-react";
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
      return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">Draft</span>;
    }
    if (event.status === "cancelled") {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">Cancelled</span>;
    }
    if (eventDate < now) {
      return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">Past</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Published</span>;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-gray-900">Events</h1>
          <p className="text-gray-600 mt-1">Manage your events and registrations</p>
        </div>
        <Button asChild>
          <Link href="/admin/events/new">
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Link>
        </Button>
      </div>

      {/* Events list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {events.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {events.map((event) => {
              const counts = countsByEvent[event.id] || { confirmed: 0, waitlisted: 0 };
              return (
                <div key={event.id} className="p-6 hover:bg-gray-50 transition-colors">
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
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(event.category)}`}>
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
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
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
    </div>
  );
}
