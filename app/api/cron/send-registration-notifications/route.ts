import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import { registrationOpenEmail } from "@/lib/email/templates";
import type { Event, EventNotification } from "@/lib/supabase/types";

// Vercel cron jobs require a GET handler
export async function GET(request: NextRequest) {
  // Verify the request is from Vercel cron (production) or is authorized
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // In production, verify the cron secret
  if (process.env.NODE_ENV === "production" && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const supabase = createAdminClient();
    const now = new Date();

    // Find events where:
    // - status is 'published'
    // - publish_at is in the past (registration just opened)
    // - publish_at is within the last 10 minutes (to avoid re-sending)
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    const { data: eventsData, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .eq("status", "published")
      .lte("publish_at", now.toISOString())
      .gte("publish_at", tenMinutesAgo.toISOString());

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
      throw eventsError;
    }

    const events = (eventsData as Event[] | null) || [];

    if (events.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No events with newly opened registration",
        processed: 0,
      });
    }

    console.log(`Found ${events.length} events with newly opened registration`);

    const resend = getResendClient();
    let totalNotified = 0;
    let totalFailed = 0;

    for (const event of events) {
      // Get all pending notifications for this event
      const { data: notificationsData, error: notifError } = await supabase
        .from("event_notifications")
        .select("*")
        .eq("event_id", event.id)
        .is("notified_at", null);

      if (notifError) {
        console.error(`Error fetching notifications for event ${event.id}:`, notifError);
        continue;
      }

      const notifications = (notificationsData as EventNotification[] | null) || [];

      if (notifications.length === 0) {
        console.log(`No pending notifications for event: ${event.title}`);
        continue;
      }

      console.log(`Sending ${notifications.length} notifications for event: ${event.title}`);

      // Send emails to each subscriber
      for (const notification of notifications) {
        try {
          const emailData = registrationOpenEmail(
            notification.name,
            notification.email,
            event
          );

          if (resend) {
            const { error: sendError } = await resend.emails.send({
              from: FROM_EMAIL,
              to: notification.email,
              replyTo: REPLY_TO_EMAIL,
              subject: emailData.subject,
              html: emailData.html,
            });

            if (sendError) {
              console.error(`Failed to send to ${notification.email}:`, sendError);
              totalFailed++;
              continue;
            }
          } else {
            console.log(`[DEV] Would send email to ${notification.email}`);
          }

          // Mark as notified
          const { error: updateError } = await supabase
            .from("event_notifications")
            .update({ notified_at: now.toISOString() })
            .eq("id", notification.id);

          if (updateError) {
            console.error(`Error updating notification ${notification.id}:`, updateError);
          }

          // Log the email
          await supabase.from("email_logs").insert({
            event_id: event.id,
            email_type: "registration_open_notification",
            recipient_email: notification.email,
            subject: emailData.subject,
            sent_at: now.toISOString(),
            status: "sent",
          });

          totalNotified++;
        } catch (err) {
          console.error(`Error processing notification ${notification.id}:`, err);
          totalFailed++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${events.length} events`,
      notified: totalNotified,
      failed: totalFailed,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cron job failed" },
      { status: 500 }
    );
  }
}

// Also allow POST for manual triggering (useful for testing)
export async function POST(request: NextRequest) {
  return GET(request);
}
