import { createAdminClient } from "@/lib/supabase/admin";
import { SurveyForm } from "@/components/admin/SurveyForm";
import type { Event } from "@/lib/supabase/types";

export default async function NewSurveyPage() {
  const supabase = createAdminClient();

  // Get all events for linking
  const { data: eventsData } = await supabase
    .from("events")
    .select("id, title, date")
    .order("date", { ascending: false });

  const events = (eventsData as Pick<Event, "id" | "title" | "date">[] | null) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading font-black text-2xl md:text-3xl text-gray-900">
          Create Survey
        </h1>
        <p className="text-gray-600 mt-1">
          Build a new survey to collect feedback from your community
        </p>
      </div>

      <SurveyForm events={events} />
    </div>
  );
}
