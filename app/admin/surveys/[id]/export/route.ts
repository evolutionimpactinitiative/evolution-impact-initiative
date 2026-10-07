import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// CSV export of all responses for a survey. One row per response. One
// column per question, keyed by question.id, with the question label
// as the header. Multi-select answers are joined with "; ".
//
// Team-members only. Filename includes the survey title so stacked
// downloads are easy to tell apart.

type SurveyQuestion = {
  id: string;
  text: string;
  type: "text" | "textarea" | "multiple_choice" | "multi_select" | "rating" | "number";
  options?: string[];
};

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s: string;
  if (Array.isArray(value)) s = value.join("; ");
  else if (typeof value === "object") s = JSON.stringify(value);
  else s = String(value);
  if (/[",\n\r]/.test(s)) {
    s = `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "survey";
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  // Team-only.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tm } = await (admin as any)
    .from("team_members")
    .select("id")
    .eq("email", user.email || "")
    .maybeSingle();
  if (!tm) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Load survey + responses in parallel.
  const [surveyRes, responsesRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from("surveys")
      .select("id, title, questions")
      .eq("id", id)
      .maybeSingle(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from("survey_responses")
      .select(
        "id, submitted_at, respondent_email, respondent_name, answers, event_id, registration_id",
      )
      .eq("survey_id", id)
      .order("submitted_at", { ascending: true }),
  ]);

  const survey = surveyRes.data as
    | { id: string; title: string; questions: SurveyQuestion[] }
    | null;
  if (!survey) {
    return NextResponse.json({ error: "Survey not found" }, { status: 404 });
  }
  type ResponseRow = {
    id: string;
    submitted_at: string;
    respondent_email: string;
    respondent_name: string | null;
    answers: Record<string, unknown>;
    event_id: string | null;
    registration_id: string | null;
  };
  const responses = (responsesRes.data as ResponseRow[] | null) ?? [];
  const questions = (survey.questions ?? []) as SurveyQuestion[];

  // Build the CSV.
  const headerFixed = ["Submitted at", "Respondent name", "Respondent email"];
  const headerQs = questions.map((q) => q.text);
  const header = [...headerFixed, ...headerQs].map(csvEscape).join(",");

  const rows = responses.map((r) => {
    const base = [
      new Date(r.submitted_at).toISOString(),
      r.respondent_name ?? "",
      r.respondent_email,
    ];
    const answerCells = questions.map((q) => csvEscape(r.answers?.[q.id]));
    return [...base.map(csvEscape), ...answerCells].join(",");
  });

  const csv = [header, ...rows].join("\n") + "\n";
  const filename = `survey-${slugify(survey.title)}-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
