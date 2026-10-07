"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getResendClient,
  FROM_EMAIL,
  REPLY_TO_EMAIL,
} from "@/lib/email/resend";
import { surveyInviteEmail } from "@/lib/email/portal-templates";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://evolutionimpactinitiative.co.uk";

type Attendee = {
  registrationId: string;
  name: string;
  email: string;
};

export type BroadcastAudience = "event" | "gt_all";

async function requireTeamMember() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tm } = await (admin as any)
    .from("team_members")
    .select("id, name, email")
    .eq("email", user.email || "")
    .maybeSingle();
  if (!tm) throw new Error("Team members only");
  return tm as { id: string; name: string; email: string };
}

// Resolves distinct attendee registrations for an event. A registration
// counts as "attended" when EITHER:
//   • registrations.attended = 'yes'  (legacy / per-reg flag), OR
//   • any registration_children.attended = true  (GT per-child check-in)
// We dedupe by registration id to avoid double emails if an admin ever
// has both flags set.
async function fetchAttendees(eventId: string): Promise<Attendee[]> {
  const admin = createAdminClient();

  // Shape: registration + all its children, filter attendees in JS so we
  // can OR across the two signals in a single pass.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from("registrations")
    .select(
      `id, parent_name, parent_email, attended, status,
       registration_children (id, attended)`,
    )
    .eq("event_id", eventId)
    .neq("status", "cancelled");

  type Row = {
    id: string;
    parent_name: string;
    parent_email: string;
    attended: string | null;
    status: string;
    registration_children: { id: string; attended: boolean | null }[] | null;
  };
  const rows = (data as Row[] | null) ?? [];
  const out: Attendee[] = [];
  const seen = new Set<string>();

  for (const r of rows) {
    const regYes = r.attended === "yes";
    const anyChild = (r.registration_children ?? []).some(
      (c) => c.attended === true,
    );
    if (!regYes && !anyChild) continue;
    const emailKey = (r.parent_email || "").toLowerCase().trim();
    if (!emailKey) continue;
    if (seen.has(emailKey)) continue;
    seen.add(emailKey);
    out.push({
      registrationId: r.id,
      name: r.parent_name,
      email: r.parent_email,
    });
  }
  return out;
}

// Everyone who has ever attended a Growing Together session, deduped
// by lowercased parent_email. Used by surveys not tied to a specific
// event (programme-wide check-ins, annual retrospectives, etc.).
async function fetchGtAttendees(): Promise<Attendee[]> {
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from("registrations")
    .select(
      `id, parent_name, parent_email, attended, status,
       events!inner (id, programme),
       registration_children (id, attended)`,
    )
    .eq("events.programme", "growing_together")
    .neq("status", "cancelled");

  type Row = {
    id: string;
    parent_name: string;
    parent_email: string;
    attended: string | null;
    status: string;
    events: { id: string; programme: string | null };
    registration_children: { id: string; attended: boolean | null }[] | null;
  };
  const rows = (data as Row[] | null) ?? [];
  const out: Attendee[] = [];
  const seen = new Set<string>();

  for (const r of rows) {
    const regYes = r.attended === "yes";
    const anyChild = (r.registration_children ?? []).some(
      (c) => c.attended === true,
    );
    if (!regYes && !anyChild) continue;
    const emailKey = (r.parent_email || "").toLowerCase().trim();
    if (!emailKey) continue;
    if (seen.has(emailKey)) continue;
    seen.add(emailKey);
    out.push({
      registrationId: r.id,
      name: r.parent_name,
      email: r.parent_email,
    });
  }
  return out;
}

// Preview numbers for the UI — attendee count + how many times this
// survey has previously been broadcast (via email_logs).
export async function surveyBroadcastStats(surveyId: string): Promise<{
  attendeeCount: number;
  previousSendCount: number;
}> {
  await requireTeamMember();
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: survey } = await (admin as any)
    .from("surveys")
    .select("id, event_id")
    .eq("id", surveyId)
    .maybeSingle();

  const attendeeCount = survey?.event_id
    ? (await fetchAttendees(survey.event_id)).length
    : 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: previousSendCount } = await (admin as any)
    .from("email_logs")
    .select("id", { count: "exact", head: true })
    .eq("email_type", "survey_broadcast")
    .eq("survey_id", surveyId);

  return {
    attendeeCount,
    previousSendCount: previousSendCount ?? 0,
  };
}

export async function emailSurveyToAttendees(
  surveyId: string,
  audience: BroadcastAudience = "event",
): Promise<{
  sent: number;
  failed: number;
  skipped: number;
  attempted: number;
}> {
  await requireTeamMember();
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: survey } = await (admin as any)
    .from("surveys")
    .select("id, title, event_id, is_active, events (id, title)")
    .eq("id", surveyId)
    .maybeSingle();

  if (!survey) throw new Error("Survey not found");
  if (!survey.is_active) {
    throw new Error("Survey is inactive — activate it first so the public link works.");
  }

  let attendees: Attendee[] = [];
  let eventTitle: string | null = null;
  let logEventId: string | null = null;

  if (audience === "event") {
    if (!survey.event_id) {
      throw new Error("This survey isn't linked to an event — no attendees to email.");
    }
    attendees = await fetchAttendees(survey.event_id);
    eventTitle = survey.events?.title ?? null;
    logEventId = survey.event_id;
  } else {
    // gt_all — everyone who has attended any Growing Together session.
    attendees = await fetchGtAttendees();
    eventTitle = null; // keep the subject generic for a programme-wide blast
  }

  if (attendees.length === 0) {
    return { sent: 0, failed: 0, skipped: 0, attempted: 0 };
  }

  const surveyUrl = `${BASE_URL}/feedback/${surveyId}`;
  const resend = getResendClient();

  let sent = 0;
  let failed = 0;

  for (const a of attendees) {
    const firstName = a.name.split(/\s+/)[0] || a.name;
    const { subject, html } = surveyInviteEmail({
      parentName: firstName,
      surveyTitle: survey.title,
      eventTitle,
      surveyUrl,
    });

    if (!resend) {
      // No Resend key configured (local dev) — count the send but log
      // the payload so you can eyeball what would have shipped.
      console.log(`[dev] would send to ${a.email}: ${subject}`);
      sent++;
      continue;
    }

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: a.email,
        replyTo: REPLY_TO_EMAIL,
        subject,
        html,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from("email_logs").insert({
        recipient_email: a.email,
        email_type: "survey_broadcast",
        subject,
        status: "sent",
        survey_id: surveyId,
        event_id: logEventId,
      });
      sent++;
    } catch (err) {
      console.error("survey broadcast failed:", err);
      failed++;
    }
  }

  revalidatePath(`/admin/surveys/${surveyId}`);
  return { sent, failed, skipped: 0, attempted: attendees.length };
}

// Count distinct GT attendees for the UI preview on unlinked surveys.
export async function gtAttendeeCount(): Promise<number> {
  await requireTeamMember();
  return (await fetchGtAttendees()).length;
}
