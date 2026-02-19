import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import { eventReminderEmail } from "@/lib/email/templates";
import type { Event, Registration, RegistrationChild } from "@/lib/supabase/types";

type RegistrationWithChildren = Registration & {
  registration_children: RegistrationChild[];
};

// This endpoint can be called by a cron job (e.g., Vercel Cron)
// GET /api/email/send-reminders - sends reminders for events happening soon
// POST /api/email/send-reminders - manually trigger reminders for a specific event

export async function GET() {
  try {
    const supabase = await createClient();
    const resend = getResendClient();

    if (!resend) {
      return NextResponse.json({ message: "Email not configured", sent: 0 });
    }

    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Find events happening in ~24 hours that have reminders enabled
    const { data: eventsData } = await supabase
      .from("events")
      .select("*")
      .eq("status", "published")
      .eq("send_reminder_24h", true)
      .gte("date", now.toISOString().split("T")[0])
      .lte("date", in25Hours.toISOString().split("T")[0]);

    const events = (eventsData as Event[] | null) || [];
    let totalSent = 0;

    for (const event of events) {
      // Check if event is actually within 24-25 hours
      const eventDateTime = new Date(`${event.date}T${event.start_time}`);
      const hoursUntil = (eventDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntil < 23 || hoursUntil > 25) continue;

      // Check if we already sent reminders for this event today
      const { data: existingReminders } = await supabase
        .from("email_logs")
        .select("id")
        .eq("email_type", "event_reminder")
        .gte("sent_at", now.toISOString().split("T")[0])
        .limit(1);

      if (existingReminders && existingReminders.length > 0) continue;

      // Get confirmed registrations
      const { data: registrationsData } = await supabase
        .from("registrations")
        .select(`*, registration_children (*)`)
        .eq("event_id", event.id)
        .eq("status", "confirmed");

      const registrations = (registrationsData as RegistrationWithChildren[] | null) || [];

      for (const reg of registrations) {
        const emailData = eventReminderEmail(reg, event, hoursUntil);

        try {
          const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: reg.parent_email,
            replyTo: REPLY_TO_EMAIL,
            subject: emailData.subject,
            html: emailData.html,
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from("email_logs").insert({
            registration_id: reg.id,
            email_type: "event_reminder",
            recipient_email: reg.parent_email,
            subject: emailData.subject,
            sent_at: new Date().toISOString(),
            status: error ? "failed" : "sent",
            resend_id: data?.id,
          });

          if (!error) totalSent++;
        } catch {
          // Log error but continue
        }
      }
    }

    return NextResponse.json({ success: true, sent: totalSent });
  } catch (error) {
    console.error("Reminder error:", error);
    return NextResponse.json({ error: "Failed to send reminders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { eventId } = await request.json();

    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    const supabase = await createClient();
    const resend = getResendClient();

    if (!resend) {
      return NextResponse.json({ message: "Email not configured", sent: 0 });
    }

    // Get event
    const { data: eventData } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    const event = eventData as Event | null;
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Calculate hours until event
    const now = new Date();
    const eventDateTime = new Date(`${event.date}T${event.start_time}`);
    const hoursUntil = Math.max(0, (eventDateTime.getTime() - now.getTime()) / (1000 * 60 * 60));

    // Get confirmed registrations
    const { data: registrationsData } = await supabase
      .from("registrations")
      .select(`*, registration_children (*)`)
      .eq("event_id", eventId)
      .eq("status", "confirmed");

    const registrations = (registrationsData as RegistrationWithChildren[] | null) || [];

    let successCount = 0;
    let failCount = 0;

    for (const reg of registrations) {
      const emailData = eventReminderEmail(reg, event, hoursUntil);

      try {
        const { data, error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: reg.parent_email,
          replyTo: REPLY_TO_EMAIL,
          subject: emailData.subject,
          html: emailData.html,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("email_logs").insert({
          registration_id: reg.id,
          email_type: "event_reminder",
          recipient_email: reg.parent_email,
          subject: emailData.subject,
          sent_at: new Date().toISOString(),
          status: error ? "failed" : "sent",
          resend_id: data?.id,
        });

        if (error) failCount++;
        else successCount++;
      } catch {
        failCount++;
      }
    }

    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: failCount,
      total: registrations.length,
    });
  } catch (error) {
    console.error("Manual reminder error:", error);
    return NextResponse.json({ error: "Failed to send reminders" }, { status: 500 });
  }
}
