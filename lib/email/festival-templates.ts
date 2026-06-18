import QRCode from "qrcode";
import type {
  Event,
  FestivalSponsor,
  FestivalTicket,
  FestivalVendor,
  FestivalVolunteer,
  Registration,
} from "@/lib/supabase/types";
import {
  FESTIVAL,
  VENDOR_CATEGORIES,
  getSponsorTier,
} from "@/lib/festival";
import { ticketUrl } from "@/lib/festival/tickets";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.evolutionimpactinitiative.co.uk";
const LOGO_URL =
  "https://evolutionimpactinitiative.co.uk/logos/evolution_full_logo_1.png";

const BRAND = {
  blue: "#17559D",
  green: "#31B67D",
  accent: "#31FDA5",
  pale: "#DCECFF",
  dark: "#1E1E1E",
} as const;

function holderTypeLabel(type: FestivalTicket["holder_type"]): string {
  if (type === "child") return "Child";
  if (type === "adult") return "Adult";
  return "Lead booker";
}

function holderTypeColor(type: FestivalTicket["holder_type"]): string {
  if (type === "child") return BRAND.blue;
  if (type === "adult") return BRAND.green;
  return BRAND.dark;
}

export interface FestivalTicketAttachment {
  filename: string;
  content: string; // base64-encoded PNG
  contentId: string; // referenced from HTML as cid:<contentId>
}

async function renderTicketBlock(
  ticket: FestivalTicket,
): Promise<{ html: string; attachment: FestivalTicketAttachment }> {
  const url = ticketUrl(ticket.ticket_code);
  const dataUrl = await QRCode.toDataURL(url, {
    width: 480,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: BRAND.dark, light: "#ffffff" },
  });
  // dataUrl is "data:image/png;base64,XXXX" — strip the prefix so we can
  // attach as a real inline image (data: URLs are blocked by Gmail et al).
  const base64 = dataUrl.split(",")[1] ?? "";
  const contentId = `qr-${ticket.ticket_code}`;
  const filename = `ticket-${ticket.ticket_code}.png`;

  const badgeColor = holderTypeColor(ticket.holder_type);

  const html = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 16px;">
      <tr>
        <td style="padding: 20px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="vertical-align: middle; padding-right: 12px;">
                <span style="display: inline-block; background-color: ${badgeColor}; color: #ffffff; font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 10px; border-radius: 999px;">
                  ${holderTypeLabel(ticket.holder_type)}
                </span>
                <p style="margin: 10px 0 4px; font-family: 'Montserrat', sans-serif; font-size: 18px; font-weight: 800; color: ${BRAND.dark};">
                  ${ticket.holder_name ?? "Guest"}
                </p>
                <p style="margin: 0 0 8px; font-family: 'Inter', sans-serif; font-size: 12px; color: #888888;">
                  Ticket #${ticket.display_order + 1}
                </p>
                <p style="margin: 0 0 10px; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark}; letter-spacing: 2px; font-weight: 600;">
                  ${ticket.ticket_code}
                </p>
                <a href="${url}" style="font-family: 'Inter', sans-serif; font-size: 12px; color: ${BRAND.blue}; text-decoration: underline; word-break: break-all;">
                  View this ticket online
                </a>
              </td>
              <td width="140" style="vertical-align: middle; text-align: right;">
                <img src="cid:${contentId}" width="140" height="140" alt="Ticket QR code" style="display: block; border: 1px solid #e5e7eb; border-radius: 8px;" />
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  return {
    html,
    attachment: { filename, content: base64, contentId },
  };
}

