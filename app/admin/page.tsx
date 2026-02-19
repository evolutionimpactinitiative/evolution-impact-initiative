import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Calendar, Users, Heart, TrendingUp, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Event, Registration, RegistrationChild } from "@/lib/supabase/types";

type RegistrationWithRelations = Registration & {
  events: { title: string; date: string } | null;
  registration_children: RegistrationChild[] | null;
};

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Get upcoming events count
  const { count: upcomingEventsCount } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .gte("date", new Date().toISOString().split("T")[0])
    .eq("status", "published");

  // Get total registrations this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: registrationsThisMonth } = await supabase
    .from("registrations")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfMonth.toISOString())
    .eq("status", "confirmed");

  // Get donations this month
  const { data: donationsData } = await supabase
    .from("donations")
    .select("amount")
    .gte("created_at", startOfMonth.toISOString())
    .eq("status", "completed");

  const totalDonationsThisMonth = (donationsData as { amount: number }[] | null)?.reduce(
    (sum, d) => sum + d.amount,
    0
  ) || 0;

  // Get recent registrations
  const { data: recentRegistrationsData } = await supabase
    .from("registrations")
    .select(`
      *,
      events (title, date),
      registration_children (child_name, child_age)
    `)
    .order("created_at", { ascending: false })
    .limit(5);

  const recentRegistrations = recentRegistrationsData as RegistrationWithRelations[] | null;

  // Get upcoming events
  const { data: upcomingEventsData } = await supabase
    .from("events")
    .select("*")
    .gte("date", new Date().toISOString().split("T")[0])
    .eq("status", "published")
    .order("date", { ascending: true })
    .limit(3);

  const upcomingEvents = upcomingEventsData as Event[] | null;

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="font-heading font-black text-2xl md:text-3xl text-gray-900">
          Dashboard
        </h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here&apos;s what&apos;s happening with Evolution Impact Initiative.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{upcomingEventsCount || 0}</p>
            </div>
            <div className="w-12 h-12 bg-brand-blue/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-brand-blue" />
            </div>
          </div>
          <Link
            href="/admin/events"
            className="text-sm text-brand-blue hover:underline mt-4 inline-flex items-center gap-1"
          >
            View all events <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Registrations (This Month)</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{registrationsThisMonth || 0}</p>
            </div>
            <div className="w-12 h-12 bg-brand-green/10 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-brand-green" />
            </div>
          </div>
          <Link
            href="/admin/registrations"
            className="text-sm text-brand-blue hover:underline mt-4 inline-flex items-center gap-1"
          >
            View registrations <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Donations (This Month)</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                £{(totalDonationsThisMonth / 100).toFixed(0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-red-500" />
            </div>
          </div>
          <Link
            href="/admin/donations"
            className="text-sm text-brand-blue hover:underline mt-4 inline-flex items-center gap-1"
          >
            View donations <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Recurring</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">£0</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-500" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">From 0 active donors</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-4">
        <Button asChild>
          <Link href="/admin/events/new">
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/registrations">View All Registrations</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/donations">View Donations</Link>
        </Button>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming events */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-heading font-bold text-lg text-gray-900">Upcoming Events</h2>
          </div>
          <div className="p-6">
            {upcomingEvents && upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/admin/events/${event.id}`}
                    className="block p-4 rounded-lg border border-gray-200 hover:border-brand-blue hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{event.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(event.date).toLocaleDateString("en-GB", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <span className="text-xs font-medium bg-brand-green/10 text-brand-green px-2 py-1 rounded-full">
                        {event.total_slots} slots
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No upcoming events</p>
                <Button asChild className="mt-4" size="sm">
                  <Link href="/admin/events/new">Create Event</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Recent registrations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-heading font-bold text-lg text-gray-900">Recent Registrations</h2>
          </div>
          <div className="p-6">
            {recentRegistrations && recentRegistrations.length > 0 ? (
              <div className="space-y-4">
                {recentRegistrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{reg.parent_name}</p>
                      <p className="text-sm text-gray-500">
                        {reg.events?.title} - {reg.registration_children?.length || 0} child(ren)
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        reg.status === "confirmed"
                          ? "bg-green-100 text-green-700"
                          : reg.status === "waitlisted"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {reg.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No registrations yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
