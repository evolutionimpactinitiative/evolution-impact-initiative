import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import type { Event, Registration } from "@/lib/supabase/types";

export async function POST(request: NextRequest) {
  try {
    const { eventId, subject, message, recipientFilter } = await request.json();

    if (!eventId || !subject || !message) {
      return NextResponse.json(
        { error: "Event ID, subject, and message are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

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

    // Get registrations based on filter
    let query = supabase
      .from("registrations")
      .select("id, parent_name, parent_email, status")
      .eq("event_id", eventId);

    if (recipientFilter === "confirmed") {
      query = query.eq("status", "confirmed");
    } else if (recipientFilter === "waitlisted") {
      query = query.eq("status", "waitlisted");
    } else {
      // all - include confirmed and waitlisted
      query = query.in("status", ["confirmed", "waitlisted"]);
    }

    const { data: registrationsData } = await query;
    const registrations = (registrationsData as Registration[] | null) || [];

    if (registrations.length === 0) {
      return NextResponse.json(
        { error: "No recipients found matching the filter" },
        { status: 400 }
      );
    }

    const resend = getResendClient();
    if (!resend) {
      console.log("RESEND_API_KEY not set, skipping email send");
      return NextResponse.json({ success: true, skipped: true, count: registrations.length });
    }

    // Generate HTML email
    const htmlContent = generateUpdateEmail(event, message);

    // Send emails
    let successCount = 0;
    let failCount = 0;

    for (const reg of registrations) {
      try {
        const { data, error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: reg.parent_email,
          replyTo: REPLY_TO_EMAIL,
          subject: subject,
          html: htmlContent.replace("{{name}}", reg.parent_name),
        });

        if (error) {
          failCount++;
          // Log failed email
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from("email_logs").insert({
            registration_id: reg.id,
            email_type: "event_update",
            recipient_email: reg.parent_email,
            subject: subject,
            sent_at: new Date().toISOString(),
            status: "failed",
          });
        } else {
          successCount++;
          // Log successful email
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from("email_logs").insert({
            registration_id: reg.id,
            email_type: "event_update",
            recipient_email: reg.parent_email,
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
      total: registrations.length,
    });
  } catch (error) {
    console.error("Bulk email error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

function generateUpdateEmail(event: Event, message: string): string {
  const eventDate = new Date(event.date).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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
              <div style="background-color: ${BRAND.pale}; border-left: 4px solid ${BRAND.blue}; padding: 15px; margin-bottom: 25px;">
                <p style="margin: 0; color: ${BRAND.blue}; font-size: 14px; font-weight: 600;">
                  Update for: ${event.title}
                </p>
                <p style="margin: 5px 0 0 0; color: ${BRAND.dark}; font-size: 13px;">
                  ${eventDate} at ${event.start_time}
                </p>
              </div>

              <p style="margin: 0 0 20px 0; color: ${BRAND.dark}; font-size: 16px; line-height: 1.6;">
                Hi {{name}},
              </p>

              <div style="margin: 0 0 25px 0; color: ${BRAND.dark}; font-size: 16px; line-height: 1.7; white-space: pre-wrap;">
${message}
              </div>

              <div style="background-color: ${BRAND.pale}; border-radius: 8px; padding: 20px; margin-top: 25px;">
                <p style="margin: 0 0 10px 0; color: ${BRAND.blue}; font-size: 14px; font-weight: bold;">
                  Event Details
                </p>
                <p style="margin: 0; color: ${BRAND.dark}; font-size: 14px; line-height: 1.6;">
                  ${eventDate}<br>
                  ${event.start_time}${event.end_time ? ` - ${event.end_time}` : ""}<br>
                  ${event.venue_name}${event.venue_address ? `, ${event.venue_address}` : ""}
                </p>
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
              <p style="margin: 0; font-size: 12px;">
                <a href="${BASE_URL}" style="color: ${BRAND.accent}; text-decoration: none;">Visit our website</a>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                <a href="${BASE_URL}/contact" style="color: ${BRAND.accent}; text-decoration: none;">Contact us</a>
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
