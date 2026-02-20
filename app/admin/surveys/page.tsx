import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Plus, ClipboardList, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/admin/StatCard";

type Survey = {
  id: string;
  title: string;
  description: string | null;
  survey_type: string;
  is_active: boolean;
  created_at: string;
  event_id: string | null;
  events?: {
    title: string;
  } | null;
};

type SurveyResponse = {
  survey_id: string;
};

export default async function SurveysPage() {
  const supabase = createAdminClient();

  // Get all surveys
  const { data: surveysData } = await supabase
    .from("surveys")
    .select(`
      *,
      events (title)
    `)
    .order("created_at", { ascending: false });

  const surveys = (surveysData as Survey[] | null) || [];

  // Get response counts
  const { data: responsesData } = await supabase
    .from("survey_responses")
    .select("survey_id");

  const responses = (responsesData as SurveyResponse[] | null) || [];

  // Count responses per survey
  const responseCounts = responses.reduce((acc, r) => {
    acc[r.survey_id] = (acc[r.survey_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate stats
  const totalSurveys = surveys.length;
  const activeSurveys = surveys.filter((s) => s.is_active).length;
  const totalResponses = responses.length;

  const getSurveyTypeLabel = (type: string) => {
    switch (type) {
      case "event_feedback":
        return "Event Feedback";
      case "activity_interest":
        return "Activity Interest";
      case "general":
        return "General Survey";
      default:
        return type;
    }
  };

  const getSurveyTypeColor = (type: string) => {
    switch (type) {
      case "event_feedback":
        return "bg-brand-blue/10 text-brand-blue";
      case "activity_interest":
        return "bg-purple-100 text-purple-700";
      case "general":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-black text-xl lg:text-2xl text-gray-900">Surveys</h1>
          <p className="text-gray-600 text-sm lg:text-base mt-1">
            Create and manage feedback surveys
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/admin/surveys/new">
            <Plus className="w-4 h-4 mr-2" />
            Create Survey
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        <StatCard
          title="Total Surveys"
          value={totalSurveys}
          icon="ClipboardList"
          iconColor="text-brand-blue"
          iconBgColor="bg-brand-blue/10"
        />
        <StatCard
          title="Active"
          value={activeSurveys}
          icon="CheckCircle"
          iconColor="text-brand-green"
          iconBgColor="bg-brand-green/10"
        />
        <StatCard
          title="Total Responses"
          value={totalResponses}
          icon="Users"
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {/* Surveys List */}
      {surveys.length > 0 ? (
        <div className="space-y-3">
          {surveys.map((survey) => {
            const responseCount = responseCounts[survey.id] || 0;
            return (
              <div
                key={survey.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <Link
                        href={`/admin/surveys/${survey.id}`}
                        className="font-semibold text-gray-900 hover:text-brand-blue transition-colors"
                      >
                        {survey.title}
                      </Link>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${getSurveyTypeColor(
                          survey.survey_type
                        )}`}
                      >
                        {getSurveyTypeLabel(survey.survey_type)}
                      </span>
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
                      <p className="text-sm text-gray-500 mb-2 line-clamp-1">
                        {survey.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {survey.events?.title && (
                        <span className="truncate">Event: {survey.events.title}</span>
                      )}
                      <div className="flex items-center gap-1">
                        <BarChart2 className="w-4 h-4" />
                        {responseCount} response{responseCount !== 1 ? "s" : ""}
                      </div>
                      <span>
                        Created{" "}
                        {new Date(survey.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/surveys/${survey.id}`}>View Responses</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/surveys/${survey.id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">No surveys yet</h3>
          <p className="text-gray-500 mb-4">Create your first survey to start collecting feedback</p>
          <Button asChild>
            <Link href="/admin/surveys/new">
              <Plus className="w-4 h-4 mr-2" />
              Create Survey
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
