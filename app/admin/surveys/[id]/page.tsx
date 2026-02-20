import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { SurveyResponsesView } from "@/components/admin/SurveyResponsesView";
import { ArrowLeft, Edit, ExternalLink, Copy } from "lucide-react";
import type { Survey, SurveyResponse, SurveyQuestion } from "@/lib/supabase/types";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SurveyDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = createAdminClient();

  // Get survey
  const { data: surveyData } = await supabase
    .from("surveys")
    .select(`
      *,
      events (id, title)
    `)
    .eq("id", id)
    .single();

  const survey = surveyData as (Survey & { events?: { id: string; title: string } | null }) | null;

  if (!survey) {
    notFound();
  }

  // Get responses
  const { data: responsesData } = await supabase
    .from("survey_responses")
    .select("*")
    .eq("survey_id", id)
    .order("submitted_at", { ascending: false });

  const responses = (responsesData as SurveyResponse[] | null) || [];
  const questions = (survey.questions as SurveyQuestion[]) || [];

  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://evolutionimpactinitiative.co.uk";
  const surveyLink = `${BASE_URL}/feedback/${id}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/surveys"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Surveys
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-heading font-black text-xl lg:text-2xl text-gray-900">
                {survey.title}
              </h1>
              {survey.is_active ? (
                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                  Active
                </span>
              ) : (
                <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                  Inactive
                </span>
              )}
            </div>
            {survey.description && (
              <p className="text-gray-600 mb-2">{survey.description}</p>
            )}
            {survey.events && (
              <p className="text-sm text-gray-500">
                Linked to: {survey.events.title}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/surveys/${id}/edit`}>
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={surveyLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1" />
                Preview
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Share Link */}
      <div className="bg-brand-pale/30 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Share this survey:</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-white px-3 py-2 rounded border text-sm text-gray-600 truncate">
            {surveyLink}
          </code>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(surveyLink);
            }}
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Responses</p>
          <p className="text-2xl font-bold text-brand-blue">{responses.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Questions</p>
          <p className="text-2xl font-bold text-gray-900">{questions.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-brand-green">
            {responses.filter((r) => r.status === "completed").length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Partial</p>
          <p className="text-2xl font-bold text-yellow-600">
            {responses.filter((r) => r.status === "partial").length}
          </p>
        </div>
      </div>

      {/* Responses */}
      <SurveyResponsesView
        survey={survey}
        questions={questions}
        responses={responses}
      />
    </div>
  );
}
