import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import { registrationOpenEmail } from "@/lib/email/templates";
import type { Event, EventNotification } from "@/lib/supabase/types";

// Clear all notifications for an event (for admin use)
export async function DELETE(request: NextRequest) {
  try {
    const { eventId } = await request.json();

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("event_notifications")
      .delete()
      .eq("event_id", eventId)
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: `Cleared ${data?.length || 0} notification(s)`,
      deleted: data?.length || 0,
    });
  } catch (error) {
    console.error("Clear notifications error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to clear notifications" },
      { status: 500 }
    );
  }
}

// Trigger instant notifications for an event when registration opens
export async function POST(request: NextRequest) {
  try {
    const { eventId } = await request.json();

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const now = new Date();

    // Get the event
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !eventData) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const event = eventData as Event;

    // Check if event is published and registration is open
    // Registration is open if: status is 'published' AND (publish_at is null OR publish_at <= now)
    const publishAt = event.publish_at ? new Date(event.publish_at) : null;
    const isRegistrationOpen = event.status === "published" && (!publishAt || publishAt <= now);

    if (!isRegistrationOpen) {
      return NextResponse.json({
        success: true,
        message: "Registration not yet open, no notifications sent",
        notified: 0,
      });
    }

    // Get all pending notifications for this event (not yet notified)
    const { data: notificationsData, error: notifError } = await supabase
      .from("event_notifications")
      .select("*")
      .eq("event_id", eventId)
      .is("notified_at", null);

    if (notifError) {
      console.error("Error fetching notifications:", notifError);
      throw notifError;
    }

    const notifications = (notificationsData as EventNotification[] | null) || [];

    if (notifications.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No pending notifications to send",
        notified: 0,
      });
    }

    console.log(`Sending ${notifications.length} instant notifications for event: ${event.title}`);

    const resend = getResendClient();
    let totalNotified = 0;
    let totalFailed = 0;

    // Process notifications in batches to avoid rate limits
    const BATCH_SIZE = 10;
    for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
      const batch = notifications.slice(i, i + BATCH_SIZE);

      // Send batch in parallel
      await Promise.all(
        batch.map(async (notification) => {
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
                return;
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
        })
      );

      // Small delay between batches to respect rate limits
      if (i + BATCH_SIZE < notifications.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${totalNotified} notification${totalNotified !== 1 ? "s" : ""}`,
      notified: totalNotified,
      failed: totalFailed,
    });
  } catch (error) {
    console.error("Trigger notifications error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to trigger notifications" },
      { status: 500 }
    );
  }
}
