import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "@/components/admin/EventForm";
import type { Event } from "@/lib/supabase/types";

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading font-black text-2xl md:text-3xl text-gray-900">
          Edit Event
        </h1>
        <p className="text-gray-600 mt-1">{event.title}</p>
      </div>

      <EventForm event={event} />
    </div>
  );
}