function calendarLink(): string {
  const startDate = new Date(`${FESTIVAL.date}T${FESTIVAL.startTime}:00`);
  const endDate = new Date(`${FESTIVAL.date}T${FESTIVAL.endTime}:00`);
  const formatDate = (d: Date) =>
    d.toISOString().replace(/-|:|\.\d{3}/g, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: FESTIVAL.title,
    dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
    details: `Free family festival celebrating one year of Evolution Impact Initiative. ${FESTIVAL.tagline}.`,
    location: `${FESTIVAL.venueName}, ${FESTIVAL.venueArea}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

interface FestivalTicketEmailArgs {
  registration: Pick<Registration, "id" | "parent_name" | "parent_email">;
  event: Event;
  tickets: FestivalTicket[];
}

/**
 * One combined email per registration with all N tickets (each with its own QR).
 * Returns CID-referenced attachments so Gmail / Outlook / Apple Mail all render
 * the QR images inline (data: URLs would be stripped by most clients).
 */
export async function festivalTicketsEmail({
  registration,
  event,
  tickets,
}: FestivalTicketEmailArgs): Promise<{
  subject: string;
  html: string;
  attachments: FestivalTicketAttachment[];
}> {
  const rendered = await Promise.all(tickets.map(renderTicketBlock));
  const ticketBlocks = rendered.map((r) => r.html);
  const attachments = rendered.map((r) => r.attachment);
  const ticketCount = tickets.length;

  const ticketWord = ticketCount === 1 ? "ticket" : "tickets";

  const content = `
    <h1 style="margin: 0 0 16px; font-family: 'Montserrat', sans-serif; font-size: 28px; color: ${BRAND.dark}; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px;">
      You're in!<br><span style="color: ${BRAND.green};">${ticketCount} ${ticketWord} attached.</span>
    </h1>

    <p style="margin: 0 0 18px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      Hi <strong>${registration.parent_name}</strong> —
    </p>

    <p style="margin: 0 0 25px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      Your free tickets for <strong>${FESTIVAL.title}</strong> are below.
      Show the QR code on your phone (or print it) at the door on the day —
      we&rsquo;ll scan it for fast check-in.
    </p>

    <!-- Event Details Box -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.dark}; border-radius: 12px; margin-bottom: 25px;">
      <tr>
        <td style="padding: 22px 24px; text-align: left;">
          <p style="margin: 0 0 6px; font-family: 'Montserrat', sans-serif; font-size: 11px; color: ${BRAND.accent}; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">
            Save the date
          </p>
          <p style="margin: 0 0 14px; font-family: 'Montserrat', sans-serif; font-size: 22px; color: #ffffff; font-weight: 800;">
            ${FESTIVAL.title}
          </p>
          <p style="margin: 0 0 6px; font-family: 'Inter', sans-serif; font-size: 14px; color: #ffffff;">
            📅 ${FESTIVAL.dateLabel} · ${FESTIVAL.timeLabel}
          </p>
          <p style="margin: 0; font-family: 'Inter', sans-serif; font-size: 14px; color: #ffffff;">
            📍 ${FESTIVAL.venueName}, ${FESTIVAL.venueArea}
          </p>
        </td>
      </tr>
    </table>

    <h2 style="margin: 30px 0 14px; font-family: 'Montserrat', sans-serif; font-size: 14px; color: ${BRAND.dark}; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; text-align: left;">
      Your ${ticketWord}
    </h2>

    ${ticketBlocks.join("\n")}

    <!-- Important info -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.pale}; border-radius: 12px; margin: 25px 0;">
      <tr>
        <td style="padding: 18px 22px; text-align: left;">
          <p style="margin: 0 0 8px; font-family: 'Montserrat', sans-serif; font-size: 12px; color: ${BRAND.blue}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
            Good to know
          </p>
          <p style="margin: 0 0 6px; font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.6; color: ${BRAND.dark};">
            • <strong>Each person needs their own ticket</strong> — including children.
          </p>
          <p style="margin: 0 0 6px; font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.6; color: ${BRAND.dark};">
            • <strong>Tickets are transferable</strong> — share the link with whoever is using it.
          </p>
          <p style="margin: 0; font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.6; color: ${BRAND.dark};">
            • <strong>Arrive any time from 12pm</strong> — the festival runs all day until 6pm.
          </p>
        </td>
      </tr>
    </table>

    <!-- Calendar button -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 25px auto 10px;">
      <tr>
        <td style="border-radius: 4px; background: ${BRAND.blue}; text-align: center;">
          <a href="${calendarLink()}" target="_blank" style="background: ${BRAND.blue}; font-family: 'Montserrat', sans-serif; font-size: 14px; text-decoration: none; padding: 14px 30px; color: #ffffff; display: block; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
            Add to Calendar
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 28px 0 0; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark}; line-height: 1.6; text-align: left;">
      See you on the day —<br>
      <strong>The Evolution Impact Initiative team</strong>
    </p>
  `;

  return {
    subject: `Your ${ticketWord} for ${FESTIVAL.title} 🎉`,
    html: emailWrapper(content),
    attachments,
  };
}

// ---- minimal wrapper (kept here so the file is self-contained) ----
function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${FESTIVAL.title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@600;700;800;900&display=swap" rel="stylesheet">
  <style>body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif; background-color: #f4f6f8; }</style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', sans-serif; background-color: #f4f6f8;">
  <center style="width: 100%; background-color: #f4f6f8;">
    <div style="max-width: 600px; margin: 0 auto;">
      <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding: 30px 20px; text-align: center;">
            <a href="${BASE_URL}" style="text-decoration: none;">
              <img src="${LOGO_URL}" alt="Evolution Impact Initiative" width="220" style="display: block; margin: 0 auto; max-width: 220px; height: auto;" />
            </a>
          </td>
        </tr>
      </table>
      <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="background-color: #ffffff; border-radius: 8px 8px 0 0; padding: 36px 28px; text-align: left;">
            ${content}
          </td>
        </tr>
      </table>
      <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="border-top: 3px solid ${BRAND.blue}; padding: 25px 20px; text-align: center;">
            <p style="margin: 0 0 5px; font-family: 'Montserrat', sans-serif; font-size: 14px; color: #555555; font-weight: 600;">Evolution Impact Initiative CIC</p>
            <p style="margin: 0 0 8px; font-family: 'Inter', sans-serif; font-size: 12px; color: #888888;">86 King Street, Rochester, Kent, ME1 1YD</p>
            <p style="margin: 0; font-family: 'Inter', sans-serif; font-size: 11px; color: #aaaaaa;">Company No. 16667870</p>
          </td>
        </tr>
      </table>
      <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr><td height="30">&nbsp;</td></tr>
      </table>
    </div>
  </center>
</body>
</html>`;
}

