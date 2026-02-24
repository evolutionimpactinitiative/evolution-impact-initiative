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
const LOGO_URL = `${BASE_URL}/logos/evolution_full_logo_1.png`;

function generateUpdateEmail(event: Event, message: string): string {
  const eventDate = new Date(event.date).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Event Update</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Montserrat:wght@600;700;800;900&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif; background-color: #f4f6f8;">
  <center style="width: 100%; background-color: #f4f6f8;">
    <div style="max-width: 600px; margin: 0 auto;">

      <!-- Logo -->
      <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding: 30px 20px; text-align: center;">
            <a href="${BASE_URL}" style="text-decoration: none;">
              <img src="${LOGO_URL}" alt="Evolution Impact Initiative" width="220" style="display: block; margin: 0 auto; max-width: 220px; height: auto;" />
            </a>
          </td>
        </tr>
      </table>

      <!-- Content -->
      <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="background-color: #ffffff; border-radius: 8px 8px 0 0; padding: 40px; text-align: center;">
            <h1 style="margin: 0 0 25px; font-family: 'Montserrat', sans-serif; font-size: 26px; color: ${BRAND.dark}; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px;">
              Event<br><span style="color: ${BRAND.blue};">Update</span>
            </h1>

            <!-- Update Badge -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 25px;">
              <tr>
                <td style="background-color: ${BRAND.blue}; border-radius: 50px; padding: 12px 24px; text-align: center;">
                  <span style="font-family: 'Montserrat', sans-serif; font-size: 14px; color: #ffffff; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                    ${event.title}
                  </span>
                </td>
              </tr>
            </table>

            <p style="margin: 0 0 20px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555; text-align: left;">
              Hi <strong>{{name}}</strong>,
            </p>

            <p style="margin: 0 0 25px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555; text-align: left; white-space: pre-wrap;">${message}</p>

            <!-- Event Details Box -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 25px;">
              <tr>
                <td style="padding: 25px; text-align: left;">
                  <h3 style="margin: 0 0 15px; font-family: 'Montserrat', sans-serif; font-size: 14px; color: ${BRAND.dark}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                    Event Details
                  </h3>
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td style="padding-bottom: 12px; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark};">
                        📅 ${eventDate}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 12px; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark};">
                        ⏰ ${event.start_time}${event.end_time ? ` – ${event.end_time}` : ""}
                      </td>
                    </tr>
                    <tr>
                      <td style="font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark};">
                        📍 ${event.venue_name}${event.venue_address ? `<br>${event.venue_address}` : ""}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin: 30px 0 0; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark}; line-height: 1.6; text-align: left;">
              Best wishes,<br>
              <strong>The Evolution Impact Initiative Team</strong>
            </p>
          </td>
        </tr>
      </table>

      <!-- Footer -->
      <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="border-top: 3px solid ${BRAND.blue}; padding: 30px; text-align: center;">
            <!-- Social Icons -->
            <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
              <tr>
                <td style="padding: 0 5px;">
                  <a href="https://www.facebook.com/share/1AhvjnBzca/?mibextid=wwXIfr" style="text-decoration: none;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width: 36px; height: 36px; background-color: #888888; border-radius: 50%; text-align: center; vertical-align: middle;">
                          <img src="https://img.icons8.com/ios-glyphs/30/FFFFFF/facebook-f.png" width="16" height="16" alt="Facebook" style="display: block; margin: 0 auto;" />
                        </td>
                      </tr>
                    </table>
                  </a>
                </td>
                <td style="padding: 0 5px;">
                  <a href="https://www.instagram.com/evolutionimpactinitiative" style="text-decoration: none;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width: 36px; height: 36px; background-color: #888888; border-radius: 50%; text-align: center; vertical-align: middle;">
                          <img src="https://img.icons8.com/ios-glyphs/30/FFFFFF/instagram-new--v1.png" width="16" height="16" alt="Instagram" style="display: block; margin: 0 auto;" />
                        </td>
                      </tr>
                    </table>
                  </a>
                </td>
                <td style="padding: 0 5px;">
                  <a href="https://www.linkedin.com/company/evolution-impact-initiative-cic/" style="text-decoration: none;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width: 36px; height: 36px; background-color: #888888; border-radius: 50%; text-align: center; vertical-align: middle;">
                          <img src="https://img.icons8.com/ios-glyphs/30/FFFFFF/linkedin-2--v1.png" width="16" height="16" alt="LinkedIn" style="display: block; margin: 0 auto;" />
                        </td>
                      </tr>
                    </table>
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin: 0 0 5px; font-family: 'Montserrat', sans-serif; font-size: 14px; color: #555555; font-weight: 600;">Evolution Impact Initiative CIC</p>
            <p style="margin: 0 0 10px; font-family: 'Inter', sans-serif; font-size: 12px; color: #888888;">86 King Street, Rochester, Kent, ME1 1YD</p>
            <p style="margin: 0 0 15px; font-family: 'Inter', sans-serif; font-size: 11px; color: #aaaaaa;">
              Company No. 16667870 | Registered in England & Wales
            </p>
            <p style="margin: 0; font-size: 12px;">
              <a href="${BASE_URL}" style="color: ${BRAND.blue}; text-decoration: underline;">Visit Website</a>
            </p>
          </td>
        </tr>
      </table>

      <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr><td height="30">&nbsp;</td></tr>
      </table>
    </div>
  </center>
</body>
</html>
  `;
}
