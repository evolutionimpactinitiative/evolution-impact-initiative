import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Calendar, Clock, MapPin, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import type { Event, Registration, RegistrationChild } from "@/lib/supabase/types";
import { CancelRegistrationButton } from "../../CancelRegistrationButton";

type Props = { params: Promise<{ id: string }> };

function formatTime(time: string | null | undefined): string {
  if (!time) return "";
  return time.replace(/^(\d{2}:\d{2}):\d{2}$/, "$1");
}

export default async function RegistrationDetailPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: carer } = await (supabase as any)
    .from("parent_carers")
    .select("family_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!carer) notFound();

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: regData } = await (admin as any)
    .from("registrations")
    .select(`*, registration_children (*)`)
    .eq("id", id)
    .maybeSingle();

  const registration = regData as
    | (Registration & { registration_children: RegistrationChild[] })
    | null;

  if (!registration || registration.family_id !== carer.family_id) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: eventData } = await (admin as any)
    .from("events")
    .select("*")
    .eq("id", registration.event_id)
    .maybeSingle();
  const event = eventData as Event | null;
  if (!event) notFound();

  const isConfirmed = registration.status === "confirmed";
  const isWaitlisted = registration.status === "waitlisted";
  const eventDate = new Date(event.date);

  return (
    <section className="min-h-[60vh] py-10 md:py-14">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-2xl border border-brand-dark/10 p-6 md:p-8">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-heading font-bold mb-4 ${
            isConfirmed
              ? "bg-brand-green/10 text-brand-green"
              : isWaitlisted
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-700"
          }`}>
            <CheckCircle2 className="h-4 w-4" />
            {isConfirmed ? "You're in" : isWaitlisted ? "Waitlisted" : registration.status}
          </div>

          <h1 className="font-heading font-black text-2xl md:text-3xl text-brand-dark mb-2">
            {event.title}
          </h1>
          <p className="text-brand-dark/70 mb-6">
            {isConfirmed
              ? "We can't wait to see your family."
              : isWaitlisted
                ? "If a spot opens up we'll email you straight away."
                : ""}
          </p>

          <div className="border-t border-b border-brand-dark/10 py-4 space-y-2 mb-6">
            <div className="flex items-center gap-2 text-sm text-brand-dark">
              <Calendar className="h-4 w-4 text-brand-blue" />
              {eventDate.toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
            {event.start_time && (
              <div className="flex items-center gap-2 text-sm text-brand-dark">
                <Clock className="h-4 w-4 text-brand-blue" />
                {formatTime(event.start_time)}
                {event.end_time ? ` – ${formatTime(event.end_time)}` : ""}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-brand-dark">
              <MapPin className="h-4 w-4 text-brand-blue" />
              {event.venue_name}, {event.venue_address}
            </div>
            <div className="flex items-center gap-2 text-sm text-brand-dark">
              <Users className="h-4 w-4 text-brand-blue" />
              {registration.registration_children.length}{" "}
              {registration.registration_children.length === 1 ? "child" : "children"} registered:{" "}
              {registration.registration_children.map((c) => c.child_name).join(", ")}
            </div>
          </div>

          {event.what_to_expect && (
            <div className="mb-6">
              <p className="text-xs font-heading font-bold text-brand-dark/60 uppercase tracking-wider mb-1">
                What to expect
              </p>
              <p className="text-sm text-brand-dark/80">{event.what_to_expect}</p>
            </div>
          )}

          {event.what_to_bring && (
            <div className="mb-6">
              <p className="text-xs font-heading font-bold text-brand-dark/60 uppercase tracking-wider mb-1">
                What to bring
              </p>
              <p className="text-sm text-brand-dark/80 whitespace-pre-line">{event.what_to_bring}</p>
            </div>
          )}

          <p className="text-sm text-brand-dark/70 mb-6">
            We&rsquo;ve sent a confirmation to your email. You can also see this registration any time from{" "}
            <Link href="/portal/family" className="text-brand-blue underline">My Family</Link>.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="bg-brand-blue hover:bg-brand-dark text-white font-heading font-bold">
              <Link href="/portal">Back to dashboard</Link>
            </Button>
            {(isConfirmed || isWaitlisted) && new Date(event.date) >= new Date() && (
              <CancelRegistrationButton registrationId={registration.id} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
