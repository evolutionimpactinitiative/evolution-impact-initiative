import { notFound } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { SurveyResponsesView } from "@/components/admin/SurveyResponsesView";
import { QrShareCard } from "@/components/admin/QrShareCard";
import { EmailAttendeesButton } from "./EmailAttendeesButton";
import { ArrowLeft, Edit, ExternalLink } from "lucide-react";
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

  // "Email attendees" stats — resolves either event attendees (when the
  // survey is linked to an event) or all Growing Together attendees
  // (when it isn't). Dedupes by lowercased parent_email. The prior-send
  // count is survey-wide — audience choice doesn't affect it.
  type RegRow = {
    id: string;
    parent_email: string;
    attended: string | null;
    status: string;
    registration_children: { attended: boolean | null }[] | null;
  };
  function dedupeAttendees(rows: RegRow[]): number {
    const seen = new Set<string>();
    for (const r of rows) {
      const yes =
        r.attended === "yes" ||
        (r.registration_children ?? []).some((c) => c.attended === true);
      if (!yes) continue;
      const key = (r.parent_email || "").toLowerCase().trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
    }
    return seen.size;
  }

  let audienceCount = 0;
  if (survey.event_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: regs } = await (supabase as any)
      .from("registrations")
      .select(
        `id, parent_email, attended, status,
         registration_children (attended)`,
      )
      .eq("event_id", survey.event_id)
      .neq("status", "cancelled");
    audienceCount = dedupeAttendees((regs as RegRow[] | null) ?? []);
  } else {
    // Programme-wide: everyone who's ever attended any GT session.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: regs } = await (supabase as any)
      .from("registrations")
      .select(
        `id, parent_email, attended, status,
         events!inner (programme),
         registration_children (attended)`,
      )
      .eq("events.programme", "growing_together")
      .neq("status", "cancelled");
    audienceCount = dedupeAttendees((regs as RegRow[] | null) ?? []);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: priorSends } = await (supabase as any)
    .from("email_logs")
    .select("id", { count: "exact", head: true })
    .eq("email_type", "survey_broadcast")
    .eq("survey_id", id);
  const previousBroadcastCount = priorSends ?? 0;

  const qrSrc = await QRCode.toDataURL(surveyLink, {
    width: 480,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#1E1E1E", light: "#FFFFFF" },
  });

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

      {/* Share Link + QR */}
      <QrShareCard
        link={surveyLink}
        qrSrc={qrSrc}
        title={survey.title}
        linkLabel="Share this survey:"
        posterSubtitle="Scan to share your feedback"
        description="Print or display this so attendees can scan and open the survey on their phone."
      />

      {/* Email broadcast — audience depends on whether this survey is
          linked to a specific event or lives programme-wide. */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-5">
        {survey.event_id && survey.events ? (
          <>
            <h2 className="font-semibold text-gray-900 mb-1">Email attendees</h2>
            <p className="text-sm text-gray-500 mb-3">
              Send this survey directly to everyone who was checked in at{" "}
              <strong>{survey.events.title}</strong>.
            </p>
            <EmailAttendeesButton
              surveyId={id}
              audience="event"
              audienceLabel={`who attended ${survey.events.title}`}
              audienceCount={audienceCount}
              previousSendCount={previousBroadcastCount}
            />
          </>
        ) : (
          <>
            <h2 className="font-semibold text-gray-900 mb-1">
              Email Growing Together families
            </h2>
            <p className="text-sm text-gray-500 mb-3">
              This survey isn&apos;t tied to a specific event, so there&apos;s
              nobody checked in. You can still send it to{" "}
              <strong>everyone who&apos;s attended any Growing Together session</strong>.
            </p>
            <EmailAttendeesButton
              surveyId={id}
              audience="gt_all"
              audienceLabel="who've attended any Growing Together session"
              audienceCount={audienceCount}
              previousSendCount={previousBroadcastCount}
            />
          </>
        )}
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
