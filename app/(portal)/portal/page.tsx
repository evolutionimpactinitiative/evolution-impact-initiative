import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Users,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import type { Event, Registration, RegistrationChild, ParentCarer } from "@/lib/supabase/types";
import { CancelRegistrationButton } from "./CancelRegistrationButton";

type SessionRegistration = Registration & {
  registration_children: RegistrationChild[];
  events: Event | null;
};

function greeting(now: Date): string {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatTime(time: string | null | undefined): string {
  if (!time) return "";
  return time.replace(/^(\d{2}:\d{2}):\d{2}$/, "$1");
}

function formatEventDate(date: string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function firstName(fullName: string | null | undefined): string {
  if (!fullName) return "";
  return fullName.trim().split(/\s+/)[0];
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/portal/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: carer } = await (supabase as any)
    .from("parent_carers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!carer) {
    // Family record missing — bounce them to /portal/family which shows
    // the contact-us fallback.
    redirect("/portal/family");
  }

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: childrenRows } = await (admin as any)
    .from("children")
    .select("id, first_name")
    .eq("family_id", carer.family_id)
    .is("archived_at", null);
  const childrenCount = childrenRows?.length ?? 0;

  // All non-cancelled registrations for this family, with their event.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: regsData } = await (admin as any)
    .from("registrations")
    .select(`
      *,
      registration_children (*),
      events (*)
    `)
    .eq("family_id", carer.family_id)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });

  const allRegs = (regsData as SessionRegistration[] | null) ?? [];
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const upcoming = allRegs
    .filter((r) => r.events && r.events.date >= todayStr)
    .sort((a, b) => a.events!.date.localeCompare(b.events!.date));
  const past = allRegs
    .filter((r) => r.events && r.events.date < todayStr)
    .sort((a, b) => b.events!.date.localeCompare(a.events!.date));
  const attendedCount = past.filter((r) => r.attended === "yes").length;

  const nextAdventure = upcoming[0] ?? null;
  const otherUpcoming = upcoming.slice(1);

  const carerFirstName = firstName((carer as ParentCarer).name);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-8">
      {/* Greeting */}
      <div>
        <p className="font-heading font-semibold text-sm text-brand-blue uppercase tracking-wider mb-1">
          Growing Together
        </p>
        <h1 className="font-heading font-black text-3xl md:text-4xl text-brand-dark">
          {greeting(today)}
          {carerFirstName ? `, ${carerFirstName}` : ""} 👋
        </h1>
        <p className="text-brand-dark/70 mt-1">Welcome back to Growing Together.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <StatCard label="Sessions attended" value={attendedCount} />
        <StatCard label={childrenCount === 1 ? "Child" : "Children"} value={childrenCount} />
        <StatCard label="Upcoming" value={upcoming.length} />
      </div>

      {/* Next Adventure */}
      {nextAdventure ? (
        <NextAdventureCard reg={nextAdventure} />
      ) : (
        <NoAdventureCard />
      )}

      {/* Family summary */}
      <FamilySummaryCard carer={carer as ParentCarer} childrenCount={childrenCount} />

      {/* Other upcoming */}
      {otherUpcoming.length > 0 && (
        <section>
          <h2 className="font-heading font-black text-xl text-brand-dark mb-3">
            Also coming up
          </h2>
          <div className="space-y-3">
            {otherUpcoming.map((reg) => (
              <SmallSessionRow key={reg.id} reg={reg} kind="upcoming" />
            ))}
          </div>
        </section>
      )}

      {/* Past sessions */}
      {past.length > 0 && (
        <section>
          <h2 className="font-heading font-black text-xl text-brand-dark mb-3">
            Previous sessions
          </h2>
          <div className="space-y-3">
            {past.slice(0, 6).map((reg) => (
              <SmallSessionRow key={reg.id} reg={reg} kind="past" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl border border-brand-dark/10 p-4 md:p-5 text-center">
      <p className="font-heading font-black text-3xl md:text-4xl text-brand-blue">{value}</p>
      <p className="text-xs md:text-sm text-brand-dark/70 mt-1">{label}</p>
    </div>
  );
}

function NextAdventureCard({ reg }: { reg: SessionRegistration }) {
  const event = reg.events!;
  const isWaitlisted = reg.status === "waitlisted";
  const childNames = reg.registration_children.map((c) => c.child_name).join(", ");

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-brand-green" />
        <h2 className="font-heading font-black text-xl text-brand-dark">Your next adventure</h2>
      </div>
      <div className="bg-white rounded-2xl border border-brand-green/40 p-6 md:p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs font-heading font-bold text-brand-blue uppercase tracking-wider mb-1">
              {isWaitlisted ? "Waitlisted" : "Registered"}
              {event.primary_difference ? ` · ${differenceLabel(event.primary_difference)}` : ""}
            </p>
            <h3 className="font-heading font-black text-2xl text-brand-dark leading-tight">
              {event.title}
            </h3>
          </div>
          <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-brand-green/10 text-brand-green flex-shrink-0">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        <div className="space-y-1.5 text-sm text-brand-dark/80 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-brand-blue" />
            {formatEventDate(event.date)}
          </div>
          {event.start_time && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-blue" />
              {formatTime(event.start_time)}
              {event.end_time ? ` – ${formatTime(event.end_time)}` : ""}
            </div>
          )}
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand-blue" />
            {event.venue_name}
          </div>
          {childNames && (
            <div className="flex items-center gap-2 text-brand-dark/70">
              <Users className="h-4 w-4 text-brand-blue" />
              With {childNames}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            asChild
            className="bg-brand-blue hover:bg-brand-dark text-white font-heading font-bold"
          >
            <Link href={`/portal/registrations/${reg.id}`}>
              View session
            </Link>
          </Button>
          <CancelRegistrationButton
            registrationId={reg.id}
            label="Cancel my registration"
            variant="ghost"
          />
        </div>
      </div>
    </section>
  );
}

function NoAdventureCard() {
  return (
    <div className="bg-brand-pale/40 rounded-2xl border border-brand-dark/10 p-6 md:p-8 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white text-brand-blue mb-3">
        <Sparkles className="h-6 w-6" />
      </div>
      <h2 className="font-heading font-black text-xl text-brand-dark mb-1">
        No upcoming sessions yet
      </h2>
      <p className="text-brand-dark/70 mb-5">
        Browse Growing Together to find your next session.
      </p>
      <Button
        asChild
        className="bg-brand-blue hover:bg-brand-dark text-white font-heading font-bold"
      >
        <Link href="/growing-together">
          Browse sessions <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

function FamilySummaryCard({
  carer,
  childrenCount,
}: {
  carer: ParentCarer;
  childrenCount: number;
}) {
  return (
    <section>
      <h2 className="font-heading font-black text-xl text-brand-dark mb-3">Your family</h2>
      <div className="bg-white rounded-2xl border border-brand-dark/10 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-heading font-bold text-brand-dark">{carer.name}</p>
            <p className="text-sm text-brand-dark/70 mb-3">
              {carer.relationship_to_child
                ? `${carer.relationship_to_child.charAt(0).toUpperCase()}${carer.relationship_to_child.slice(1)}`
                : "Parent / carer"}
            </p>
            <p className="text-sm text-brand-dark/80">
              {childrenCount === 0
                ? "No children added yet."
                : `${childrenCount} ${childrenCount === 1 ? "child" : "children"} in your family`}
            </p>
          </div>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="border-brand-dark/20 text-brand-dark hover:bg-brand-pale"
          >
            <Link href="/portal/family">
              {childrenCount === 0 ? (
                <>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add a child
                </>
              ) : (
                "Manage family"
              )}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function SmallSessionRow({
  reg,
  kind,
}: {
  reg: SessionRegistration;
  kind: "upcoming" | "past";
}) {
  const event = reg.events!;
  const attended = reg.attended;

  return (
    <Link
      href={`/portal/registrations/${reg.id}`}
      className="block bg-white rounded-xl border border-brand-dark/10 p-4 hover:border-brand-blue/50 transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-heading font-bold text-brand-dark truncate">{event.title}</p>
          <p className="text-sm text-brand-dark/70">{formatEventDate(event.date)}</p>
        </div>
        <div className="flex-shrink-0">
          {kind === "upcoming" ? (
            <span
              className={`text-xs px-2 py-1 rounded-full font-heading font-bold ${
                reg.status === "waitlisted"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-brand-green/10 text-brand-green"
              }`}
            >
              {reg.status === "waitlisted" ? "Waitlist" : "Registered"}
            </span>
          ) : (
            <span
              className={`text-xs px-2 py-1 rounded-full font-heading font-bold ${
                attended === "yes"
                  ? "bg-brand-green/10 text-brand-green"
                  : attended === "no"
                    ? "bg-gray-100 text-gray-600"
                    : "bg-gray-100 text-gray-600"
              }`}
            >
              {attended === "yes" ? "Attended" : attended === "no" ? "Missed" : "Attended?"}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function differenceLabel(diff: string): string {
  if (diff === "confidence") return "Confidence";
  if (diff === "connection") return "Connection";
  if (diff === "belonging") return "Belonging";
  return diff;
}
