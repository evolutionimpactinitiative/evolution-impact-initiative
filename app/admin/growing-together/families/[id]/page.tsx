import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Mail, Phone, MapPin, MessageCircle, CheckCircle2, Star } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { params: Promise<{ id: string }> };

function ageFromDob(dob: string): string {
  const d = new Date(dob);
  const now = new Date();
  const months =
    (now.getFullYear() - d.getFullYear()) * 12 +
    (now.getMonth() - d.getMonth()) -
    (now.getDate() < d.getDate() ? 1 : 0);
  if (months < 12) return `${months} mo`;
  return `${Math.floor(months / 12)} y`;
}

export default async function AdminGtFamilyDetailPage({ params }: Props) {
  const { id: familyId } = await params;
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supa = admin as any;

  const [familyRes, carersRes, childrenRes, regsRes, baselineRes, feedbackRes] =
    await Promise.all([
      supa.from("families").select("*").eq("id", familyId).maybeSingle(),
      supa
        .from("parent_carers")
        .select("*")
        .eq("family_id", familyId)
        .order("is_primary", { ascending: false }),
      supa
        .from("children")
        .select("*")
        .eq("family_id", familyId)
        .is("archived_at", null)
        .order("date_of_birth", { ascending: true }),
      supa
        .from("registrations")
        .select(
          `id, status, attended, created_at, feedback_email_sent_at,
           events ( id, title, date, start_time, primary_difference ),
           registration_children ( id, child_name )`,
        )
        .eq("family_id", familyId)
        .order("created_at", { ascending: false }),
      supa
        .from("outcome_responses")
        .select("id, timepoint, score_raw, score_band, submitted_at")
        .eq("programme_strand", "growing_together")
        .order("submitted_at", { ascending: false }),
      supa
        .from("surveys")
        .select("id")
        .eq("title", "Growing Together — Post-session feedback")
        .maybeSingle(),
    ]);

  if (!familyRes.data) notFound();
  const family = familyRes.data as {
    id: string;
    postcode: string | null;
    preferred_contact_method: string | null;
    preferred_language: string | null;
    accessibility_requirements: string | null;
    photo_video_consent: boolean;
    created_at: string;
  };

  type Carer = {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    relationship_to_child: string | null;
    is_primary: boolean;
  };
  const carers = (carersRes.data as Carer[] | null) ?? [];

  type Child = {
    id: string;
    first_name: string;
    date_of_birth: string;
    allergies: string | null;
    accessibility_requirements: string | null;
    parent_notes: string | null;
  };
  const children = (childrenRes.data as Child[] | null) ?? [];

  type Reg = {
    id: string;
    status: string;
    attended: string | null;
    created_at: string;
    feedback_email_sent_at: string | null;
    events: { id: string; title: string; date: string; start_time: string | null; primary_difference: string | null } | null;
    registration_children: { id: string; child_name: string }[];
  };
  const regs = (regsRes.data as Reg[] | null) ?? [];

  const carerEmails = carers.map((c) => c.email.toLowerCase());

  // Baseline responses linked to this family via participant email
  type BaselineResp = { id: string; timepoint: string; score_raw: number | null; score_band: string | null; submitted_at: string };
  const allBaselines = (baselineRes.data as BaselineResp[] | null) ?? [];
  const familyBaselines: BaselineResp[] = [];
  if (carerEmails.length > 0) {
    const { data: participantIds } = await supa
      .from("outcome_participants")
      .select("id, email");
    const emailById = new Map<string, string>();
    for (const p of (participantIds as { id: string; email: string | null }[] | null) ?? []) {
      if (p.email) emailById.set(p.id, p.email.toLowerCase());
    }

    const { data: invRows } = await supa
      .from("outcome_invitations")
      .select("response_id, participant_id")
      .eq("programme_strand", "growing_together")
      .not("response_id", "is", null);
    const responseIdsForFamily = new Set<string>();
    for (const inv of (invRows as { response_id: string; participant_id: string | null }[] | null) ?? []) {
      const em = inv.participant_id ? emailById.get(inv.participant_id) : null;
      if (em && carerEmails.includes(em)) responseIdsForFamily.add(inv.response_id);
    }
    for (const r of allBaselines) {
      if (responseIdsForFamily.has(r.id)) familyBaselines.push(r);
    }
  }

  // Feedback responses submitted by any carer's email
  const feedbackSurveyId = feedbackRes.data?.id ?? null;
  let familyFeedback: { rating: number | null; submitted_at: string; event_title: string | null }[] = [];
  if (feedbackSurveyId && carerEmails.length > 0) {
    const { data: fbRows } = await supa
      .from("survey_responses")
      .select("answers, submitted_at, event_id")
      .eq("survey_id", feedbackSurveyId)
      .in("respondent_email", carerEmails);
    type FbRow = { answers: Record<string, unknown>; submitted_at: string; event_id: string | null };
    const rows = (fbRows as FbRow[] | null) ?? [];
    const eventIds = [...new Set(rows.map((r) => r.event_id).filter((x): x is string => !!x))];
    const eventTitles = new Map<string, string>();
    if (eventIds.length > 0) {
      const { data: evs } = await supa
        .from("events")
        .select("id, title")
        .in("id", eventIds);
      for (const e of (evs as { id: string; title: string }[] | null) ?? []) {
        eventTitles.set(e.id, e.title);
      }
    }
    familyFeedback = rows.map((r) => ({
      rating: typeof r.answers?.gt_rating === "number" ? (r.answers.gt_rating as number) : null,
      submitted_at: r.submitted_at,
      event_title: r.event_id ? eventTitles.get(r.event_id) ?? null : null,
    }));
  }

  const primary = carers.find((c) => c.is_primary) ?? carers[0];
  const attendedCount = regs.filter((r) => r.attended === "yes").length;

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <Link
          href="/admin/growing-together/families"
          className="inline-flex items-center gap-1.5 text-sm text-brand-blue hover:text-brand-dark mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to families
        </Link>
        <h1 className="font-heading font-black text-2xl lg:text-3xl text-brand-dark">
          {primary?.name ?? "Family"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Joined{" "}
          {new Date(family.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          {" · "}
          {children.length} {children.length === 1 ? "child" : "children"} ·{" "}
          {attendedCount} {attendedCount === 1 ? "session" : "sessions"} attended
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Family + primary carer */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 lg:p-6">
          <h2 className="font-heading font-bold text-lg text-brand-dark mb-3">
            Family contact
          </h2>
          <dl className="space-y-2 text-sm">
            {primary && (
              <>
                <div className="flex items-center gap-2 text-brand-dark">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{primary.email}</span>
                </div>
                {primary.phone && (
                  <div className="flex items-center gap-2 text-brand-dark">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{primary.phone}</span>
                  </div>
                )}
                {primary.relationship_to_child && (
                  <div className="text-gray-600 text-xs">
                    {primary.relationship_to_child.charAt(0).toUpperCase() +
                      primary.relationship_to_child.slice(1)}
                  </div>
                )}
              </>
            )}
            {family.postcode && (
              <div className="flex items-center gap-2 text-brand-dark">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{family.postcode}</span>
              </div>
            )}
            {family.preferred_contact_method && (
              <div className="flex items-center gap-2 text-gray-600 text-xs">
                <MessageCircle className="h-3.5 w-3.5 text-gray-400" />
                <span>Prefers {family.preferred_contact_method}</span>
              </div>
            )}
          </dl>
          {family.accessibility_requirements && (
            <div className="mt-4 p-3 bg-brand-pale/40 rounded-lg text-xs text-brand-dark">
              <p className="font-semibold mb-1">Accessibility</p>
              {family.accessibility_requirements}
            </div>
          )}
          {carers.length > 1 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Other carers
              </p>
              <ul className="space-y-1 text-sm text-brand-dark">
                {carers
                  .filter((c) => !c.is_primary)
                  .map((c) => (
                    <li key={c.id}>
                      {c.name} · {c.email}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>

        {/* Children */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 lg:p-6">
          <h2 className="font-heading font-bold text-lg text-brand-dark mb-3">
            Children
          </h2>
          {children.length === 0 ? (
            <p className="text-sm text-gray-500">No children on file.</p>
          ) : (
            <ul className="space-y-3">
              {children.map((c) => (
                <li key={c.id} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                  <div className="flex items-baseline justify-between">
                    <p className="font-medium text-brand-dark">{c.first_name}</p>
                    <span className="text-xs text-gray-500">{ageFromDob(c.date_of_birth)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Born {new Date(c.date_of_birth).toLocaleDateString("en-GB")}
                  </p>
                  {c.allergies && (
                    <p className="text-xs text-red-700 mt-1">
                      <span className="font-semibold">Allergies:</span> {c.allergies}
                    </p>
                  )}
                  {c.accessibility_requirements && (
                    <p className="text-xs text-brand-dark/70 mt-1">
                      <span className="font-semibold">Accessibility:</span>{" "}
                      {c.accessibility_requirements}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Registrations */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-heading font-bold text-lg text-brand-dark">Session history</h2>
        </div>
        {regs.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No registrations yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {regs.map((reg) => (
              <li key={reg.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-brand-blue flex-shrink-0" />
                    <p className="text-sm font-medium text-brand-dark truncate">
                      {reg.events?.title ?? "Session unknown"}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {reg.events
                      ? new Date(reg.events.date).toLocaleDateString("en-GB", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}{" "}
                    · {reg.registration_children.map((c) => c.child_name).join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      reg.status === "cancelled"
                        ? "bg-gray-100 text-gray-500"
                        : reg.status === "waitlisted"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-brand-green/10 text-brand-green"
                    }`}
                  >
                    {reg.status}
                  </span>
                  {reg.attended === "yes" && (
                    <span className="inline-flex items-center gap-1 text-xs text-brand-green">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      attended
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Outcomes + feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 lg:p-6">
          <h2 className="font-heading font-bold text-lg text-brand-dark mb-3">
            Baseline check-ins
          </h2>
          {familyBaselines.length === 0 ? (
            <p className="text-sm text-gray-500">Not submitted yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {familyBaselines.map((b) => (
                <li key={b.id} className="flex items-baseline justify-between">
                  <span className="text-brand-dark capitalize">{b.timepoint}</span>
                  <span className="text-gray-600 text-xs">
                    Score {b.score_raw ?? "—"}{" "}
                    {b.score_band ? `(${b.score_band})` : ""} ·{" "}
                    {new Date(b.submitted_at).toLocaleDateString("en-GB")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 lg:p-6">
          <h2 className="font-heading font-bold text-lg text-brand-dark mb-3">
            Post-session feedback
          </h2>
          {familyFeedback.length === 0 ? (
            <p className="text-sm text-gray-500">No feedback submitted.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {familyFeedback.map((f, i) => (
                <li key={i} className="flex items-baseline justify-between">
                  <span className="text-brand-dark truncate mr-2">
                    {f.event_title ?? "Session"}
                  </span>
                  <span className="text-gray-600 text-xs flex items-center gap-1 flex-shrink-0">
                    <Star className="h-3 w-3 text-yellow-500" />
                    {f.rating ?? "—"} · {new Date(f.submitted_at).toLocaleDateString("en-GB")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
