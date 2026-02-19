import type { Event, Registration, RegistrationChild } from "@/lib/supabase/types";

type RegistrationWithChildren = Registration & {
  registration_children: RegistrationChild[];
};

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://evolutionimpactinitiative.co.uk";

// Always use production URL for logo (so it works in email clients during development)
const LOGO_URL = "https://evolutionimpactinitiative.co.uk/logos/evolution_full_logo_2.png";

// Brand colors
const BRAND = {
  blue: "#17559D",
  green: "#31B67D",
  accent: "#31FDA5",
  pale: "#DCECFF",
  dark: "#1E1E1E",
};

// Generate Google Calendar link
function generateCalendarLink(event: Event): string {
  const startDate = new Date(`${event.date}T${event.start_time}`);
  const endDate = event.end_time
    ? new Date(`${event.date}T${event.end_time}`)
    : new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours

  const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d{3}/g, "");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
    details: event.short_description,
    location: `${event.venue_name}, ${event.venue_address || ""}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Generate cancellation link
function generateCancellationLink(registrationId: string): string {
  // Simple token - in production you'd want something more secure
  const token = Buffer.from(`${registrationId}:${Date.now()}`).toString("base64");
  return `${BASE_URL}/cancel-registration?id=${registrationId}&token=${token}`;
}

// Generate attendance confirmation link
function generateAttendanceConfirmLink(registrationId: string, attending: "yes" | "no"): string {
  return `${BASE_URL}/confirm-attendance?id=${registrationId}&attending=${attending}`;
}

const emailWrapper = (content: string, heroImage?: string, accentColor: string = BRAND.green) => `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Evolution Impact Initiative</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Montserrat:wght@600;700;800;900&display=swap" rel="stylesheet">
    <style>
        body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif; background-color: #f4f6f8; }
        .button-primary:hover { background-color: ${BRAND.green} !important; }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif; background-color: #f4f6f8;">
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

            ${heroImage ? `
            <!-- Hero Image -->
            <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                    <td style="background-color: #ffffff; border-radius: 8px 8px 0 0; overflow: hidden; border-bottom: 4px solid ${accentColor};">
                        <img src="${heroImage}" width="600" alt="Event" style="width: 100%; max-width: 600px; height: auto; display: block;">
                    </td>
                </tr>
            </table>
            ` : ""}

            <!-- Main Content -->
            <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                    <td style="background-color: #ffffff; ${heroImage ? "" : "border-radius: 8px 8px 0 0;"} padding: 40px; text-align: center;">
                        ${content}
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
                                    <a href="https://facebook.com/evolutionimpactinitiative" style="text-decoration: none;">
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
                                    <a href="https://instagram.com/evolutionimpactinitiative" style="text-decoration: none;">
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
                                    <a href="https://linkedin.com/company/evolution-impact-initiative" style="text-decoration: none;">
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
                            <a href="${BASE_URL}" style="color: ${BRAND.blue}; text-decoration: underline;">Unsubscribe</a>
                            &nbsp;&nbsp;|&nbsp;&nbsp;
                            <a href="${BASE_URL}" style="color: ${BRAND.blue}; text-decoration: underline;">View in Browser</a>
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

