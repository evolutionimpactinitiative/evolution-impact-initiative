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
  MessageCircle,
  UserCheck,
  ClipboardList,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/admin/StatCard";
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

  // ---- Attention queries (Option C "needs attention" feed) ----
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysFrom = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  // 1. Chat threads awaiting a team reply.
  const { count: chatNeedsReply } = await supabase
    .from("chat_threads" as "profiles")
    .select("*", { count: "exact", head: true })
    .eq("status", "open")
    .eq("last_message_by", "family");

  // 2. Families who joined in the last 7 days.
  const { count: newFamiliesCount } = await supabase
    .from("families" as "profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", sevenDaysAgo.toISOString());

  // 3. Growing Together sessions in the next 14 days.
  const { count: upcomingGtCount } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("programme", "growing_together")
    .eq("status", "published")
    .gte("date", new Date().toISOString().split("T")[0])
    .lte("date", fourteenDaysFrom.toISOString().split("T")[0]);

  // 4. Village posts sitting in draft.
  const { count: draftVillageCount } = await supabase
    .from("village_posts" as "profiles")
    .select("*", { count: "exact", head: true })
    .eq("status", "draft");

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

      {/* Needs attention — things only a human can resolve, right now */}
      <AttentionList
        items={[
          chatNeedsReply && chatNeedsReply > 0
            ? {
                key: "chat",
                icon: "MessageCircle" as const,
                label: `${chatNeedsReply} family message${chatNeedsReply === 1 ? "" : "s"} waiting for a reply`,
                tone: "urgent" as const,
                href: "/admin/messages?filter=needs_reply",
              }
            : null,
          upcomingGtCount && upcomingGtCount > 0
            ? {
                key: "gt",
                icon: "Calendar" as const,
                label: `${upcomingGtCount} Growing Together session${upcomingGtCount === 1 ? "" : "s"} in the next 14 days`,
                tone: "info" as const,
                href: "/admin/growing-together",
              }
            : null,
          newFamiliesCount && newFamiliesCount > 0
            ? {
                key: "families",
                icon: "UserCheck" as const,
                label: `${newFamiliesCount} new famil${newFamiliesCount === 1 ? "y" : "ies"} joined this week`,
                tone: "info" as const,
                href: "/admin/growing-together/families",
              }
            : null,
          draftVillageCount && draftVillageCount > 0
            ? {
                key: "village",
                icon: "ClipboardList" as const,
                label: `${draftVillageCount} Our Village post${draftVillageCount === 1 ? "" : "s"} in draft`,
                tone: "info" as const,
                href: "/admin/growing-together/village",
              }
            : null,
        ].filter((x): x is NonNullable<typeof x> => x !== null)}
      />

      {/* At a glance — compact scan-line of all the vanity metrics */}
      <section>
        <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500 mb-3">
          At a glance
        </h2>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 lg:p-5">
          <div className="flex flex-wrap gap-x-8 gap-y-4 items-baseline">
            <GlanceStat
              label="Upcoming events"
              value={String(upcomingEventsCount || 0)}
              href="/admin/events"
            />
            <GlanceDivider />
            <GlanceStat
              label="Registrations this month"
              value={String(registrationsThisMonth || 0)}
              href="/admin/registrations"
            />
            <GlanceDivider />
            <GlanceStat
              label="Subscribers"
              value={String(activeSubscribersCount || 0)}
              href="/admin/subscribers"
            />
            <GlanceDivider />
            <GlanceStat
              label="Survey responses"
              value={String(surveyResponsesThisMonth || 0)}
              href="/admin/surveys"
            />
            {canSeeMoney && (
              <>
                <GlanceDivider />
                <GlanceStat
                  label="Donations this month"
                  value={`£${(totalDonationsThisMonth / 100).toFixed(0)}`}
                  href="/admin/donations"
                />
                <GlanceDivider />
                <GlanceStat label="Recurring" value="£0" />
              </>
            )}
          </div>
        </div>
      </section>

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

// ---- Dashboard-local components for Option C ----

type AttentionIconName = "MessageCircle" | "Calendar" | "UserCheck" | "ClipboardList";

type AttentionItem = {
  key: string;
  icon: AttentionIconName;
  label: string;
  tone: "urgent" | "info";
  href: string;
};

function AttentionList({ items }: { items: AttentionItem[] }) {
  return (
    <section>
      <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500 mb-3">
        Needs attention
      </h2>
      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 mb-3">
            <Sparkles className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="font-heading font-black text-gray-900">
            You&apos;re all caught up.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Nothing waiting on you right now.
          </p>
        </div>
      ) : (
        <ul className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-hidden">
          {items.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={
                      "flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0 " +
                      (item.tone === "urgent"
                        ? "bg-red-100 text-red-700"
                        : "bg-brand-blue/10 text-brand-blue")
                    }
                  >
                    <AttentionIcon name={item.icon} />
                  </span>
                  <p className="font-medium text-gray-900 truncate">{item.label}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-blue flex-shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AttentionIcon({ name }: { name: AttentionIconName }) {
  if (name === "MessageCircle") return <MessageCircle className="w-4 h-4" />;
  if (name === "Calendar") return <Calendar className="w-4 h-4" />;
  if (name === "UserCheck") return <UserCheck className="w-4 h-4" />;
  return <ClipboardList className="w-4 h-4" />;
}

function GlanceStat({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">
        {label}
      </p>
      <p className="text-xl font-black text-brand-dark mt-0.5">{value}</p>
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="hover:text-brand-blue transition-colors">
        {content}
      </Link>
    );
  }
  return content;
}

function GlanceDivider() {
  return (
    <span
      aria-hidden
      className="hidden sm:block w-px h-10 bg-gray-200 self-center"
    />
  );
}
