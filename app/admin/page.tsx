import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Plus,
  ArrowRight,
  Clock,
  Calendar,
  Users,
  Mail,
  Send,
  ClipboardList,
  Heart,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlanceCard } from "@/components/admin/GlanceCard";
import {
  DataCard,
  DataCardHeader,
  DataCardContent,
  DataCardBadge,
} from "@/components/admin/DataCard";
import type { Event, Registration, RegistrationChild } from "@/lib/supabase/types";
import { hatsFor, canSeeSection } from "@/lib/permissions";

type RegistrationWithRelations = Registration & {
  events: { title: string; date: string } | null;
  registration_children: RegistrationChild[] | null;
};

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Role-derived visibility — editors don't see money totals on the home
  // dashboard even though they can reach it.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: meRow } = user
    ? await supabase
        .from("team_members")
        .select("role, is_treasurer")
        .eq("email", user.email || "")
        .maybeSingle()
    : { data: null };
  const hats = hatsFor(
    meRow as { role: "admin" | "editor" | "treasurer"; is_treasurer: boolean } | null,
  );
  const canSeeMoney = canSeeSection(hats, "money");

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

  // Get active subscribers count
  const { count: activeSubscribersCount } = await supabase
    .from("mailing_list" as "profiles")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  // Get survey responses this month
  const { count: surveyResponsesThisMonth } = await supabase
    .from("survey_responses" as "profiles")
    .select("*", { count: "exact", head: true })
    .gte("submitted_at", startOfMonth.toISOString());

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
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="font-heading font-black text-xl lg:text-2xl text-gray-900">
          Dashboard
        </h1>
        <p className="text-gray-600 text-sm lg:text-base mt-1">
          Welcome back! Here&apos;s what&apos;s happening.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
        <GlanceCard
          label="Upcoming events"
          value={String(upcomingEventsCount || 0)}
          icon={<Calendar className="w-4 h-4" />}
          iconTint="bg-brand-blue/10 text-brand-blue"
          href="/admin/events"
        />
        <GlanceCard
          label="Registrations this month"
          value={String(registrationsThisMonth || 0)}
          icon={<Users className="w-4 h-4" />}
          iconTint="bg-brand-green/10 text-brand-green"
          href="/admin/registrations"
        />
        <GlanceCard
          label="Subscribers"
          value={String(activeSubscribersCount || 0)}
          icon={<Mail className="w-4 h-4" />}
          iconTint="bg-indigo-100 text-indigo-500"
          href="/admin/subscribers"
        />
        <GlanceCard
          label="Survey responses"
          value={String(surveyResponsesThisMonth || 0)}
          icon={<ClipboardList className="w-4 h-4" />}
          iconTint="bg-orange-100 text-orange-500"
          href="/admin/surveys"
        />
        {canSeeMoney && (
          <GlanceCard
            label="Donations this month"
            value={`£${(totalDonationsThisMonth / 100).toFixed(0)}`}
            icon={<Heart className="w-4 h-4" />}
            iconTint="bg-red-100 text-red-500"
            href="/admin/donations"
          />
        )}
        {canSeeMoney && (
          <GlanceCard
            label="Recurring"
            value="£0"
            icon={<TrendingUp className="w-4 h-4" />}
            iconTint="bg-purple-100 text-purple-500"
          />
        )}
      </div>

      {/* Quick actions - Full width buttons on mobile */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        <Button asChild className="w-full sm:w-auto">
          <Link href="/admin/events/new">
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Link>
        </Button>
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href="/admin/surveys/new">
            <Plus className="w-4 h-4 mr-2" />
            Create Survey
          </Link>
        </Button>
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href="/admin/subscribers/bulk-email">
            <Send className="w-4 h-4 mr-2" />
            Send Bulk Email
          </Link>
        </Button>
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href="/admin/registrations">View Registrations</Link>
        </Button>
      </div>

      {/* Upcoming events - Card list */}
      <DataCard>
        <DataCardHeader>
          <h2 className="font-heading font-bold text-lg text-gray-900">
            Upcoming Events
          </h2>
          <Link
            href="/admin/events"
            className="text-sm text-brand-blue font-medium flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </DataCardHeader>
        <DataCardContent>
          {upcomingEvents && upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/admin/events/${event.id}`}
                  className="block p-3 lg:p-4 rounded-xl border border-gray-100 hover:border-brand-blue hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">
                          {new Date(event.date).toLocaleDateString("en-GB", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                    </div>
                    <DataCardBadge variant="success">
                      {event.total_slots} slots
                    </DataCardBadge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No upcoming events</p>
              <Button asChild className="mt-4" size="sm">
                <Link href="/admin/events/new">Create Event</Link>
              </Button>
            </div>
          )}
        </DataCardContent>
      </DataCard>

      {/* Recent registrations - Card list */}
      <DataCard>
        <DataCardHeader>
          <h2 className="font-heading font-bold text-lg text-gray-900">
            Recent Registrations
          </h2>
          <Link
            href="/admin/registrations"
            className="text-sm text-brand-blue font-medium flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </DataCardHeader>
        <DataCardContent>
          {recentRegistrations && recentRegistrations.length > 0 ? (
            <div className="space-y-3">
              {recentRegistrations.map((reg) => (
                <div
                  key={reg.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-xl bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {reg.parent_name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {reg.events?.title} - {reg.registration_children?.length || 0} child(ren)
                    </p>
                  </div>
                  <DataCardBadge
                    variant={
                      reg.status === "confirmed"
                        ? "success"
                        : reg.status === "waitlisted"
                        ? "warning"
                        : "default"
                    }
                  >
                    {reg.status}
                  </DataCardBadge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No registrations yet</p>
            </div>
          )}
        </DataCardContent>
      </DataCard>
    </div>
  );
}