export function registrationConfirmationEmail(
  registration: RegistrationWithChildren,
  event: Event
): { subject: string; html: string } {
  const eventDate = new Date(event.date).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const childrenNames = registration.registration_children
    .map((child) => child.child_name)
    .join(", ");

  const childrenList = registration.registration_children
    .map((child) => `<li style="margin-bottom: 5px;">${child.child_name} (${child.child_age} years old)</li>`)
    .join("");

  const calendarLink = generateCalendarLink(event);
  const cancelLink = generateCancellationLink(registration.id);
  const heroImage = event.card_image_url || event.hero_image_url || undefined;

  const content = `
    <h1 style="margin: 0 0 20px; font-family: 'Montserrat', sans-serif; font-size: 26px; color: ${BRAND.dark}; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px;">
      Registration<br><span style="color: ${BRAND.green};">Confirmed!</span>
    </h1>

    <p style="margin: 0 0 20px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      Dear <strong>${registration.parent_name}</strong>,
    </p>

    <p style="margin: 0 0 25px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      Thank you for registering <strong>${childrenNames}</strong> for our upcoming event. We are so excited to have you join us!
    </p>

    <!-- Event Details Box -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.pale}; border-radius: 8px; margin-bottom: 25px;">
      <tr>
        <td style="padding: 25px; text-align: left;">
          <h3 style="margin: 0 0 15px; font-family: 'Montserrat', sans-serif; font-size: 16px; color: ${BRAND.blue}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
            Event Details
          </h3>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding-bottom: 12px; font-family: 'Inter', sans-serif; font-size: 15px; color: ${BRAND.dark};"><strong>${event.title}</strong></td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark};">
                📅 ${eventDate}<br>
                <span style="font-size: 13px; color: #666;">Please arrive 15 minutes early for check-in.</span>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark};">
                ⏰ ${event.start_time}${event.end_time ? ` – ${event.end_time}` : ""}
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark};">
                📍 ${event.venue_name}${event.venue_address ? `<br>${event.venue_address}` : ""}
              </td>
            </tr>
            <tr>
              <td style="font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark};">
                💷 ${event.cost || "FREE"}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Children Registered -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 25px;">
      <tr>
        <td style="text-align: left;">
          <h3 style="margin: 0 0 10px; font-family: 'Montserrat', sans-serif; font-size: 14px; color: ${BRAND.dark}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
            Children Registered
          </h3>
          <ul style="margin: 0; padding-left: 20px; font-family: 'Inter', sans-serif; font-size: 14px; color: #555555; line-height: 1.8;">
            ${childrenList}
          </ul>
        </td>
      </tr>
    </table>

    ${event.what_to_bring ? `
    <!-- What to Bring -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 25px;">
      <tr>
        <td style="padding: 20px; text-align: left;">
          <h3 style="margin: 0 0 10px; font-family: 'Montserrat', sans-serif; font-size: 14px; color: ${BRAND.dark}; font-weight: 700; font-style: italic;">What to Bring</h3>
          <p style="margin: 0; font-family: 'Inter', sans-serif; font-size: 14px; color: #555555; line-height: 1.6;">${event.what_to_bring}</p>
        </td>
      </tr>
    </table>
    ` : ""}

    <!-- Add to Calendar Button -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 30px;">
      <tr>
        <td style="border-radius: 4px; background: ${BRAND.blue}; text-align: center;">
          <a href="${calendarLink}" target="_blank" class="button-primary" style="background: ${BRAND.blue}; font-family: 'Montserrat', sans-serif; font-size: 14px; text-decoration: none; padding: 14px 30px; color: #ffffff; display: block; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
            Add to Calendar
          </a>
        </td>
      </tr>
    </table>

    <!-- Cancellation Section -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;">
      <tr>
        <td style="padding: 30px; text-align: center;">
          <h3 style="margin: 0 0 15px; font-family: 'Montserrat', sans-serif; font-size: 18px; color: ${BRAND.dark}; font-weight: 700;">
            Can no longer make it?
          </h3>
          <p style="margin: 0 0 20px; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 22px; color: #555555;">
            We understand plans change. However, spaces are limited and in high demand.<br><br>
            <strong>If you can't attend, please cancel your booking</strong> so we can offer your space to a family on our waiting list.
          </p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
            <tr>
              <td style="border-radius: 4px; border: 2px solid #e0e0e0; text-align: center;">
                <a href="${cancelLink}" style="font-family: 'Montserrat', sans-serif; font-size: 13px; text-decoration: none; padding: 12px 24px; color: #666666; display: block; font-weight: 700; text-transform: uppercase;">
                  Cancel My Booking
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 30px 0 0; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark}; line-height: 1.6; text-align: left;">
      See you soon!<br>
      <strong>The Evolution Impact Initiative Team</strong>
    </p>
  `;

  return {
    subject: `Registration Confirmed: ${event.title}`,
    html: emailWrapper(content, heroImage, BRAND.green),
  };
}

