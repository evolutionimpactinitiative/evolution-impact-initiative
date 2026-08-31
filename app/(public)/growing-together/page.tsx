import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, HeartHandshake, Users, ArrowRight } from "lucide-react";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { EventCard } from "@/components/shared/EventCard";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Event } from "@/lib/supabase/types";
import { slotsForRegistration } from "@/lib/events";

export const metadata: Metadata = {
  title: "Growing Together | Evolution Impact Initiative CIC",
  description:
    "A free Early Years programme for children aged 0–5 and their parents and carers. Growing confident children. Stronger families. Connected communities.",
};

type RegistrationStatus = "open" | "waitlist" | "full" | "closed" | "scheduled";

interface SessionWithStatus extends Event {
  registrationStatus: RegistrationStatus;
  spotsRemaining: number;
  waitlistRemaining: number;
}

function formatTime(time: string | null | undefined): string {
  if (!time) return "";
  return time.replace(/^(\d{2}:\d{2}):\d{2}$/, "$1");
}

export default async function GrowingTogetherPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: sessionsData } = await supabase
    .from("events")
    .select("*")
    .eq("programme", "growing_together")
    .eq("status", "published")
    .gte("date", today)
    .order("date", { ascending: true });

  const upcomingRaw = (sessionsData as Event[] | null) || [];

  const adminClient = createAdminClient();
  const eventIds = upcomingRaw.map((e) => e.id);
  const { data: registrationsData } =
    eventIds.length > 0
      ? await adminClient
          .from("registrations")
          .select(
            `event_id, status, registration_children (id), registration_attendees (id)`,
          )
          .in("event_id", eventIds)
      : { data: [] };

  type RegWithCounts = {
    event_id: string;
    status: string;
    registration_children: { id: string }[];
    registration_attendees: { id: string }[];
  };
  const registrations = (registrationsData as RegWithCounts[] | null) || [];

  const eventTypeMap = upcomingRaw.reduce((acc, e) => {
    acc[e.id] = e.event_type || "children";
    return acc;
  }, {} as Record<string, string>);

  const regCountsByEvent = registrations.reduce((acc, reg) => {
    if (!acc[reg.event_id]) acc[reg.event_id] = { confirmed: 0, waitlisted: 0 };
    const slotsForReg = slotsForRegistration(reg, eventTypeMap[reg.event_id]);
    if (reg.status === "confirmed") acc[reg.event_id].confirmed += slotsForReg;
    if (reg.status === "waitlisted") acc[reg.event_id].waitlisted += slotsForReg;
    return acc;
  }, {} as Record<string, { confirmed: number; waitlisted: number }>);

  const now = new Date();
  const upcoming: SessionWithStatus[] = upcomingRaw.map((event) => {
    const counts = regCountsByEvent[event.id] || { confirmed: 0, waitlisted: 0 };
    const spotsRemaining = Math.max(0, event.total_slots - counts.confirmed);
    const waitlistRemaining = Math.max(0, event.waitlist_slots - counts.waitlisted);

    let registrationStatus: RegistrationStatus;
    if (event.publish_at && new Date(event.publish_at) > now) registrationStatus = "scheduled";
    else if (event.registration_status === "closed") registrationStatus = "closed";
    else if (spotsRemaining > 0) registrationStatus = "open";
    else if (waitlistRemaining > 0) registrationStatus = "waitlist";
    else registrationStatus = "full";

    return { ...event, registrationStatus, spotsRemaining, waitlistRemaining };
  });

  return (
    <>
      {/* Hero */}
      <section className="relative bg-brand-pale/60 pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <SectionLabel text="BBC Children in Need · We Move Fwd: Foundations" color="brand-green" className="mb-6" />
            <h1 className="font-heading font-black text-5xl md:text-6xl lg:text-7xl text-brand-dark mb-6 leading-tight">
              Growing Together
            </h1>
            <p className="font-heading text-2xl md:text-3xl text-brand-blue font-bold mb-6 leading-snug">
              Growing confident children. Stronger families. Connected communities.
            </p>
            <p className="text-lg md:text-xl text-brand-dark/80 mb-8 max-w-2xl">
              A free Early Years programme for children aged 0–5 and their parents and carers.
              We use play, creativity, connection and community to help children feel confident,
              parents feel supported, and every family feel like they belong.
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              {["Free", "Ages 0–5", "Parents & carers welcome", "Medway"].map((tag) => (
                <span
                  key={tag}
                  className="px-4 py-2 bg-white/80 text-brand-dark text-sm font-heading font-semibold rounded-full border border-brand-dark/10"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="bg-brand-blue hover:bg-brand-dark text-white font-heading font-bold">
                <Link href="/portal/join">
                  Join Growing Together <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-2 border-brand-dark text-brand-dark hover:bg-brand-dark hover:text-white font-heading font-bold">
                <Link href="#upcoming">View Upcoming Sessions</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Three Differences */}
      <section className="bg-white py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <SectionLabel text="What we're growing" color="brand-blue" className="mb-6 mx-auto" />
            <h2 className="font-heading font-black text-3xl md:text-4xl text-brand-dark mb-4">
              Three differences we&apos;re here to make
            </h2>
            <p className="text-brand-dark/70 text-lg">
              We don&apos;t measure success by how many sessions we deliver. We measure it by the
              journey each family takes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* 01 Confidence */}
            <div className="bg-brand-pale/40 rounded-2xl p-8 border-t-4 border-brand-blue">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-brand-blue text-white flex items-center justify-center">
                  <Sparkles className="h-6 w-6" />
                </div>
                <span className="font-heading font-black text-brand-blue text-lg">01</span>
              </div>
              <h3 className="font-heading font-black text-2xl text-brand-dark mb-3">Confidence</h3>
              <p className="text-brand-dark/70 mb-4">
                Improved emotional wellbeing and confidence in young children.
              </p>
              <ul className="space-y-2 text-sm text-brand-dark/70">
                <li>· Express themselves</li>
                <li>· Try new things</li>
                <li>· Develop confidence</li>
                <li>· Build communication skills</li>
                <li>· Interact with others</li>
                <li>· Learn through play</li>
              </ul>
            </div>

            {/* 02 Connection */}
            <div className="bg-brand-pale/40 rounded-2xl p-8 border-t-4 border-brand-green">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-brand-green text-white flex items-center justify-center">
                  <HeartHandshake className="h-6 w-6" />
                </div>
                <span className="font-heading font-black text-brand-green text-lg">02</span>
              </div>
              <h3 className="font-heading font-black text-2xl text-brand-dark mb-3">Connection</h3>
              <p className="text-brand-dark/70 mb-4">
                Stronger early relationships and increased parental confidence.
              </p>
              <ul className="space-y-2 text-sm text-brand-dark/70">
                <li>· Play with their children</li>
                <li>· Understand their children</li>
                <li>· Build stronger bonds</li>
                <li>· Learn practical parenting strategies</li>
                <li>· Meet other families</li>
                <li>· Develop confidence</li>
              </ul>
            </div>

            {/* 03 Belonging */}
            <div className="bg-brand-pale/40 rounded-2xl p-8 border-t-4 border-brand-dark">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-brand-dark text-white flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
                <span className="font-heading font-black text-brand-dark text-lg">03</span>
              </div>
              <h3 className="font-heading font-black text-2xl text-brand-dark mb-3">Belonging</h3>
              <p className="text-brand-dark/70 mb-4">
                Increased access to inclusive and culturally affirming Early Years spaces.
              </p>
              <ul className="space-y-2 text-sm text-brand-dark/70">
                <li>· Every family feels welcome</li>
                <li>· Children see themselves represented</li>
                <li>· Culture and identity are respected</li>
                <li>· Families connect with others</li>
                <li>· Activities are inclusive and accessible</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-brand-pale/30 py-20 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <SectionLabel text="How it works" color="brand-green" className="mb-6 mx-auto" />
            <h2 className="font-heading font-black text-3xl md:text-4xl text-brand-dark">
              Four steps to get started
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { n: "01", title: "Join", body: "Create your family account." },
              { n: "02", title: "Explore", body: "Discover upcoming Growing Together sessions." },
              { n: "03", title: "Connect", body: "Attend sessions, meet families, take part in activities." },
              { n: "04", title: "Grow", body: "Build confidence, relationships and belonging together." },
            ].map((step) => (
              <div key={step.n} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="font-heading font-black text-brand-blue text-3xl mb-2">{step.n}</div>
                <h3 className="font-heading font-black text-xl text-brand-dark mb-2">{step.title}</h3>
                <p className="text-brand-dark/70 text-sm">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Sessions */}
      <section id="upcoming" className="bg-white py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <SectionLabel text="What's coming up" color="brand-blue" className="mb-6 mx-auto" />
            <h2 className="font-heading font-black text-3xl md:text-4xl text-brand-dark mb-3">
              Upcoming Sessions
            </h2>
            <p className="text-brand-dark/70">
              Sessions run in three-month cycles. Register your family once, then join any session that suits you.
            </p>
          </div>

          {upcoming.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcoming.map((session) => (
                <EventCard
                  key={session.id}
                  title={session.title}
                  date={new Date(session.date).toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  time={formatTime(session.start_time)}
                  location={session.venue_name}
                  description={session.short_description}
                  image={session.card_image_url || "/placeholder-event.jpg"}
                  slug={session.slug}
                  registrationStatus={session.registrationStatus}
                  spotsRemaining={session.spotsRemaining}
                  waitlistRemaining={session.waitlistRemaining}
                  differenceBadge={session.primary_difference ?? undefined}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-brand-pale/30 rounded-2xl max-w-xl mx-auto">
              <p className="text-brand-dark/70 text-lg mb-4">
                Our first Growing Together sessions are being scheduled.
              </p>
              <Button asChild className="bg-brand-blue hover:bg-brand-dark text-white font-heading font-bold">
                <Link href="/portal/join">Register your family to be first to know</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-brand-dark py-16 md:py-20">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="font-heading font-black text-3xl md:text-4xl text-white mb-4">
            Every family belongs here.
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Join Growing Together in one step. Add your children once — then register for any
            session with a couple of taps.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-brand-accent text-brand-dark hover:bg-brand-green hover:text-white font-heading font-bold"
          >
            <Link href="/portal/join">
              Join Growing Together <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