// ============================================
// 7-day reminder
// ============================================

interface FestivalReminderArgs {
  registration: Pick<Registration, "parent_name">;
  daysUntil: number;
  ticketCount: number;
}

export function festivalSevenDayReminderEmail({
  registration,
  daysUntil,
  ticketCount,
}: FestivalReminderArgs): { subject: string; html: string } {
  const ticketWord = ticketCount === 1 ? "ticket" : "tickets";

  const content = `
    <h1 style="margin: 0 0 16px; font-family: 'Montserrat', sans-serif; font-size: 28px; color: ${BRAND.dark}; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px;">
      ${daysUntil} days to go.
    </h1>

    <p style="margin: 0 0 18px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      Hi <strong>${registration.parent_name}</strong>,
    </p>

    <p style="margin: 0 0 25px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      ${FESTIVAL.title} is just one week away — and your ${ticketCount} ${ticketWord} are ready in your inbox. Save the email (or print it) so you can scan in fast on the day.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.dark}; border-radius: 12px; margin-bottom: 25px;">
      <tr>
        <td style="padding: 22px 24px; text-align: left;">
          <p style="margin: 0 0 6px; font-family: 'Montserrat', sans-serif; font-size: 11px; color: ${BRAND.accent}; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">
            One week to go
          </p>
          <p style="margin: 0 0 14px; font-family: 'Montserrat', sans-serif; font-size: 22px; color: #ffffff; font-weight: 800;">
            ${FESTIVAL.title}
          </p>
          <p style="margin: 0 0 6px; font-family: 'Inter', sans-serif; font-size: 14px; color: #ffffff;">
            📅 ${FESTIVAL.dateLabel} · ${FESTIVAL.timeLabel}
          </p>
          <p style="margin: 0; font-family: 'Inter', sans-serif; font-size: 14px; color: #ffffff;">
            📍 ${FESTIVAL.venueName}, ${FESTIVAL.venueArea}
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 20px; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.7; color: ${BRAND.dark};">
      <strong>Plans changed?</strong> Tickets are transferable — share the link with a friend or family member. If you can&rsquo;t make it at all, please let us know so we can offer your space to someone else.
    </p>

    <p style="margin: 28px 0 0; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark}; line-height: 1.6;">
      See you soon —<br>
      <strong>The Evolution Impact Initiative team</strong>
    </p>
  `;

  return {
    subject: `${daysUntil} days until ${FESTIVAL.title}`,
    html: emailWrapper(content),
  };
}

// ============================================
// VENDOR EMAILS
// ============================================

function categoryLabel(category: FestivalVendor["category"]): string {
  return (
    VENDOR_CATEGORIES.find((c) => c.key === category)?.label ?? category
  );
}

function formatPence(pence: number): string {
  return `£${(pence / 100).toFixed(pence % 100 === 0 ? 0 : 2)}`;
}

interface VendorEmailArgs {
  vendor: Pick<
    FestivalVendor,
    "business_name" | "contact_name" | "category" | "contribution_amount"
  >;
}