export function waitlistConfirmationEmail(
  registration: RegistrationWithChildren,
  event: Event,
  position?: number
): { subject: string; html: string } {
  const eventDate = new Date(event.date).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const childrenNames = registration.registration_children
    .map((child) => child.child_name)
    .join(", ");

  const childrenList = registration.registration_children
    .map((child) => `<li style="margin-bottom: 5px;">${child.child_name} (${child.child_age} years old)</li>`)
    .join("");

  const cancelLink = generateCancellationLink(registration.id);
  const heroImage = event.card_image_url || event.hero_image_url || undefined;

  const content = `
    <h1 style="margin: 0 0 20px; font-family: 'Montserrat', sans-serif; font-size: 26px; color: ${BRAND.dark}; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px;">
      You're on the<br><span style="color: ${BRAND.blue};">Waitlist!</span>
    </h1>

    <p style="margin: 0 0 20px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      Dear <strong>${registration.parent_name}</strong>,
    </p>

    <p style="margin: 0 0 25px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      Thank you for your interest in <strong>${event.title}</strong>. The event is currently full, but we've added <strong>${childrenNames}</strong> to our waitlist.
      ${position ? `<br><br><strong>You are #${position} on the waitlist.</strong>` : ""}
    </p>

    <!-- Event Details Box -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.pale}; border-radius: 8px; margin-bottom: 25px;">
      <tr>
        <td style="padding: 25px; text-align: left;">
          <h3 style="margin: 0 0 15px; font-family: 'Montserrat', sans-serif; font-size: 16px; color: ${BRAND.blue}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
            Event Details
          </h3>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding-bottom: 12px; font-family: 'Inter', sans-serif; font-size: 15px; color: ${BRAND.dark};"><strong>${event.title}</strong></td>
            </tr>
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
              <td style="padding-bottom: 12px; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark};">
                📍 ${event.venue_name}${event.venue_address ? `<br>${event.venue_address}` : ""}
              </td>
            </tr>
            <tr>
              <td style="font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark};">
                💷 ${event.cost || "FREE"}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Children Registered -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 25px;">
      <tr>
        <td style="text-align: left;">
          <h3 style="margin: 0 0 10px; font-family: 'Montserrat', sans-serif; font-size: 14px; color: ${BRAND.dark}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
            Children Registered
          </h3>
          <ul style="margin: 0; padding-left: 20px; font-family: 'Inter', sans-serif; font-size: 14px; color: #555555; line-height: 1.8;">
            ${childrenList}
          </ul>
        </td>
      </tr>
    </table>

    <!-- What happens next? -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 25px;">
      <tr>
        <td style="padding: 20px; text-align: left;">
          <h3 style="margin: 0 0 10px; font-family: 'Montserrat', sans-serif; font-size: 14px; color: ${BRAND.dark}; font-weight: 700; font-style: italic;">What happens next?</h3>
          <p style="margin: 0; font-family: 'Inter', sans-serif; font-size: 14px; color: #555555; line-height: 1.6;">
            If a spot becomes available, we'll email you immediately. Please keep an eye on your inbox (and spam folder!).
          </p>
        </td>
      </tr>
    </table>

    <!-- Cancellation Section -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;">
      <tr>
        <td style="padding: 30px; text-align: center;">
          <h3 style="margin: 0 0 15px; font-family: 'Montserrat', sans-serif; font-size: 18px; color: ${BRAND.dark}; font-weight: 700;">
            No longer interested?
          </h3>
          <p style="margin: 0 0 20px; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 22px; color: #555555;">
            If you no longer wish to be on the waitlist, please remove your registration so others can move up.
          </p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
            <tr>
              <td style="border-radius: 4px; border: 2px solid #e0e0e0; text-align: center;">
                <a href="${cancelLink}" style="font-family: 'Montserrat', sans-serif; font-size: 13px; text-decoration: none; padding: 12px 24px; color: #666666; display: block; font-weight: 700; text-transform: uppercase;">
                  Remove from Waitlist
                </a>
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
  `;

  return {
    subject: `Waitlist Confirmation: ${event.title}`,
    html: emailWrapper(content, heroImage, BRAND.blue),
  };
}

export function waitlistPromotionEmail(
  registration: RegistrationWithChildren,
  event: Event
): { subject: string; html: string } {
  const eventDate = new Date(event.date).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const childrenNames = registration.registration_children
    .map((child) => child.child_name)
    .join(", ");

  const calendarLink = generateCalendarLink(event);
  const cancelLink = generateCancellationLink(registration.id);
  const heroImage = event.card_image_url || event.hero_image_url || undefined;

  const content = `
    <h1 style="margin: 0 0 20px; font-family: 'Montserrat', sans-serif; font-size: 26px; color: ${BRAND.dark}; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px;">
      Great News!<br><span style="color: ${BRAND.green};">You're In!</span>
    </h1>

    <p style="margin: 0 0 20px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      Dear <strong>${registration.parent_name}</strong>,
    </p>

    <p style="margin: 0 0 25px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      A spot has become available and <strong>${childrenNames}</strong> has been moved from the waitlist to a <strong>confirmed registration</strong> for <strong>${event.title}</strong>!
    </p>

    <!-- Confirmed Banner -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.green}; border-radius: 8px; margin-bottom: 25px;">
      <tr>
        <td style="padding: 20px; text-align: center;">
          <p style="margin: 0; font-family: 'Montserrat', sans-serif; font-size: 18px; color: #ffffff; font-weight: 700;">
            ✓ Your registration is now confirmed!
          </p>
        </td>
      </tr>
    </table>

    <!-- Event Details Box -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.pale}; border-radius: 8px; margin-bottom: 25px;">
      <tr>
        <td style="padding: 25px; text-align: left;">
          <h3 style="margin: 0 0 15px; font-family: 'Montserrat', sans-serif; font-size: 16px; color: ${BRAND.blue}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
            Event Details
          </h3>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding-bottom: 12px; font-family: 'Inter', sans-serif; font-size: 15px; color: ${BRAND.dark};"><strong>${event.title}</strong></td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark};">
                📅 ${eventDate}<br>
                <span style="font-size: 13px; color: #666;">Please arrive 15 minutes early for check-in.</span>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark};">
                ⏰ ${event.start_time}${event.end_time ? ` – ${event.end_time}` : ""}
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark};">
                📍 ${event.venue_name}${event.venue_address ? `<br>${event.venue_address}` : ""}
              </td>
            </tr>
            <tr>
              <td style="font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark};">
                💷 ${event.cost || "FREE"}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${event.what_to_bring ? `
    <!-- What to Bring -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 25px;">
      <tr>
        <td style="padding: 20px; text-align: left;">
          <h3 style="margin: 0 0 10px; font-family: 'Montserrat', sans-serif; font-size: 14px; color: ${BRAND.dark}; font-weight: 700; font-style: italic;">What to Bring</h3>
          <p style="margin: 0; font-family: 'Inter', sans-serif; font-size: 14px; color: #555555; line-height: 1.6;">${event.what_to_bring}</p>
        </td>
      </tr>
    </table>
    ` : ""}

    <!-- Add to Calendar Button -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 30px;">
      <tr>
        <td style="border-radius: 4px; background: ${BRAND.blue}; text-align: center;">
          <a href="${calendarLink}" target="_blank" class="button-primary" style="background: ${BRAND.blue}; font-family: 'Montserrat', sans-serif; font-size: 14px; text-decoration: none; padding: 14px 30px; color: #ffffff; display: block; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
            Add to Calendar
          </a>
        </td>
      </tr>
    </table>

    <!-- Cancellation Section -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;">
      <tr>
        <td style="padding: 30px; text-align: center;">
          <h3 style="margin: 0 0 15px; font-family: 'Montserrat', sans-serif; font-size: 18px; color: ${BRAND.dark}; font-weight: 700;">
            Can no longer make it?
          </h3>
          <p style="margin: 0 0 20px; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 22px; color: #555555;">
            We understand plans change. <strong>If you can't attend, please cancel your booking</strong> so we can offer your space to another family.
          </p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
            <tr>
              <td style="border-radius: 4px; border: 2px solid #e0e0e0; text-align: center;">
                <a href="${cancelLink}" style="font-family: 'Montserrat', sans-serif; font-size: 13px; text-decoration: none; padding: 12px 24px; color: #666666; display: block; font-weight: 700; text-transform: uppercase;">
                  Cancel My Booking
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 30px 0 0; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark}; line-height: 1.6; text-align: left;">
      See you soon!<br>
      <strong>The Evolution Impact Initiative Team</strong>
    </p>
  `;

  return {
    subject: `You're In! Spot Available for ${event.title}`,
    html: emailWrapper(content, heroImage, BRAND.green),
  };
}

