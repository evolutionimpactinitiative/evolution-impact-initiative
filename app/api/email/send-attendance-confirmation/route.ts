import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import { attendanceConfirmationEmail } from "@/lib/email/templates";
import type { Event, Registration, RegistrationChild } from "@/lib/supabase/types";

type RegistrationWithChildren = Registration & {
  registration_children: RegistrationChild[];
};

// This endpoint can be called by a cron job (e.g., Vercel Cron)
// GET /api/email/send-attendance-confirmation - sends 72h confirmation emails for upcoming events
// POST /api/email/send-attendance-confirmation - manually trigger for a specific event

export async function GET() {
  try {
    const supabase = await createClient();
    const resend = getResendClient();

    if (!resend) {
      return NextResponse.json({ message: "Email not configured", sent: 0 });
    }

    const now = new Date();
    const in72Hours = new Date(now.getTime() + 72 * 60 * 60 * 1000);
    const in73Hours = new Date(now.getTime() + 73 * 60 * 60 * 1000);

    // Find events happening in ~72 hours (3 days)
    const { data: eventsData } = await supabase
      .from("events")
      .select("*")
      .eq("status", "published")
      .gte("date", in72Hours.toISOString().split("T")[0])
      .lte("date", in73Hours.toISOString().split("T")[0]);

    const events = (eventsData as Event[] | null) || [];
    let totalSent = 0;

    for (const event of events) {
      // Check if event is actually within 72-73 hours
      const eventDateTime = new Date(`${event.date}T${event.start_time}`);
      const hoursUntil = (eventDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntil < 71 || hoursUntil > 73) continue;

      // Check if we already sent attendance confirmations for this event
      const { data: existingEmails } = await supabase
        .from("email_logs")
        .select("id")
        .eq("event_id", event.id)
        .eq("email_type", "attendance_confirmation")
        .limit(1);

      if (existingEmails && existingEmails.length > 0) continue;

      // Get confirmed registrations that haven't already confirmed attendance
      const { data: registrationsData } = await supabase
        .from("registrations")
        .select(`*, registration_children (*)`)
        .eq("event_id", event.id)
        .eq("status", "confirmed");

      const registrations = (registrationsData as RegistrationWithChildren[] | null) || [];

      for (const reg of registrations) {
        // Skip if already confirmed attendance
        if (reg.attendance_confirmed) continue;

        const emailData = attendanceConfirmationEmail(reg, event);

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
            event_id: event.id,
            email_type: "attendance_confirmation",
            recipient_email: reg.parent_email,
            subject: emailData.subject,
            sent_at: new Date().toISOString(),
            status: error ? "failed" : "sent",
            error_message: error?.message,
          });

          if (!error) totalSent++;
        } catch (err) {
          console.error(`Failed to send attendance confirmation to ${reg.parent_email}:`, err);
        }
      }
    }

    return NextResponse.json({ success: true, sent: totalSent });
  } catch (error) {
    console.error("Attendance confirmation error:", error);
    return NextResponse.json({ error: "Failed to send attendance confirmations" }, { status: 500 });
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

    // Get confirmed registrations
    const { data: registrationsData } = await supabase
      .from("registrations")
      .select(`*, registration_children (*)`)
      .eq("event_id", eventId)
      .eq("status", "confirmed");

    const registrations = (registrationsData as RegistrationWithChildren[] | null) || [];

    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;

    for (const reg of registrations) {
      // Skip if already confirmed attendance
      if (reg.attendance_confirmed) {
        skippedCount++;
        continue;
      }

      const emailData = attendanceConfirmationEmail(reg, event);

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
          event_id: event.id,
          email_type: "attendance_confirmation",
          recipient_email: reg.parent_email,
          subject: emailData.subject,
          sent_at: new Date().toISOString(),
          status: error ? "failed" : "sent",
          error_message: error?.message,
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
      skipped: skippedCount,
      total: registrations.length,
    });
  } catch (error) {
    console.error("Manual attendance confirmation error:", error);
    return NextResponse.json({ error: "Failed to send attendance confirmations" }, { status: 500 });
  }
}