export function vendorApplicationReceivedEmail({
  vendor,
}: VendorEmailArgs): { subject: string; html: string } {
  const isCommunityOrg = vendor.category === "community_org";
  const contributionLine = isCommunityOrg
    ? "As a community organisation, your stall is free of charge."
    : `We've received your community contribution of <strong>${formatPence(vendor.contribution_amount)}</strong> — thank you. Every penny goes to the Back to School campaign.`;

  const content = `
    <h1 style="margin: 0 0 16px; font-family: 'Montserrat', sans-serif; font-size: 28px; color: ${BRAND.dark}; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px;">
      Application received.
    </h1>

    <p style="margin: 0 0 18px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      Hi <strong>${vendor.contact_name}</strong>,
    </p>

    <p style="margin: 0 0 18px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      Thanks for applying to trade at <strong>${FESTIVAL.title}</strong> with
      <strong>${vendor.business_name}</strong> in the <em>${categoryLabel(vendor.category)}</em> category.
    </p>

    <p style="margin: 0 0 25px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      ${contributionLine}
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.pale}; border-radius: 12px; margin-bottom: 25px;">
      <tr>
        <td style="padding: 22px 24px; text-align: left;">
          <p style="margin: 0 0 8px; font-family: 'Montserrat', sans-serif; font-size: 12px; color: ${BRAND.blue}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
            What happens next
          </p>
          <p style="margin: 0 0 8px; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.7; color: ${BRAND.dark};">
            1. Our team will review your application within 5 working days.
          </p>
          <p style="margin: 0 0 8px; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.7; color: ${BRAND.dark};">
            2. You'll receive a confirmation email with pitch details, arrival time, and a checklist for documents (Public Liability Insurance, Food Hygiene if applicable, Risk Assessment).
          </p>
          <p style="margin: 0; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.7; color: ${BRAND.dark};">
            3. Reply to this email any time with documents or questions.
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.dark}; border-radius: 12px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 22px 24px; text-align: left;">
          <p style="margin: 0 0 6px; font-family: 'Montserrat', sans-serif; font-size: 11px; color: ${BRAND.accent}; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">
            The festival
          </p>
          <p style="margin: 0 0 12px; font-family: 'Montserrat', sans-serif; font-size: 20px; color: #ffffff; font-weight: 800;">
            ${FESTIVAL.title}
          </p>
          <p style="margin: 0 0 4px; font-family: 'Inter', sans-serif; font-size: 14px; color: #ffffff;">
            📅 ${FESTIVAL.dateLabel} · ${FESTIVAL.timeLabel}
          </p>
          <p style="margin: 0; font-family: 'Inter', sans-serif; font-size: 14px; color: #ffffff;">
            📍 ${FESTIVAL.venueName}, ${FESTIVAL.venueArea}
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 25px 0 0; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark}; line-height: 1.6;">
      Thanks for being part of it —<br>
      <strong>The Evolution Impact Initiative team</strong>
    </p>
  `;

  return {
    subject: `Your ${FESTIVAL.title} vendor application — received`,
    html: emailWrapper(content),
  };
}

