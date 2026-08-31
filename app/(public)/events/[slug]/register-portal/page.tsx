import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import type { Event, Child, ParentCarer } from "@/lib/supabase/types";
import { PortalSessionRegisterForm } from "./PortalSessionRegisterForm";

type Props = { params: Promise<{ slug: string }> };

function formatTime(time: string | null | undefined): string {
  if (!time) return "";
  return time.replace(/^(\d{2}:\d{2}):\d{2}$/, "$1");
}

export default async function PortalRegisterPage({ params }: Props) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: eventData } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  const event = eventData as Event | null;
  if (!event) notFound();

  if (event.programme !== "growing_together") {
    // Non-GT event landed here — bounce to the standard registration.
    redirect(`/events/${slug}/register`);
  }

  const eventDate = new Date(event.date);
  if (eventDate < new Date()) {
    redirect(`/events/${slug}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not signed in → invite them to log in or create an account (with a
  // redirect back to this exact session on success).
  if (!user) {
    return (
      <section className="min-h-[60vh] bg-brand-pale/40 py-16">
        <div className="container mx-auto px-4 max-w-lg">
          <Link
            href={`/events/${slug}`}
            className="inline-flex items-center gap-1.5 text-brand-blue hover:underline mb-6 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to session
          </Link>
          <div className="bg-white rounded-2xl border border-brand-dark/10 p-8 text-center">
            <h1 className="font-heading font-black text-2xl text-brand-dark mb-2">
              {event.title}
            </h1>
            <p className="text-brand-dark/70 mb-6">
              Growing Together sessions are registration-based. Create your family account (once) or
              log in to register — then you&rsquo;ll be able to sign up for any session in a couple
              of taps.
            </p>
            <div className="space-y-3">
              <Button
                asChild
                size="lg"
                className="w-full bg-brand-blue hover:bg-brand-dark text-white font-heading font-bold"
              >
                <Link href={`/portal/join?next=/events/${slug}/register-portal`}>
                  Create a family account
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full border-brand-dark text-brand-dark hover:bg-brand-dark hover:text-white font-heading font-bold"
              >
                <Link href={`/portal/login?next=/events/${slug}/register-portal`}>
                  Log in
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!user.email_confirmed_at) {
    redirect(`/portal/verify-email?email=${encodeURIComponent(user.email || "")}`);
  }

  // Signed-in parent — fetch their family + children.
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: carer } = await (admin as any)
    .from("parent_carers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!carer) {
    return (
      <section className="min-h-[60vh] bg-brand-pale/40 py-16">
        <div className="container mx-auto px-4 max-w-lg text-center">
          <h1 className="font-heading font-black text-2xl text-brand-dark mb-3">
            We couldn&rsquo;t find your family record
          </h1>
          <p className="text-brand-dark/70">
            Please <Link href="/contact" className="text-brand-blue underline">contact us</Link> so we
            can help set this up.
          </p>
        </div>
      </section>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: children } = await (admin as any)
    .from("children")
    .select("*")
    .eq("family_id", carer.family_id)
    .is("archived_at", null)
    .order("date_of_birth", { ascending: true });

  // Already registered? Show a friendly heads-up + link to their session history.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin as any)
    .from("registrations")
    .select("id, status")
    .eq("event_id", event.id)
    .eq("family_id", carer.family_id)
    .neq("status", "cancelled")
    .maybeSingle();

  return (
    <section className="min-h-[60vh] bg-brand-pale/40 py-12 md:py-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link
          href={`/events/${slug}`}
          className="inline-flex items-center gap-1.5 text-brand-blue hover:underline mb-6 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to session
        </Link>

        {/* Session summary */}
        <div className="bg-white rounded-2xl border border-brand-dark/10 p-6 md:p-8 mb-6">
          <p className="text-xs font-heading font-bold text-brand-blue uppercase tracking-wider mb-1">
            Growing Together
          </p>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-brand-dark mb-4">
            {event.title}
          </h1>
          <div className="space-y-1.5 text-sm text-brand-dark/80">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-brand-blue" />
              {eventDate.toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
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
          </div>
          {event.what_to_expect && (
            <p className="mt-4 text-sm text-brand-dark/70">{event.what_to_expect}</p>
          )}
        </div>

        {existing ? (
          <div className="bg-white rounded-2xl border border-brand-green/50 p-6 md:p-8 text-center">
            <h2 className="font-heading font-black text-xl text-brand-dark mb-2">
              You&rsquo;re already registered
            </h2>
            <p className="text-brand-dark/70 mb-6">
              We&rsquo;ve got your family on the list for this session
              {existing.status === "waitlisted" ? " (waitlist)" : ""}.
            </p>
            <Button
              asChild
              className="bg-brand-blue hover:bg-brand-dark text-white font-heading font-bold"
            >
              <Link href="/portal/family">Back to my family</Link>
            </Button>
          </div>
        ) : (
          <PortalSessionRegisterForm
            event={event}
            carer={carer as ParentCarer}
            children={(children as Child[] | null) ?? []}
          />
        )}
      </div>
    </section>
  );
}
