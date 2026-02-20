import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/PageHero";
import { FeedbackForm } from "./FeedbackForm";
import type { Survey, SurveyQuestion } from "@/lib/supabase/types";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("surveys")
    .select("title, description")
    .eq("id", id)
    .single();

  const surveyMeta = data as { title: string; description: string | null } | null;

  if (!surveyMeta) {
    return {
      title: "Survey Not Found | Evolution Impact Initiative CIC",
    };
  }

  return {
    title: `${surveyMeta.title} | Evolution Impact Initiative CIC`,
    description: surveyMeta.description || "Share your feedback with us.",
  };
}

export default async function FeedbackPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: surveyData } = await supabase
    .from("surveys")
    .select(`
      *,
      events (title, date)
    `)
    .eq("id", id)
    .eq("is_active", true)
    .single();

  const survey = surveyData as (Survey & { events?: { title: string; date: string } | null }) | null;

  if (!survey) {
    notFound();
  }

  const questions = (survey.questions as SurveyQuestion[]) || [];

  return (
    <>
      <PageHero
        title={survey.title}
        subtitle={
          survey.description ||
          (survey.events
            ? `Share your feedback about ${survey.events.title}`
            : "We'd love to hear your thoughts")
        }
      />

      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <FeedbackForm
              surveyId={survey.id}
              questions={questions}
              eventId={survey.event_id || undefined}
            />
          </div>
        </div>
      </section>
    </>
  );
}