export function vendorApprovedEmail({
  vendor,
}: VendorEmailArgs): { subject: string; html: string } {
  const isCommunityOrg = vendor.category === "community_org";
  const docsList = isCommunityOrg
    ? "<li style='margin-bottom:6px;'>Public Liability Insurance (where applicable)</li><li style='margin-bottom:6px;'>Risk Assessment (where applicable)</li>"
    : vendor.category === "food"
      ? `<li style='margin-bottom:6px;'>Public Liability Insurance</li>
         <li style='margin-bottom:6px;'>Food Hygiene Rating (please share the score)</li>
         <li style='margin-bottom:6px;'>Food Hygiene Certificate</li>
         <li style='margin-bottom:6px;'>Risk Assessment</li>`
      : `<li style='margin-bottom:6px;'>Public Liability Insurance</li>
         <li style='margin-bottom:6px;'>Risk Assessment (where applicable)</li>`;

  const content = `
    <h1 style="margin: 0 0 16px; font-family: 'Montserrat', sans-serif; font-size: 28px; color: ${BRAND.dark}; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px;">
      You're <span style="color: ${BRAND.green};">in!</span>
    </h1>

    <p style="margin: 0 0 18px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      Hi <strong>${vendor.contact_name}</strong>,
    </p>

    <p style="margin: 0 0 25px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      <strong>${vendor.business_name}</strong> is confirmed as a vendor at
      <strong>${FESTIVAL.title}</strong>. We can't wait to have you with us.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.dark}; border-radius: 12px; margin-bottom: 25px;">
      <tr>
        <td style="padding: 22px 24px; text-align: left;">
          <p style="margin: 0 0 6px; font-family: 'Montserrat', sans-serif; font-size: 11px; color: ${BRAND.accent}; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">
            On the day
          </p>
          <p style="margin: 0 0 12px; font-family: 'Montserrat', sans-serif; font-size: 20px; color: #ffffff; font-weight: 800;">
            ${FESTIVAL.title}
          </p>
          <p style="margin: 0 0 4px; font-family: 'Inter', sans-serif; font-size: 14px; color: #ffffff;">
            📅 ${FESTIVAL.dateLabel}
          </p>
          <p style="margin: 0 0 4px; font-family: 'Inter', sans-serif; font-size: 14px; color: #ffffff;">
            ⏰ Setup from 10am · doors 12pm · pack down 6pm
          </p>
          <p style="margin: 0; font-family: 'Inter', sans-serif; font-size: 14px; color: #ffffff;">
            📍 ${FESTIVAL.venueName}, ${FESTIVAL.venueArea}
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 22px 24px; text-align: left;">
          <p style="margin: 0 0 8px; font-family: 'Montserrat', sans-serif; font-size: 12px; color: ${BRAND.blue}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
            Documents we need
          </p>
          <p style="margin: 0 0 10px; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.6; color: #555555;">
            Please reply to this email with the following before <strong>${FESTIVAL.applicationDeadlineLabel}</strong>:
          </p>
          <ul style="margin: 0; padding-left: 20px; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark}; line-height: 1.6;">
            ${docsList}
          </ul>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.pale}; border-radius: 12px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 18px 22px; text-align: left;">
          <p style="margin: 0 0 8px; font-family: 'Montserrat', sans-serif; font-size: 12px; color: ${BRAND.blue}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
            What to bring
          </p>
          <p style="margin: 0 0 6px; font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.6; color: ${BRAND.dark};">
            • Your own gazebo, tables and chairs if required
          </p>
          <p style="margin: 0 0 6px; font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.6; color: ${BRAND.dark};">
            • Your own power supply unless agreed in advance
          </p>
          <p style="margin: 0; font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.6; color: ${BRAND.dark};">
            • Bags / equipment to keep your area clean throughout the day
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 25px 0 0; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark}; line-height: 1.6;">
      See you on the day —<br>
      <strong>The Evolution Impact Initiative team</strong>
    </p>
  `;

  return {
    subject: `Confirmed: ${vendor.business_name} at ${FESTIVAL.title}`,
    html: emailWrapper(content),
  };
}

interface VendorRejectedArgs extends VendorEmailArgs {
  reasonNote?: string;
  refunded: boolean;
}

