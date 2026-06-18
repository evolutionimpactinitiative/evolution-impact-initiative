import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import { festivalSevenDayReminderEmail } from "@/lib/email/festival-templates";
import { FESTIVAL_SLUG } from "@/lib/festival";
import type { Event, Registration } from "@/lib/supabase/types";

const REMINDER_DAYS = 7;
const REMINDER_EMAIL_TYPE = "festival_reminder_7d";

type RegistrationWithRelations = Registration & {
  registration_children: { id: string }[];
  registration_attendees: { id: string }[];
};

export async function GET(request: NextRequest) {
  // Verify cron secret in production
  const cronSecret = process.env.CRON_SECRET;
  if (process.env.NODE_ENV === "production" && cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return runReminders();
}

export async function POST(request: NextRequest) {
  // Same handler — allows manual triggering from admin tools
  return GET(request);
}

async function runReminders() {
  const supabase = createAdminClient();
  const now = new Date();

  // Find the festival event
  const { data: eventRow } = await supabase
    .from("events")
    .select("*")
    .eq("slug", FESTIVAL_SLUG)
    .maybeSingle();

  const event = eventRow as Event | null;
  if (!event) {
    return NextResponse.json({
      success: true,
      message: "Festival event not found — nothing to do",
    });
  }

  // Compute days until the festival
  const eventDay = new Date(`${event.date}T00:00:00`);
  const todayMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const daysUntil = Math.round(
    (eventDay.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Only fire in a ±1-day window around 7 days out, so the daily cron can hit it
  if (daysUntil < REMINDER_DAYS - 1 || daysUntil > REMINDER_DAYS + 1) {
    return NextResponse.json({
      success: true,
      message: `Today is ${daysUntil} days from festival — outside the 7d window`,
      daysUntil,
    });
  }

  // Load confirmed registrations for the festival, with attendee counts
  const { data: regs } = await supabase
    .from("registrations")
    .select(
      `*, registration_children (id), registration_attendees (id)`,
    )
    .eq("event_id", event.id)
    .eq("status", "confirmed");

  const registrations = (regs as RegistrationWithRelations[] | null) ?? [];

  if (registrations.length === 0) {
    return NextResponse.json({
      success: true,
      message: "No confirmed registrations",
      daysUntil,
    });
  }

  // Find which have already been sent the 7d reminder
  const regIds = registrations.map((r) => r.id);
  const { data: already } = await supabase
    .from("email_logs")
    .select("registration_id")
    .eq("email_type", REMINDER_EMAIL_TYPE)
    .in("registration_id", regIds);

  const alreadySent = new Set(
    (already ?? []).map((row) => (row as { registration_id: string }).registration_id),
  );

  const toSend = registrations.filter((r) => !alreadySent.has(r.id));

  if (toSend.length === 0) {
    return NextResponse.json({
      success: true,
      message: "All confirmed registrations already reminded",
      daysUntil,
    });
  }

  const resend = getResendClient();
  let sent = 0;
  let failed = 0;

  for (const reg of toSend) {
    const ticketCount =
      1 +
      (reg.registration_children?.length ?? 0) +
      (reg.registration_attendees?.length ?? 0);

    const emailData = festivalSevenDayReminderEmail({
      registration: { parent_name: reg.parent_name },
      daysUntil,
      ticketCount,
    });

    try {
      if (resend) {
        const { error: sendErr, data: sendRes } = await resend.emails.send({
          from: FROM_EMAIL,
          to: reg.parent_email,
          replyTo: REPLY_TO_EMAIL,
          subject: emailData.subject,
          html: emailData.html,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("email_logs").insert({
          registration_id: reg.id,
          event_id: event.id,
          email_type: REMINDER_EMAIL_TYPE,
          recipient_email: reg.parent_email,
          subject: emailData.subject,
          sent_at: new Date().toISOString(),
          status: sendErr ? "failed" : "sent",
          resend_id: sendRes?.id,
        });

        if (sendErr) failed++;
        else sent++;
      } else {
        console.log(
          `[festival-reminders] DEV — would email ${reg.parent_email} (${ticketCount} tickets)`,
        );
        sent++;
      }
    } catch (err) {
      console.error(`[festival-reminders] error for ${reg.id}:`, err);
      failed++;
    }
  }

  return NextResponse.json({
    success: true,
    daysUntil,
    eligible: toSend.length,
    sent,
    failed,
  });
}
