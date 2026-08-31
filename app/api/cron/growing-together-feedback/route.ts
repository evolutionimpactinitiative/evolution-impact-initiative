import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import { portalSessionFeedbackEmail } from "@/lib/email/portal-templates";

// Daily cron: for each attended Growing Together registration whose
// session ended ≥24h ago and hasn't had a feedback email yet, email the
// parent a link to the seeded post-session feedback survey.
//
// GET so it works with Vercel Cron. Auth via Bearer $CRON_SECRET in prod.

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://evolutionimpactinitiative.co.uk";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (process.env.NODE_ENV === "production" && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();

  // Look up the reusable GT feedback survey. If missing, that's a seed
  // problem — bail loudly so the cron doesn't silently no-op forever.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: survey } = await (admin as any)
    .from("surveys")
    .select("id, title")
    .eq("title", "Growing Together — Post-session feedback")
    .maybeSingle();

  if (!survey) {
    return NextResponse.json(
      { error: "Growing Together feedback survey not seeded" },
      { status: 500 },
    );
  }

  // Cutoff: session ended at least 24h ago.
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 1);
  const cutoffDate = cutoff.toISOString().slice(0, 10);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: regsRaw, error } = await (admin as any)
    .from("registrations")
    .select(
      `id, parent_name, parent_email, attended, feedback_email_sent_at,
       events!inner (id, title, date, programme)`,
    )
    .eq("attended", "yes")
    .is("feedback_email_sent_at", null)
    .not("family_id", "is", null)
    .eq("events.programme", "growing_together")
    .lte("events.date", cutoffDate);

  if (error) {
    console.error("GT feedback cron: fetch failed", error);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }

  type Row = {
    id: string;
    parent_name: string;
    parent_email: string;
    events: { id: string; title: string; date: string; programme: string | null };
  };
  const regs = (regsRaw as Row[] | null) ?? [];

  const resend = getResendClient();
  let sent = 0;
  let failed = 0;

  for (const reg of regs) {
    const url = `${BASE_URL}/feedback/${survey.id}`;
    const { subject, html } = portalSessionFeedbackEmail({
      name: reg.parent_name.split(/\s+/)[0] || reg.parent_name,
      sessionTitle: reg.events.title,
      url,
    });

    if (!resend) {
      // No API key — skip send but still mark so we don't spin on every run
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any)
        .from("registrations")
        .update({ feedback_email_sent_at: new Date().toISOString() })
        .eq("id", reg.id);
      sent++;
      continue;
    }

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: reg.parent_email,
        replyTo: REPLY_TO_EMAIL,
        subject,
        html,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from("email_logs").insert({
        recipient_email: reg.parent_email,
        email_type: "gt_post_session_feedback",
        subject,
        status: "sent",
        event_id: reg.events.id,
        registration_id: reg.id,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any)
        .from("registrations")
        .update({ feedback_email_sent_at: new Date().toISOString() })
        .eq("id", reg.id);
      sent++;
    } catch (err) {
      console.error("GT feedback email failed:", err);
      failed++;
    }
  }

  return NextResponse.json({
    ok: true,
    considered: regs.length,
    sent,
    failed,
  });
}
