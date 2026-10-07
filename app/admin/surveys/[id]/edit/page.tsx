import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { SurveyForm } from "@/components/admin/SurveyForm";
import type { Event, Survey } from "@/lib/supabase/types";

type Props = { params: Promise<{ id: string }> };

export default async function EditSurveyPage({ params }: Props) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: surveyData } = await supabase
    .from("surveys")
    .select("*")
    .eq("id", id)
    .single();
  const survey = surveyData as Survey | null;
  if (!survey) notFound();

  const { data: eventsData } = await supabase
    .from("events")
    .select("id, title, date")
    .order("date", { ascending: false });
  const events =
    (eventsData as Pick<Event, "id" | "title" | "date">[] | null) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          href={`/admin/surveys/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-brand-blue hover:text-brand-dark mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to responses
        </Link>
        <h1 className="font-heading font-black text-2xl md:text-3xl text-gray-900">
          Edit survey
        </h1>
        <p className="text-gray-600 mt-1">{survey.title}</p>
      </div>

      <SurveyForm survey={survey} events={events} />
    </div>
  );
}