export function vendorRejectedEmail({
  vendor,
  reasonNote,
  refunded,
}: VendorRejectedArgs): { subject: string; html: string } {
  const refundLine = refunded
    ? `Your community contribution of <strong>${formatPence(vendor.contribution_amount)}</strong> has been refunded — you should see it back in your account within 5–10 working days.`
    : "No payment was taken for your application.";

  const content = `
    <h1 style="margin: 0 0 16px; font-family: 'Montserrat', sans-serif; font-size: 26px; color: ${BRAND.dark}; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px;">
      An update on your<br>vendor application.
    </h1>

    <p style="margin: 0 0 18px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      Hi <strong>${vendor.contact_name}</strong>,
    </p>

    <p style="margin: 0 0 18px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      Thank you for your interest in trading at <strong>${FESTIVAL.title}</strong> with
      <strong>${vendor.business_name}</strong>. Unfortunately we&rsquo;re unable to confirm a pitch for you this year.
    </p>

    ${
      reasonNote
        ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.pale}; border-radius: 12px; margin-bottom: 20px;">
             <tr>
               <td style="padding: 18px 22px; text-align: left;">
                 <p style="margin: 0 0 6px; font-family: 'Montserrat', sans-serif; font-size: 12px; color: ${BRAND.blue}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">From the team</p>
                 <p style="margin: 0; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.7; color: ${BRAND.dark};">${reasonNote}</p>
               </td>
             </tr>
           </table>`
        : ""
    }

    <p style="margin: 0 0 25px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      ${refundLine}
    </p>

    <p style="margin: 0 0 18px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      We'd genuinely love to keep in touch — you can still join us as a guest at the festival on ${FESTIVAL.dateLabel}, and we'll let you know first when next year's vendor applications open.
    </p>

    <p style="margin: 25px 0 0; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark}; line-height: 1.6;">
      With thanks —<br>
      <strong>The Evolution Impact Initiative team</strong>
    </p>
  `;

  return {
    subject: `An update on your ${FESTIVAL.title} vendor application`,
    html: emailWrapper(content),
  };
}

// ============================================
// SPONSOR EMAILS
// ============================================

interface SponsorEmailArgs {
  sponsor: Pick<
    FestivalSponsor,
    | "organisation_name"
    | "contact_name"
    | "path"
    | "tier_key"
    | "amount_pledged"
    | "display_name"
  >;
}

function sponsorTierLabel(sponsor: SponsorEmailArgs["sponsor"]): string {
  if (sponsor.path === "custom") return "Custom partnership";
  return getSponsorTier(sponsor.tier_key)?.label ?? sponsor.tier_key;
}

export function sponsorInquiryReceivedEmail({
  sponsor,
}: SponsorEmailArgs): { subject: string; html: string } {
  const tierLabel = sponsorTierLabel(sponsor);
  const isCustom = sponsor.path === "custom";
  const amountLine = isCustom
    ? "Our team will be in touch within 2 working days to discuss the partnership and tailor a package around your goals."
    : `We&rsquo;ve received your pledge of <strong>${formatPence(sponsor.amount_pledged)}</strong> for the <strong>${tierLabel}</strong> tier — thank you. We&rsquo;ll confirm by email within 2 working days.`;

  const content = `
    <h1 style="margin: 0 0 16px; font-family: 'Montserrat', sans-serif; font-size: 28px; color: ${BRAND.dark}; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px;">
      Thank you.
    </h1>

    <p style="margin: 0 0 18px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      Hi <strong>${sponsor.contact_name}</strong>,
    </p>

    <p style="margin: 0 0 25px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      We&rsquo;ve received your sponsorship inquiry on behalf of
      <strong>${sponsor.organisation_name}</strong> for ${FESTIVAL.title}.
      ${amountLine}
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.pale}; border-radius: 12px; margin-bottom: 25px;">
      <tr>
        <td style="padding: 22px 24px; text-align: left;">
          <p style="margin: 0 0 8px; font-family: 'Montserrat', sans-serif; font-size: 12px; color: ${BRAND.blue}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
            What happens next
          </p>
          <p style="margin: 0 0 6px; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.7; color: ${BRAND.dark};">
            1. We&rsquo;ll review and confirm your partnership.
          </p>
          <p style="margin: 0 0 6px; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.7; color: ${BRAND.dark};">
            2. You&rsquo;ll get a confirmation email with the perks attached to your tier — logo placement, social mentions, on-day activation details.
          </p>
          <p style="margin: 0; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.7; color: ${BRAND.dark};">
            3. We&rsquo;ll request your high-resolution logo and any messaging you&rsquo;d like us to use.
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.dark}; border-radius: 12px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 22px 24px; text-align: left;">
          <p style="margin: 0 0 6px; font-family: 'Montserrat', sans-serif; font-size: 11px; color: ${BRAND.accent}; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">
            The festival
          </p>
          <p style="margin: 0 0 12px; font-family: 'Montserrat', sans-serif; font-size: 20px; color: #ffffff; font-weight: 800;">
            ${FESTIVAL.title}
          </p>
          <p style="margin: 0 0 4px; font-family: 'Inter', sans-serif; font-size: 14px; color: #ffffff;">
            📅 ${FESTIVAL.dateLabel} · ${FESTIVAL.timeLabel}
          </p>
          <p style="margin: 0; font-family: 'Inter', sans-serif; font-size: 14px; color: #ffffff;">
            📍 ${FESTIVAL.venueName}, ${FESTIVAL.venueArea}
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 25px 0 0; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark}; line-height: 1.6;">
      With thanks for supporting 500 children across Medway —<br>
      <strong>The Evolution Impact Initiative team</strong>
    </p>
  `;

  return {
    subject: `Thanks for partnering with ${FESTIVAL.title}`,
    html: emailWrapper(content),
  };
}

export function sponsorConfirmedEmail({
  sponsor,
}: SponsorEmailArgs): { subject: string; html: string } {
  const tierLabel = sponsorTierLabel(sponsor);
  const tier = getSponsorTier(sponsor.tier_key);
  const perksList = tier
    ? tier.perks.map((p) => `<li style="margin-bottom:6px;">${p}</li>`).join("")
    : "";

  const content = `
    <h1 style="margin: 0 0 16px; font-family: 'Montserrat', sans-serif; font-size: 28px; color: ${BRAND.dark}; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px;">
      You&rsquo;re <span style="color: ${BRAND.green};">confirmed.</span>
    </h1>

    <p style="margin: 0 0 18px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      Hi <strong>${sponsor.contact_name}</strong>,
    </p>

    <p style="margin: 0 0 25px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      <strong>${sponsor.organisation_name}</strong> is officially a
      <strong>${tierLabel}</strong> partner for ${FESTIVAL.title}.
      We&rsquo;re so grateful — your support is the difference between 100 and 500 children walking into class with confidence.
    </p>

    ${
      perksList
        ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 20px;">
             <tr>
               <td style="padding: 22px 24px; text-align: left;">
                 <p style="margin: 0 0 10px; font-family: 'Montserrat', sans-serif; font-size: 12px; color: ${BRAND.blue}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                   Your tier includes
                 </p>
                 <ul style="margin: 0; padding-left: 20px; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark}; line-height: 1.6;">
                   ${perksList}
                 </ul>
               </td>
             </tr>
           </table>`
        : ""
    }

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.pale}; border-radius: 12px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 18px 22px; text-align: left;">
          <p style="margin: 0 0 8px; font-family: 'Montserrat', sans-serif; font-size: 12px; color: ${BRAND.blue}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
            We&rsquo;ll need from you
          </p>
          <p style="margin: 0 0 6px; font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.6; color: ${BRAND.dark};">
            • A high-resolution logo (PNG with transparent background, or SVG)
          </p>
          <p style="margin: 0 0 6px; font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.6; color: ${BRAND.dark};">
            • A short line of copy if you&rsquo;d like one used in social posts
          </p>
          <p style="margin: 0; font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.6; color: ${BRAND.dark};">
            Just reply to this email with anything you&rsquo;d like included.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 25px 0 0; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark}; line-height: 1.6;">
      See you on the day —<br>
      <strong>The Evolution Impact Initiative team</strong>
    </p>
  `;

  return {
    subject: `Confirmed: ${sponsor.organisation_name} sponsoring ${FESTIVAL.title}`,
    html: emailWrapper(content),
  };
}

