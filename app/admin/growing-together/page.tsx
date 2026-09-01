import Link from "next/link";
import { ArrowRight, Users, Baby, Calendar, CheckCircle, Clock, ListChecks, Star, ClipboardList, Heart } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { StatCard } from "@/components/admin/StatCard";

// Live counts — this dashboard is the source of truth for GT reporting.
export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatEventDate(date: string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function GrowingTogetherAdminPage() {
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supa = admin as any;

  const today = new Date().toISOString().slice(0, 10);

  const [
    familiesRes,
    childrenRes,
    pastEventsRes,
    upcomingEventsRes,
    regsRes,
    baselineRes,
    survey,
    supportRes,
  ] = await Promise.all([
    supa.from("families").select("id", { count: "exact", head: true }),
    supa
      .from("children")
      .select("id", { count: "exact", head: true })
      .is("archived_at", null),
    supa
      .from("events")
      .select("id, title, date, total_slots", { count: "exact" })
      .eq("programme", "growing_together")
      .eq("status", "published")
      .lt("date", today)
      .order("date", { ascending: false }),
    supa
      .from("events")
      .select("id, title, date, start_time, total_slots, waitlist_slots")
      .eq("programme", "growing_together")
      .eq("status", "published")
      .gte("date", today)
      .order("date", { ascending: true }),
    supa
      .from("registrations")
      .select(
        `id, status, attended, family_id, created_at, parent_name, parent_email,
         events!inner (id, title, date, programme),
         registration_children (id)`,
      )
      .not("family_id", "is", null)
      .eq("events.programme", "growing_together"),
    supa
      .from("outcome_responses")
      .select("id, score_raw, submitted_at", { count: "exact" })
      .eq("programme_strand", "growing_together")
      .eq("timepoint", "baseline"),
    supa
      .from("surveys")
      .select("id")
      .eq("title", "Growing Together — Post-session feedback")
      .maybeSingle(),
    supa.from("families").select("support_areas"),
  ]);

  const familiesCount = familiesRes.count ?? 0;
  const childrenCount = childrenRes.count ?? 0;
  const pastEvents = (pastEventsRes.data as { id: string; title: string; date: string; total_slots: number }[] | null) ?? [];
  const upcomingEvents =
    (upcomingEventsRes.data as {
      id: string;
      title: string;
      date: string;
      start_time: string | null;
      total_slots: number;
      waitlist_slots: number;
    }[] | null) ?? [];

  type RegRow = {
    id: string;
    status: string;
    attended: string | null;
    family_id: string;
    created_at: string;
    parent_name: string;
    parent_email: string;
    events: { id: string; title: string; date: string; programme: string | null };
    registration_children: { id: string }[];
  };
  const regs = (regsRes.data as RegRow[] | null) ?? [];

  const pastEventIds = new Set(pastEvents.map((e) => e.id));
  const upcomingEventIds = new Set(upcomingEvents.map((e) => e.id));

  const pastRegs = regs.filter((r) => pastEventIds.has(r.events.id));
  const upcomingRegs = regs.filter((r) => upcomingEventIds.has(r.events.id));

  const attendedCount = pastRegs
    .filter((r) => r.attended === "yes")
    .reduce((sum, r) => sum + r.registration_children.length, 0);

  const upcomingWaitlisted = upcomingRegs
    .filter((r) => r.status === "waitlisted")
    .reduce((sum, r) => sum + r.registration_children.length, 0);

  const upcomingConfirmed = upcomingRegs
    .filter((r) => r.status === "confirmed")
    .reduce((sum, r) => sum + r.registration_children.length, 0);

  // New vs returning: a family that has attended ≥2 sessions counts as
  // returning, else new (must have attended at least once).
  const attendedByFamily = new Map<string, number>();
  for (const r of pastRegs) {
    if (r.attended !== "yes") continue;
    attendedByFamily.set(r.family_id, (attendedByFamily.get(r.family_id) ?? 0) + 1);
  }
  const familiesWithAttendance = attendedByFamily.size;
  const returningFamilies = [...attendedByFamily.values()].filter((n) => n >= 2).length;
  const newFamilies = familiesWithAttendance - returningFamilies;

  // Sessions delivered = past sessions with ≥1 attended registration
  const sessionsWithAttendance = pastEvents.filter((e) =>
    pastRegs.some((r) => r.events.id === e.id && r.attended === "yes"),
  ).length;

  const avgAttendancePerSession =
    sessionsWithAttendance > 0
      ? Number((attendedCount / sessionsWithAttendance).toFixed(1))
      : 0;

  // Baseline responses
  const baselineResponses = (baselineRes.data as { id: string; score_raw: number | null; submitted_at: string }[] | null) ?? [];
  const baselineCount = baselineRes.count ?? 0;
  const baselineAvg =
    baselineResponses.length > 0
      ? Number(
          (
            baselineResponses
              .filter((r) => r.score_raw !== null)
              .reduce((s, r) => s + (r.score_raw ?? 0), 0) /
            Math.max(
              1,
              baselineResponses.filter((r) => r.score_raw !== null).length,
            )
          ).toFixed(2),
        )
      : null;

  // Feedback average (rating question on the GT post-session survey)
  let feedbackAvg: number | null = null;
  let feedbackCount = 0;
  if (survey.data?.id) {
    const { data: fbRows } = await supa
      .from("survey_responses")
      .select("answers")
      .eq("survey_id", survey.data.id);
    const ratings = (fbRows as { answers: Record<string, unknown> }[] | null)
      ?.map((r) => {
        const v = r.answers?.gt_rating;
        const n = typeof v === "number" ? v : Number(v);
        return Number.isFinite(n) ? n : null;
      })
      .filter((n): n is number => n !== null) ?? [];
    feedbackCount = ratings.length;
    if (ratings.length > 0) {
      feedbackAvg = Number((ratings.reduce((s, n) => s + n, 0) / ratings.length).toFixed(2));
    }
  }

  // Community support requests — aggregate families.support_areas
  const supportRows = (supportRes.data as { support_areas: string[] | null }[] | null) ?? [];
  const supportCounts = new Map<string, number>();
  let familiesWhoAnswered = 0;
  for (const row of supportRows) {
    const areas = row.support_areas ?? [];
    if (areas.length > 0) familiesWhoAnswered++;
    for (const a of areas) {
      supportCounts.set(a, (supportCounts.get(a) ?? 0) + 1);
    }
  }
  const topSupport = [...supportCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const totalFamilies = supportRows.length;

  // Recent registrations (last 8)
  const recentRegs = [...regs]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 8);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-heading font-bold text-brand-blue uppercase tracking-wider mb-1">
            BBC Children in Need · We Move Fwd: Foundations
          </p>
          <h1 className="font-heading font-black text-2xl lg:text-3xl text-brand-dark">
            Growing Together
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Early Years programme for children aged 0–5. Live impact snapshot.
          </p>
        </div>
        <Link
          href="/admin/growing-together/families"
          className="hidden sm:inline-flex items-center gap-1.5 text-sm text-brand-blue hover:text-brand-dark font-medium"
        >
          Manage families
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-4">
        <StatCard
          title="Families"
          value={familiesCount}
          icon="Users"
          href="/admin/growing-together/families"
          linkText="View list"
        />
        <StatCardBaby title="Children" value={childrenCount} />
        <StatCard
          title="Sessions delivered"
          value={sessionsWithAttendance}
          icon="Calendar"
          subtitle={pastEvents.length !== sessionsWithAttendance ? `${pastEvents.length} total past` : undefined}
        />
        <StatCard
          title="Total attendance"
          value={attendedCount}
          icon="CheckCircle"
          subtitle={sessionsWithAttendance > 0 ? `Avg ${avgAttendancePerSession}/session` : undefined}
        />
        <StatCard
          title="Upcoming registered"
          value={upcomingConfirmed}
          icon="UserCheck"
          subtitle={`${upcomingEvents.length} upcoming ${upcomingEvents.length === 1 ? "session" : "sessions"}`}
        />
        <StatCard
          title="Waitlist"
          value={upcomingWaitlisted}
          icon="Clock"
        />
      </div>

      {/* Outcomes + feedback strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 lg:p-6">
          <div className="flex items-start justify-between mb-2">
            <p className="text-sm font-medium text-gray-500">Post-session feedback</p>
            <Star className="h-4 w-4 text-yellow-500" />
          </div>
          <p className="text-2xl lg:text-3xl font-bold text-brand-dark">
            {feedbackAvg !== null ? `${feedbackAvg} / 5` : "—"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {feedbackCount === 0
              ? "No responses yet"
              : `${feedbackCount} ${feedbackCount === 1 ? "response" : "responses"}`}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 lg:p-6">
          <div className="flex items-start justify-between mb-2">
            <p className="text-sm font-medium text-gray-500">Baseline check-ins</p>
            <ClipboardList className="h-4 w-4 text-brand-green" />
          </div>
          <p className="text-2xl lg:text-3xl font-bold text-brand-dark">
            {baselineCount}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {baselineAvg !== null ? `Avg score ${baselineAvg} / 5` : "No responses yet"}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 lg:p-6">
          <div className="flex items-start justify-between mb-2">
            <p className="text-sm font-medium text-gray-500">Reach mix</p>
            <ListChecks className="h-4 w-4 text-brand-blue" />
          </div>
          <p className="text-sm text-brand-dark">
            <span className="font-bold">{newFamilies}</span> new
            <span className="text-gray-400"> · </span>
            <span className="font-bold">{returningFamilies}</span> returning
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Of {familiesWithAttendance} families that have attended
          </p>
        </div>
      </div>

      {/* Community support requests */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-brand-blue" />
            <h2 className="font-heading font-bold text-lg text-brand-dark">
              What families are asking for
            </h2>
          </div>
          <span className="text-xs text-gray-500">
            {familiesWhoAnswered} of {totalFamilies}{" "}
            {totalFamilies === 1 ? "family" : "families"} answered
          </span>
        </div>
        {topSupport.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">
            No families have shared support needs yet. The prompt appears on their dashboard.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {topSupport.map(([area, count]) => {
              const pct =
                familiesWhoAnswered > 0
                  ? Math.round((count / familiesWhoAnswered) * 100)
                  : 0;
              return (
                <li key={area} className="p-4">
                  <div className="flex items-center justify-between gap-4 mb-1.5">
                    <span className="text-sm text-brand-dark">{area}</span>
                    <span className="text-sm font-heading font-bold text-brand-dark whitespace-nowrap">
                      {count} · {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-blue rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Two-column details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming sessions */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-heading font-bold text-lg text-brand-dark">Upcoming sessions</h2>
            <Link
              href="/admin/events"
              className="text-xs text-brand-blue hover:text-brand-dark font-medium"
            >
              Manage in Events
            </Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">No upcoming Growing Together sessions.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {upcomingEvents.slice(0, 6).map((event) => {
                const evRegs = regs.filter((r) => r.events.id === event.id);
                const confirmedSlots = evRegs
                  .filter((r) => r.status === "confirmed")
                  .reduce((s, r) => s + r.registration_children.length, 0);
                const waitlisted = evRegs
                  .filter((r) => r.status === "waitlisted")
                  .reduce((s, r) => s + r.registration_children.length, 0);
                return (
                  <li key={event.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-brand-dark truncate">{event.title}</p>
                      <p className="text-xs text-gray-500">{formatEventDate(event.date)}</p>
                    </div>
                    <div className="text-xs text-gray-600 flex items-center gap-3 flex-shrink-0">
                      <span>
                        <span className="font-bold text-brand-dark">{confirmedSlots}</span> /{" "}
                        {event.total_slots}
                      </span>
                      {waitlisted > 0 && (
                        <span className="text-yellow-700">+{waitlisted} wait</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Recent registrations */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-heading font-bold text-lg text-brand-dark">Recent registrations</h2>
            <Link
              href="/admin/growing-together/families"
              className="text-xs text-brand-blue hover:text-brand-dark font-medium"
            >
              All families
            </Link>
          </div>
          {recentRegs.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">No portal registrations yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentRegs.map((reg) => (
                <li key={reg.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-brand-dark truncate">
                        {reg.parent_name}
                        <span className="text-gray-400 font-normal"> for {reg.events.title}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {reg.registration_children.length}{" "}
                        {reg.registration_children.length === 1 ? "child" : "children"} ·{" "}
                        {new Date(reg.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                        reg.status === "confirmed"
                          ? "bg-brand-green/10 text-brand-green"
                          : reg.status === "waitlisted"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {reg.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// Small dedicated card for the Children stat — StatCard's iconMap doesn't
// include Baby, and we don't want to churn its shared allowlist for one
// programme-scoped tile.
function StatCardBaby({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 lg:p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="text-2xl lg:text-3xl font-bold text-brand-dark mt-1">{value}</p>
        </div>
        <div className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex-shrink-0 bg-brand-green/10">
          <Baby className="w-5 h-5 lg:w-6 lg:h-6 text-brand-green" />
        </div>
      </div>
    </div>
  );
}
