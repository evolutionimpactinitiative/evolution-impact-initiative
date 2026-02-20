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
// Always use production URL for logo (so it works in email clients)
const LOGO_URL = "https://evolutionimpactinitiative.co.uk/logos/evolution_full_logo_2.png";

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
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Event: ${event.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f6f8;">
  <center style="width: 100%; background-color: #f4f6f8;">
    <div style="max-width: 600px; margin: 0 auto;">

      <!-- Logo Section -->
      <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding: 30px 20px; text-align: center;">
            <a href="${BASE_URL}" style="text-decoration: none;">
              <img src="${LOGO_URL}" alt="Evolution Impact Initiative" width="220" style="display: block; margin: 0 auto; max-width: 220px; height: auto;" />
            </a>
          </td>
        </tr>
      </table>

      <!-- Main Content Card -->
      <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px;">
        <tr>
          <td style="padding: 0 20px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
              <tr>
                <td style="padding: 40px 30px;">

                  <!-- Heading -->
                  <h1 style="margin: 0 0 20px; font-family: 'Montserrat', sans-serif; font-size: 26px; color: ${BRAND.dark}; font-weight: 800; text-transform: uppercase; letter-spacing: -0.5px;">
                    New Event:<br><span style="color: ${BRAND.green};">${event.title}</span>
                  </h1>

                  <!-- Greeting -->
                  <p style="margin: 0 0 20px; font-size: 16px; line-height: 26px; color: #555555;">
                    Hi <strong>{{name}}</strong>,
                  </p>

                  <!-- Custom Message -->
                  <div style="margin: 0 0 25px; font-size: 16px; line-height: 1.7; color: #555555; white-space: pre-wrap;">${message}</div>

                  <!-- Event Details Box -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; border-radius: 12px; margin-bottom: 25px; border: 1px solid #e5e7eb;">
                    <tr>
                      <td style="padding: 25px;">
                        <h3 style="margin: 0 0 15px; font-size: 14px; color: ${BRAND.blue}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                          Event Details
                        </h3>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr>
                            <td style="padding-bottom: 12px; font-size: 14px; color: ${BRAND.dark};">
                              <strong>Date:</strong> ${eventDate}
                            </td>
                          </tr>
                          <tr>
                            <td style="padding-bottom: 12px; font-size: 14px; color: ${BRAND.dark};">
                              <strong>Time:</strong> ${event.start_time}${event.end_time ? ` - ${event.end_time}` : ""}
                            </td>
                          </tr>
                          <tr>
                            <td style="padding-bottom: ${event.cost ? "12px" : "0"}; font-size: 14px; color: ${BRAND.dark};">
                              <strong>Venue:</strong> ${event.venue_name}${event.venue_address ? `<br><span style="color: #666;">${event.venue_address}</span>` : ""}
                            </td>
                          </tr>
                          ${event.cost ? `
                          <tr>
                            <td style="font-size: 14px; color: ${BRAND.dark};">
                              <strong>Cost:</strong> ${event.cost}
                            </td>
                          </tr>
                          ` : ""}
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Register Button -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 30px auto;">
                    <tr>
                      <td style="border-radius: 8px; background: ${BRAND.green}; text-align: center;">
                        <a href="${registerUrl}" target="_blank" style="background: ${BRAND.green}; font-size: 16px; text-decoration: none; padding: 16px 40px; color: #ffffff; display: block; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-radius: 8px;">
                          Register Now
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Sign off -->
                  <p style="margin: 30px 0 0; font-size: 14px; color: ${BRAND.dark}; line-height: 1.6;">
                    Best wishes,<br>
                    <strong>The Evolution Impact Initiative Team</strong>
                  </p>

                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Footer -->
      <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding: 30px 20px; text-align: center;">
            <p style="margin: 0 0 10px; font-size: 13px; color: #666666;">
              <a href="${BASE_URL}" style="color: ${BRAND.blue}; text-decoration: none;">Visit our website</a>
              &nbsp;&nbsp;|&nbsp;&nbsp;
              <a href="${BASE_URL}/contact" style="color: ${BRAND.blue}; text-decoration: none;">Contact us</a>
            </p>
            <p style="margin: 0; font-size: 12px; color: #999999;">
              You're receiving this because you previously attended one of our events.<br>
              Evolution Impact Initiative CIC
            </p>
          </td>
        </tr>
      </table>

    </div>
  </center>
</body>
</html>
  `;
}