// ============================================
// VOLUNTEER EMAILS
// ============================================

interface VolunteerEmailArgs {
  volunteer: Pick<
    FestivalVolunteer,
    "full_name" | "availability" | "t_shirt_size"
  >;
}

function availabilityLabel(
  a: FestivalVolunteer["availability"],
): string {
  if (!a) return "Flexible";
  const slots: string[] = [];
  if (a.setup) slots.push("Setup (10am–12pm)");
  if (a.am) slots.push("Festival AM (12pm–3pm)");
  if (a.pm) slots.push("Festival PM (3pm–6pm)");
  if (a.packdown) slots.push("Packdown (6pm onwards)");
  return slots.length === 0 ? "Flexible" : slots.join(" · ");
}

export function volunteerApplicationReceivedEmail({
  volunteer,
}: VolunteerEmailArgs): { subject: string; html: string } {
  const content = `
    <h1 style="margin: 0 0 16px; font-family: 'Montserrat', sans-serif; font-size: 28px; color: ${BRAND.dark}; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px;">
      Welcome to the <span style="color: ${BRAND.green};">team.</span>
    </h1>

    <p style="margin: 0 0 18px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      Hi <strong>${volunteer.full_name}</strong>,
    </p>

    <p style="margin: 0 0 25px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      Thanks for putting your hand up to volunteer at ${FESTIVAL.title}. We&rsquo;ve got your application and we&rsquo;ll come back to you with a role and shift within 5 working days.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.pale}; border-radius: 12px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 18px 22px; text-align: left;">
          <p style="margin: 0 0 6px; font-family: 'Montserrat', sans-serif; font-size: 12px; color: ${BRAND.blue}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
            What you told us
          </p>
          <p style="margin: 0 0 6px; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.6; color: ${BRAND.dark};">
            <strong>Availability:</strong> ${availabilityLabel(volunteer.availability)}
          </p>
          ${volunteer.t_shirt_size ? `<p style="margin: 0; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.6; color: ${BRAND.dark};"><strong>T-shirt:</strong> ${volunteer.t_shirt_size}</p>` : ""}
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.dark}; border-radius: 12px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 22px 24px; text-align: left;">
          <p style="margin: 0 0 6px; font-family: 'Montserrat', sans-serif; font-size: 11px; color: ${BRAND.accent}; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">
            Save the date
          </p>
          <p style="margin: 0 0 12px; font-family: 'Montserrat', sans-serif; font-size: 20px; color: #ffffff; font-weight: 800;">
            ${FESTIVAL.title}
          </p>
          <p style="margin: 0 0 4px; font-family: 'Inter', sans-serif; font-size: 14px; color: #ffffff;">
            📅 ${FESTIVAL.dateLabel} · ${FESTIVAL.timeLabel}
          </p>
          <p style="margin: 0; font-family: 'Inter', sans-serif; font-size: 14px; color: #ffffff;">
            📍 ${FESTIVAL.venueName}, ${FESTIVAL.venueArea}
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 25px 0 0; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark}; line-height: 1.6;">
      Talk soon —<br>
      <strong>The Evolution Impact Initiative team</strong>
    </p>
  `;

  return {
    subject: `You're on the ${FESTIVAL.title} volunteer team`,
    html: emailWrapper(content),
  };
}