export function eventReminderEmail(
  registration: RegistrationWithChildren,
  event: Event,
  hoursUntilEvent: number
): { subject: string; html: string } {
  const eventDate = new Date(event.date).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const reminderText =
    hoursUntilEvent <= 2
      ? "Starting Soon!"
      : hoursUntilEvent <= 24
      ? "Tomorrow!"
      : `In ${Math.round(hoursUntilEvent / 24)} Days`;

  const childrenNames = registration.registration_children
    .map((child) => child.child_name)
    .join(", ");

  const calendarLink = generateCalendarLink(event);
  const cancelLink = generateCancellationLink(registration.id);
  const heroImage = event.card_image_url || event.hero_image_url || undefined;

  const content = `
    <h1 style="margin: 0 0 20px; font-family: 'Montserrat', sans-serif; font-size: 26px; color: ${BRAND.dark}; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px;">
      Event<br><span style="color: ${BRAND.blue};">Reminder</span>
    </h1>

    <!-- Countdown Badge -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 25px;">
      <tr>
        <td style="background-color: ${BRAND.blue}; border-radius: 50px; padding: 12px 24px; text-align: center;">
          <span style="font-family: 'Montserrat', sans-serif; font-size: 14px; color: #ffffff; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
            ${reminderText}
          </span>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 20px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      Dear <strong>${registration.parent_name}</strong>,
    </p>

    <p style="margin: 0 0 25px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      This is a friendly reminder that <strong>${event.title}</strong> is coming up soon. We're looking forward to seeing you and <strong>${childrenNames}</strong>!
    </p>

    <!-- Event Details Box -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 25px;">
      <tr>
        <td style="padding: 25px; text-align: left;">
          <h3 style="margin: 0 0 15px; font-family: 'Montserrat', sans-serif; font-size: 14px; color: ${BRAND.dark}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
            Event Details
          </h3>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding-bottom: 12px; font-family: 'Inter', sans-serif; font-size: 15px; color: ${BRAND.dark};"><strong>${event.title}</strong></td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark};">
                📅 ${eventDate}<br>
                <span style="font-size: 13px; color: #888;">Please arrive 15 minutes early.</span>
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

    ${event.what_to_bring ? `
    <!-- What to Bring -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 25px;">
      <tr>
        <td style="padding: 20px; text-align: left;">
          <h3 style="margin: 0 0 10px; font-family: 'Montserrat', sans-serif; font-size: 14px; color: ${BRAND.dark}; font-weight: 700; font-style: italic;">Don't Forget to Bring</h3>
          <p style="margin: 0; font-family: 'Inter', sans-serif; font-size: 14px; color: #555555; line-height: 1.6;">${event.what_to_bring}</p>
        </td>
      </tr>
    </table>
    ` : ""}

    <!-- Arrival Tips -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 25px;">
      <tr>
        <td style="padding: 20px; text-align: left;">
          <h3 style="margin: 0 0 10px; font-family: 'Montserrat', sans-serif; font-size: 14px; color: ${BRAND.dark}; font-weight: 700; font-style: italic;">Arrival Tips</h3>
          <ul style="margin: 0; padding-left: 20px; font-family: 'Inter', sans-serif; font-size: 14px; color: #555555; line-height: 1.8;">
            <li>Please arrive 10-15 minutes early for check-in</li>
            <li>Look for our team members in Evolution Impact Initiative t-shirts</li>
            <li>Make sure your children have comfortable clothing and footwear</li>
          </ul>
        </td>
      </tr>
    </table>

    <!-- Add to Calendar Button -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 30px;">
      <tr>
        <td style="border-radius: 4px; background: ${BRAND.blue}; text-align: center;">
          <a href="${calendarLink}" target="_blank" class="button-primary" style="background: ${BRAND.blue}; font-family: 'Montserrat', sans-serif; font-size: 14px; text-decoration: none; padding: 14px 30px; color: #ffffff; display: block; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
            Add to Calendar
          </a>
        </td>
      </tr>
    </table>

    <!-- Cancellation Section -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;">
      <tr>
        <td style="padding: 30px; text-align: center;">
          <h3 style="margin: 0 0 15px; font-family: 'Montserrat', sans-serif; font-size: 18px; color: ${BRAND.dark}; font-weight: 700;">
            Can no longer make it?
          </h3>
          <p style="margin: 0 0 20px; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 22px; color: #555555;">
            We understand plans change. <strong>If you can't attend, please cancel your booking</strong> so we can offer your space to another family.
          </p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
            <tr>
              <td style="border-radius: 4px; border: 2px solid #e0e0e0; text-align: center;">
                <a href="${cancelLink}" style="font-family: 'Montserrat', sans-serif; font-size: 13px; text-decoration: none; padding: 12px 24px; color: #666666; display: block; font-weight: 700; text-transform: uppercase;">
                  Cancel My Booking
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 30px 0 0; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark}; line-height: 1.6; text-align: left;">
      See you soon!<br>
      <strong>The Evolution Impact Initiative Team</strong>
    </p>
  `;

  return {
    subject: `Reminder: ${event.title} - ${eventDate}`,
    html: emailWrapper(content, heroImage, BRAND.blue),
  };
}

