import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Plus, ClipboardList, BarChart2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlanceCard } from "@/components/admin/GlanceCard";

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

  // Get response rows (survey_id + respondent_email) so we can count
  // both total responses AND responses per attendee audience.
  const { data: responsesData } = await supabase
    .from("survey_responses")
    .select("survey_id, respondent_email");

  type ResponseRow = { survey_id: string; respondent_email: string };
  const responses = (responsesData as ResponseRow[] | null) || [];

  // Count responses per survey.
  const responseCounts = responses.reduce((acc, r) => {
    acc[r.survey_id] = (acc[r.survey_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const respondersBySurvey = responses.reduce((acc, r) => {
    const key = (r.respondent_email || "").toLowerCase().trim();
    if (!key) return acc;
    (acc[r.survey_id] = acc[r.survey_id] || new Set<string>()).add(key);
    return acc;
  }, {} as Record<string, Set<string>>);

  // --- Attendee audiences, pre-computed once per batch ---
  // Pull every non-cancelled registration with programme + attendance
  // signals, then slice per event_id and build the "all GT" set.
  type AttRow = {
    event_id: string;
    parent_email: string;
    attended: string | null;
    status: string;
    events: { programme: string | null };
    registration_children: { attended: boolean | null }[] | null;
  };
  const { data: attRaw } = await supabase
    .from("registrations")
    .select(
      `event_id, parent_email, attended, status,
       events (programme),
       registration_children (attended)`,
    )
    .neq("status", "cancelled");
  const attAll = (attRaw as unknown as AttRow[] | null) ?? [];

  const attendeeEmailsByEventId: Record<string, Set<string>> = {};
  const gtAttendeeEmails = new Set<string>();
  for (const r of attAll) {
    const yes =
      r.attended === "yes" ||
      (r.registration_children ?? []).some((c) => c.attended === true);
    if (!yes) continue;
    const key = (r.parent_email || "").toLowerCase().trim();
    if (!key) continue;
    (attendeeEmailsByEventId[r.event_id] =
      attendeeEmailsByEventId[r.event_id] || new Set()).add(key);
    if (r.events?.programme === "growing_together") {
      gtAttendeeEmails.add(key);
    }
  }

  function audienceFor(survey: Survey): Set<string> {
    if (survey.event_id) {
      return attendeeEmailsByEventId[survey.event_id] ?? new Set();
    }
    return gtAttendeeEmails;
  }

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
        <GlanceCard
          title="Total Surveys"
          value={totalSurveys}
          icon="ClipboardList"
          iconColor="text-brand-blue"
          iconBgColor="bg-brand-blue/10"
        />
        <GlanceCard
          title="Active"
          value={activeSurveys}
          icon="CheckCircle"
          iconColor="text-brand-green"
          iconBgColor="bg-brand-green/10"
        />
        <GlanceCard
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
            const audience = audienceFor(survey);
            const audienceCount = audience.size;
            const responders = respondersBySurvey[survey.id] ?? new Set<string>();
            const audienceResponded = Array.from(audience).filter((e) =>
              responders.has(e),
            ).length;
            const rate =
              audienceCount > 0
                ? Math.round((audienceResponded / audienceCount) * 100)
                : null;
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
                        {rate !== null && (
                          <span className="text-gray-400">
                            {" · "}
                            {audienceResponded}/{audienceCount} ({rate}%)
                          </span>
                        )}
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

                  <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/surveys/${survey.id}`}>View responses</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/surveys/${survey.id}/edit`}>Edit</Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      title="Open the public survey link in a new tab"
                    >
                      <a
                        href={`/feedback/${survey.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1"
                      >
                        Public link
                        <ExternalLink className="w-3 h-3" />
                      </a>
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