interface VolunteerRoleArgs extends VolunteerEmailArgs {
  assignedRole: string;
  shiftNote?: string;
}

export function volunteerRoleAssignedEmail({
  volunteer,
  assignedRole,
  shiftNote,
}: VolunteerRoleArgs): { subject: string; html: string } {
  const content = `
    <h1 style="margin: 0 0 16px; font-family: 'Montserrat', sans-serif; font-size: 26px; color: ${BRAND.dark}; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px;">
      Your role for<br>${FESTIVAL.title}.
    </h1>

    <p style="margin: 0 0 18px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      Hi <strong>${volunteer.full_name}</strong>,
    </p>

    <p style="margin: 0 0 25px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      Thanks again for volunteering. We&rsquo;ve got you down for the role below — let us know straight away if anything doesn&rsquo;t work and we&rsquo;ll move things around.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.dark}; border-radius: 12px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 22px 24px; text-align: left;">
          <p style="margin: 0 0 6px; font-family: 'Montserrat', sans-serif; font-size: 11px; color: ${BRAND.accent}; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">
            Your role
          </p>
          <p style="margin: 0 0 14px; font-family: 'Montserrat', sans-serif; font-size: 22px; color: #ffffff; font-weight: 800;">
            ${assignedRole}
          </p>
          <p style="margin: 0 0 4px; font-family: 'Inter', sans-serif; font-size: 14px; color: #ffffff;">
            <strong>Availability:</strong> ${availabilityLabel(volunteer.availability)}
          </p>
          ${volunteer.t_shirt_size ? `<p style="margin: 0; font-family: 'Inter', sans-serif; font-size: 14px; color: #ffffff;"><strong>T-shirt:</strong> ${volunteer.t_shirt_size}</p>` : ""}
        </td>
      </tr>
    </table>

    ${
      shiftNote
        ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.pale}; border-radius: 12px; margin-bottom: 20px;">
             <tr>
               <td style="padding: 18px 22px; text-align: left;">
                 <p style="margin: 0 0 6px; font-family: 'Montserrat', sans-serif; font-size: 12px; color: ${BRAND.blue}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">From the team</p>
                 <p style="margin: 0; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.7; color: ${BRAND.dark}; white-space: pre-wrap;">${shiftNote}</p>
               </td>
             </tr>
           </table>`
        : ""
    }

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 22px 24px; text-align: left;">
          <p style="margin: 0 0 8px; font-family: 'Montserrat', sans-serif; font-size: 12px; color: ${BRAND.blue}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
            On the day
          </p>
          <p style="margin: 0 0 6px; font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.7; color: ${BRAND.dark};">
            • Arrive a few minutes before your shift starts
          </p>
          <p style="margin: 0 0 6px; font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.7; color: ${BRAND.dark};">
            • Your Evolution Impact T-shirt will be waiting for you
          </p>
          <p style="margin: 0; font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.7; color: ${BRAND.dark};">
            • Refreshments will be available all day
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 25px 0 0; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark}; line-height: 1.6;">
      See you on the day —<br>
      <strong>The Evolution Impact Initiative team</strong>
    </p>
  `;

  return {
    subject: `Your role for ${FESTIVAL.title}`,
    html: emailWrapper(content),
  };
}