export function attendanceConfirmationEmail(
  registration: RegistrationWithChildren,
  event: Event
): { subject: string; html: string } {
  const eventDate = new Date(event.date).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const childrenNames = registration.registration_children
    .map((child) => child.child_name)
    .join(", ");

  const yesLink = generateAttendanceConfirmLink(registration.id, "yes");
  const noLink = generateAttendanceConfirmLink(registration.id, "no");
  const heroImage = event.card_image_url || event.hero_image_url || undefined;

  const content = `
    <h1 style="margin: 0 0 20px; font-family: 'Montserrat', sans-serif; font-size: 26px; color: ${BRAND.dark}; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px;">
      Are You<br><span style="color: ${BRAND.blue};">Still Coming?</span>
    </h1>

    <!-- 3 Days Badge -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 25px;">
      <tr>
        <td style="background-color: ${BRAND.green}; border-radius: 50px; padding: 12px 24px; text-align: center;">
          <span style="font-family: 'Montserrat', sans-serif; font-size: 14px; color: #ffffff; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
            Event in 3 Days!
          </span>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 20px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      Dear <strong>${registration.parent_name}</strong>,
    </p>

    <p style="margin: 0 0 25px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      <strong>${event.title}</strong> is coming up in just 3 days! We'd love to confirm that you and <strong>${childrenNames}</strong> are still planning to attend.
    </p>

    <!-- Event Details Box -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.pale}; border-radius: 8px; margin-bottom: 25px;">
      <tr>
        <td style="padding: 25px; text-align: left;">
          <h3 style="margin: 0 0 15px; font-family: 'Montserrat', sans-serif; font-size: 16px; color: ${BRAND.blue}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
            Event Details
          </h3>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding-bottom: 12px; font-family: 'Inter', sans-serif; font-size: 15px; color: ${BRAND.dark};"><strong>${event.title}</strong></td>
            </tr>
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

    <!-- Confirmation Prompt -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 25px;">
      <tr>
        <td style="padding: 30px; text-align: center;">
          <h3 style="margin: 0 0 15px; font-family: 'Montserrat', sans-serif; font-size: 18px; color: ${BRAND.dark}; font-weight: 700;">
            Please confirm your attendance
          </h3>
          <p style="margin: 0 0 25px; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 22px; color: #555555;">
            Help us plan by letting us know if you're still coming. If you can't make it, cancelling frees up a spot for families on our waitlist.
          </p>

          <!-- Yes/No Buttons - Stacked for mobile compatibility -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 280px;">
            <tr>
              <td style="padding-bottom: 12px;">
                <a href="${yesLink}" style="display: block; background-color: ${BRAND.green}; font-family: 'Montserrat', sans-serif; font-size: 14px; text-decoration: none; padding: 16px 30px; color: #ffffff; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-radius: 6px; text-align: center;">
                  Yes, I'll Be There
                </a>
              </td>
            </tr>
            <tr>
              <td>
                <a href="${noLink}" style="display: block; background-color: #ef4444; font-family: 'Montserrat', sans-serif; font-size: 14px; text-decoration: none; padding: 16px 30px; color: #ffffff; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-radius: 6px; text-align: center;">
                  No, I Can't Make It
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-family: 'Inter', sans-serif; font-size: 13px; color: #888888; text-align: center;">
      No response needed if you've already confirmed. We'll send a final reminder the day before the event.
    </p>

    <p style="margin: 30px 0 0; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark}; line-height: 1.6; text-align: left;">
      Looking forward to seeing you!<br>
      <strong>The Evolution Impact Initiative Team</strong>
    </p>
  `;

  return {
    subject: `Please Confirm: ${event.title} in 3 Days`,
    html: emailWrapper(content, heroImage, BRAND.green),
  };
}
