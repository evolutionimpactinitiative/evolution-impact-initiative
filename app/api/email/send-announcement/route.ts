import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import type { Event } from "@/lib/supabase/types";

// Brand colors
const BRAND = {
  blue: "#17559D",
  green: "#31B67D",
  accent: "#31FDA5",
  pale: "#DCECFF",
  dark: "#1E1E1E",
};

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://evolutionimpactinitiative.co.uk";
const LOGO_URL = `${BASE_URL}/logos/evolution_full_logo_2.svg`;

export async function POST(request: NextRequest) {
  try {
    const { eventId, sourceEventIds, excludedEmails, subject, message } = await request.json();

    if (!eventId || !sourceEventIds || !subject || !message) {
      return NextResponse.json(
        { error: "Event ID, source events, subject, and message are required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(sourceEventIds) || sourceEventIds.length === 0) {
      return NextResponse.json(
        { error: "At least one source event must be selected" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get the new event details
    const { data: eventData } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    const event = eventData as Event | null;
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get registrations from source events (past events)
    const { data: pastRegistrations } = await supabase
      .from("registrations")
      .select("parent_name, parent_email")
      .in("event_id", sourceEventIds)
      .in("status", ["confirmed", "waitlisted"]);

    if (!pastRegistrations || pastRegistrations.length === 0) {
      return NextResponse.json(
        { error: "No registrations found in selected events" },
        { status: 400 }
      );
    }

    // Get current registrations for the new event (to exclude)
    const { data: currentRegistrations } = await supabase
      .from("registrations")
      .select("parent_email")
      .eq("event_id", eventId)
      .in("status", ["confirmed", "waitlisted"]);

    // Build exclusion sets
    const currentEmails = new Set(
      currentRegistrations?.map((r) => r.parent_email.toLowerCase()) || []
    );
    const manuallyExcluded = new Set(
      (excludedEmails || []).map((e: string) => e.toLowerCase())
    );

    // Deduplicate emails and exclude those already registered or manually excluded
    const uniqueRecipients = new Map<string, { name: string; email: string }>();
    pastRegistrations.forEach((r) => {
      const email = r.parent_email.toLowerCase();
      if (
        !currentEmails.has(email) &&
        !manuallyExcluded.has(email) &&
        !uniqueRecipients.has(email)
      ) {
        uniqueRecipients.set(email, {
          name: r.parent_name,
          email: r.parent_email,
        });
      }
    });

    const recipients = Array.from(uniqueRecipients.values());

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "All past attendees are already registered for this event" },
        { status: 400 }
      );
    }

    const resend = getResendClient();
    if (!resend) {
      console.log("RESEND_API_KEY not set, skipping email send");
      return NextResponse.json({
        success: true,
        skipped: true,
        count: recipients.length,
      });
    }

    // Generate HTML email
    const htmlContent = generateAnnouncementEmail(event, message);

    // Send emails
    let successCount = 0;
    let failCount = 0;

    for (const recipient of recipients) {
      try {
        const personalizedHtml = htmlContent.replace(/{{name}}/g, recipient.name);

        const { data, error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: recipient.email,
          replyTo: REPLY_TO_EMAIL,
          subject: subject,
          html: personalizedHtml,
        });

        if (error) {
          failCount++;
          await supabase.from("email_logs").insert({
            event_id: eventId,
            email_type: "event_announcement",
            recipient_email: recipient.email,
            subject: subject,
            sent_at: new Date().toISOString(),
            status: "failed",
          });
        } else {
          successCount++;
          await supabase.from("email_logs").insert({
            event_id: eventId,
            email_type: "event_announcement",
            recipient_email: recipient.email,
            subject: subject,
            sent_at: new Date().toISOString(),
            status: "sent",
            resend_id: data?.id,
          });
        }
      } catch {
        failCount++;
      }
    }

    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: failCount,
      total: recipients.length,
    });
  } catch (error) {
    console.error("Announcement email error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to preview recipients
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const sourceEventIds = searchParams.get("sourceEventIds")?.split(",").filter(Boolean);

    if (!eventId || !sourceEventIds || sourceEventIds.length === 0) {
      return NextResponse.json({ count: 0, recipients: [] });
    }

    const supabase = createAdminClient();

    // Get registrations from source events
    const { data: pastRegistrations } = await supabase
      .from("registrations")
      .select("parent_name, parent_email")
      .in("event_id", sourceEventIds)
      .in("status", ["confirmed", "waitlisted"]);

    // Get current registrations for the new event
    const { data: currentRegistrations } = await supabase
      .from("registrations")
      .select("parent_email")
      .eq("event_id", eventId)
      .in("status", ["confirmed", "waitlisted"]);

    // Deduplicate and exclude
    const currentEmails = new Set(
      currentRegistrations?.map((r) => r.parent_email.toLowerCase()) || []
    );

    const uniqueRecipients = new Map<string, { name: string; email: string }>();
    pastRegistrations?.forEach((r) => {
      const email = r.parent_email.toLowerCase();
      if (!currentEmails.has(email) && !uniqueRecipients.has(email)) {
        uniqueRecipients.set(email, {
          name: r.parent_name,
          email: r.parent_email,
        });
      }
    });

    const recipients = Array.from(uniqueRecipients.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return NextResponse.json({ count: recipients.length, recipients });
  } catch (error) {
    console.error("Recipient count error:", error);
    return NextResponse.json({ count: 0, recipients: [] });
  }
}

function generateAnnouncementEmail(event: Event, message: string): string {
  const eventDate = new Date(event.date).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const registerUrl = `${BASE_URL}/events/${event.slug}/register`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: ${BRAND.pale};">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background-color: ${BRAND.dark}; padding: 30px; text-align: center;">
              <img src="${LOGO_URL}" alt="Evolution Impact Initiative" style="height: 50px; width: auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h1 style="margin: 0 0 20px 0; color: ${BRAND.blue}; font-size: 24px; font-weight: bold;">
                New Event: ${event.title}
              </h1>

              <p style="margin: 0 0 20px 0; color: ${BRAND.dark}; font-size: 16px; line-height: 1.6;">
                Hi {{name}},
              </p>

              <div style="margin: 0 0 25px 0; color: ${BRAND.dark}; font-size: 16px; line-height: 1.7; white-space: pre-wrap;">${message}</div>

              <div style="background-color: ${BRAND.pale}; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <p style="margin: 0 0 15px 0; color: ${BRAND.blue}; font-size: 14px; font-weight: bold;">
                  Event Details
                </p>
                <table style="width: 100%; font-size: 14px; color: ${BRAND.dark};">
                  <tr>
                    <td style="padding: 5px 0; width: 80px; vertical-align: top;"><strong>Date:</strong></td>
                    <td style="padding: 5px 0;">${eventDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; vertical-align: top;"><strong>Time:</strong></td>
                    <td style="padding: 5px 0;">${event.start_time}${event.end_time ? ` - ${event.end_time}` : ""}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; vertical-align: top;"><strong>Venue:</strong></td>
                    <td style="padding: 5px 0;">${event.venue_name}${event.venue_address ? `<br>${event.venue_address}` : ""}</td>
                  </tr>
                  ${event.cost ? `
                  <tr>
                    <td style="padding: 5px 0; vertical-align: top;"><strong>Cost:</strong></td>
                    <td style="padding: 5px 0;">${event.cost}</td>
                  </tr>
                  ` : ""}
                </table>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${registerUrl}" style="display: inline-block; background-color: ${BRAND.green}; color: #ffffff; font-size: 16px; font-weight: bold; text-decoration: none; padding: 15px 40px; border-radius: 8px;">
                  Register Now
                </a>
              </div>

              <p style="margin: 30px 0 0 0; color: ${BRAND.dark}; font-size: 14px;">
                Best wishes,<br>
                <strong>The Evolution Impact Initiative Team</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: ${BRAND.dark}; padding: 30px; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #ffffff; font-size: 14px; font-weight: bold;">
                Evolution Impact Initiative CIC
              </p>
              <p style="margin: 0 0 15px 0; font-size: 12px;">
                <a href="${BASE_URL}" style="color: ${BRAND.accent}; text-decoration: none;">Visit our website</a>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                <a href="${BASE_URL}/contact" style="color: ${BRAND.accent}; text-decoration: none;">Contact us</a>
              </p>
              <p style="margin: 0; color: #888888; font-size: 11px;">
                You're receiving this because you previously attended one of our events.<br>
                <a href="${BASE_URL}/contact" style="color: #888888;">Unsubscribe from future announcements</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
