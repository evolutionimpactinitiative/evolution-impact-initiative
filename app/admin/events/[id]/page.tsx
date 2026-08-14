import Link from "next/link";
import { notFound } from "next/navigation";
import { Rocket } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "@/components/admin/EventForm";
import type { Event } from "@/lib/supabase/types";
import { derivePlaybookSteps } from "@/lib/events/playbook";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditEventPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: eventData } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  const event = eventData as Event | null;

  if (!event) {
    notFound();
  }

  const steps = derivePlaybookSteps(event);
  const doneCount = steps.filter((s) => s.done).length;
  const playbookComplete = doneCount === steps.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading font-black text-2xl md:text-3xl text-gray-900">
          Edit Event
        </h1>
        <p className="text-gray-600 mt-1">{event.title}</p>
      </div>

      <Link
        href={`/admin/events/${event.id}/playbook`}
        className={`block rounded-2xl p-4 md:p-5 border transition-colors ${
          playbookComplete
            ? "bg-emerald-50 border-emerald-200 hover:border-emerald-400"
            : "bg-brand-blue/5 border-brand-blue/20 hover:border-brand-blue"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              playbookComplete
                ? "bg-emerald-600 text-white"
                : "bg-brand-blue text-white"
            }`}
          >
            <Rocket className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-brand-dark">
              Launch playbook
            </p>
            <p className="text-sm text-gray-600">
              {playbookComplete
                ? "All steps complete — event is fully launched."
                : `${doneCount} of ${steps.length} steps done · artwork → publish → announcement → socials`}
            </p>
          </div>
          <div className="text-brand-blue text-sm font-heading font-bold uppercase tracking-widest">
            Open →
          </div>
        </div>
      </Link>

      <EventForm event={event} />
    </div>
  );
}
