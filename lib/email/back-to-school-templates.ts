import QRCode from "qrcode";
import {
  B2S,
  SPONSOR_CONTACT,
  uniformChoicesSummary,
  type UniformChoices,
} from "@/lib/back-to-school";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://www.evolutionimpactinitiative.co.uk";
const LOGO_URL =
  "https://evolutionimpactinitiative.co.uk/logos/evolution_full_logo_1.png";

const BRAND = {
  blue: "#17559D",
  green: "#31B67D",
  accent: "#31FDA5",
  pale: "#DCECFF",
  dark: "#1E1E1E",
  amber: "#B45309",
  amberBg: "#FEF3C7",
} as const;

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${B2S.title}</title>
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

function eventDetailsBlock(): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.dark}; border-radius: 12px; margin: 22px 0;">
      <tr>
        <td style="padding: 22px 24px; text-align: left;">
          <p style="margin: 0 0 6px; font-family: 'Montserrat', sans-serif; font-size: 11px; color: ${BRAND.accent}; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">
            Distribution day
          </p>
          <p style="margin: 0 0 12px; font-family: 'Montserrat', sans-serif; font-size: 20px; color: #ffffff; font-weight: 800;">
            ${B2S.title}
          </p>
          <p style="margin: 0 0 4px; font-family: 'Inter', sans-serif; font-size: 14px; color: #ffffff;">
            📅 ${B2S.dateLabel} · ${B2S.timeLabel}
          </p>
          <p style="margin: 0 0 4px; font-family: 'Inter', sans-serif; font-size: 14px; color: #ffffff;">
            📍 ${B2S.venueName}
          </p>
          <p style="margin: 0; font-family: 'Inter', sans-serif; font-size: 13px; color: rgba(255,255,255,0.75);">
            ${B2S.venueAddress}
          </p>
        </td>
      </tr>
    </table>
  `;
}

// ============================================
// 1. Registration received: sent immediately after form submit
// ============================================

interface RegistrationReceivedArgs {
  parentName: string;
  childrenCount: number;
}

export function registrationReceivedEmail({
  parentName,
  childrenCount,
}: RegistrationReceivedArgs): { subject: string; html: string } {
  const content = `
    <h1 style="margin: 0 0 16px; font-family: 'Montserrat', sans-serif; font-size: 26px; color: ${BRAND.dark}; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px;">
      We&rsquo;ve got your <span style="color: ${BRAND.green};">registration.</span>
    </h1>

    <p style="margin: 0 0 18px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      Hi <strong>${parentName}</strong>,
    </p>

    <p style="margin: 0 0 18px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      Thanks for registering ${childrenCount === 1 ? "your child" : `${childrenCount} children`} for the ${B2S.title}. Your registration is in and we&rsquo;ll review it shortly.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.pale}; border-radius: 12px; margin-bottom: 18px;">
      <tr>
        <td style="padding: 20px 22px; text-align: left;">
          <p style="margin: 0 0 8px; font-family: 'Montserrat', sans-serif; font-size: 12px; color: ${BRAND.blue}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
            What happens next
          </p>
          <p style="margin: 0 0 8px; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.6; color: ${BRAND.dark};">
            We&rsquo;ll email you again on <strong>${B2S.approvalEmailLabel}</strong> with an approval and a QR code. Please bring the QR (printed or on your phone) so you&rsquo;ll be scanned in on arrival.
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.amberBg}; border-radius: 12px; margin-bottom: 6px;">
      <tr>
        <td style="padding: 20px 22px; text-align: left;">
          <p style="margin: 0 0 10px; font-family: 'Montserrat', sans-serif; font-size: 12px; color: ${BRAND.amber}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
            Please remember
          </p>
          <p style="margin: 0 0 6px; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.6; color: ${BRAND.dark};">
            &bull; Registration <strong>does not guarantee supplies</strong>. It&rsquo;s first come, first served on the day.
          </p>
          <p style="margin: 0 0 6px; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.6; color: ${BRAND.dark};">
            &bull; Stock is limited. We stock uniforms across a range of ages but may not have every size or item.
          </p>
          <p style="margin: 0; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.6; color: ${BRAND.dark};">
            &bull; Please arrive early on the day.
          </p>
        </td>
      </tr>
    </table>

    ${eventDetailsBlock()}

    <p style="margin: 25px 0 0; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark}; line-height: 1.6;">
      See you on the ${B2S.dateLabel.split(" ")[1]}th,<br>
      <strong>The Evolution Impact Initiative team</strong>
    </p>
  `;

  return {
    subject: `We've got your ${B2S.title} registration`,
    html: emailWrapper(content),
  };
}

// ============================================
// 1b. Waitlist received — sent immediately when registrations are in
//     waitlist mode. Warm, hopeful tone; no scary "closed" language.
// ============================================

interface WaitlistReceivedArgs {
  parentName: string;
  childrenCount: number;
}

export function waitlistReceivedEmail({
  parentName,
  childrenCount,
}: WaitlistReceivedArgs): { subject: string; html: string } {
  const kidsLabel =
    childrenCount === 1 ? "your child" : `your ${childrenCount} children`;
  const content = `
    <h1 style="margin: 0 0 16px; font-family: 'Montserrat', sans-serif; font-size: 26px; color: ${BRAND.dark}; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px;">
      You&rsquo;re <span style="color: ${BRAND.green};">on the list.</span>
    </h1>

    <p style="margin: 0 0 18px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      Hi <strong>${parentName}</strong>,
    </p>

    <p style="margin: 0 0 18px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      Thank you for signing up &mdash; we&rsquo;ve added ${kidsLabel} to the waitlist for our ${B2S.title} on <strong>${B2S.dateLabel}</strong>.
    </p>

    <p style="margin: 0 0 18px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      This year, more Medway families have joined the drive than ever before. We&rsquo;re working hard between now and the day to open up more places, and we&rsquo;ll email you the moment we can confirm a spot for your family.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.pale}; border-radius: 12px; margin-bottom: 18px;">
      <tr>
        <td style="padding: 20px 22px; text-align: left;">
          <p style="margin: 0 0 8px; font-family: 'Montserrat', sans-serif; font-size: 12px; color: ${BRAND.blue}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
            Help us reach more children
          </p>
          <p style="margin: 0; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.6; color: ${BRAND.dark};">
            If you know a business, church, or friend who might want to support the drive, please share it with them &mdash; every bit of help means one more child ready for the classroom.
          </p>
          <p style="margin: 12px 0 0; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.6; color: ${BRAND.dark};">
            <a href="${BASE_URL}/back-to-school" style="color: ${BRAND.blue}; text-decoration: underline; font-weight: 600;">${BASE_URL.replace(/^https?:\/\//, "")}/back-to-school</a>
          </p>
        </td>
      </tr>
    </table>

    ${eventDetailsBlock()}

    <p style="margin: 25px 0 0; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark}; line-height: 1.6;">
      With thanks,<br>
      <strong>The Evolution Impact Initiative team</strong>
    </p>
  `;

  return {
    subject: `You're on the ${B2S.title} waitlist`,
    html: emailWrapper(content),
  };
}

// ============================================
// 1c. Waitlist promoted — a place has opened up. Sent when admin
//     manually moves a waitlisted registration into pending. The
//     usual approval email (with QR code) still goes out on 21 Aug.
// ============================================

interface WaitlistPromotedArgs {
  parentName: string;
  childrenCount: number;
}

export function waitlistPromotedEmail({
  parentName,
  childrenCount,
}: WaitlistPromotedArgs): { subject: string; html: string } {
  const kidsLabel =
    childrenCount === 1 ? "your child" : `your ${childrenCount} children`;
  const content = `
    <h1 style="margin: 0 0 16px; font-family: 'Montserrat', sans-serif; font-size: 26px; color: ${BRAND.dark}; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px;">
      Great news &mdash; <span style="color: ${BRAND.green};">a place has opened up.</span>
    </h1>

    <p style="margin: 0 0 18px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      Hi <strong>${parentName}</strong>,
    </p>

    <p style="margin: 0 0 18px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      We&rsquo;re delighted to let you know we&rsquo;ve been able to offer ${kidsLabel} a place at our ${B2S.title} on <strong>${B2S.dateLabel}</strong>.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.pale}; border-radius: 12px; margin-bottom: 18px;">
      <tr>
        <td style="padding: 20px 22px; text-align: left;">
          <p style="margin: 0 0 8px; font-family: 'Montserrat', sans-serif; font-size: 12px; color: ${BRAND.blue}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
            What happens next
          </p>
          <p style="margin: 0; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.6; color: ${BRAND.dark};">
            On <strong>${B2S.approvalEmailLabel}</strong> we&rsquo;ll send you a final approval email with a QR code. Please bring it (printed or on your phone) so we can scan you in on arrival.
          </p>
        </td>
      </tr>
    </table>

    ${eventDetailsBlock()}

    <p style="margin: 25px 0 0; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark}; line-height: 1.6;">
      See you on the ${B2S.dateLabel.split(" ")[1]}th,<br>
      <strong>The Evolution Impact Initiative team</strong>
    </p>
  `;

  return {
    subject: `A place has opened up for you at the ${B2S.title}`,
    html: emailWrapper(content),
  };
}

// ============================================
// 2. Registration approved: sent 21 Aug 6PM with QR code
// ============================================

interface ChildSummary {
  child_name: string;
  child_age: number | null;
  uniform_size: string | null;
  needs: string[] | null;
  uniform_choices: UniformChoices | null;
}

interface RegistrationApprovedArgs {
  parentName: string;
  qrToken: string;
  children: ChildSummary[];
}

const NEED_LABEL: Record<string, string> = {
  uniform: "Uniform",
  stationery: "Stationery",
  bag: "School bag",
};

function needsLabel(needs: string[] | null): string {
  if (!needs || needs.length === 0) return "-";
  return needs.map((n) => NEED_LABEL[n] || n).join(", ");
}

export function verifyUrl(qrToken: string): string {
  return `${BASE_URL.replace(/\/$/, "")}/b2s/verify/${qrToken}`;
}

// ============================================
// 1d. Walk-in received — sent immediately when a family registers at
//     the venue via the walk-in QR (Station 1). Includes their QR + a
//     reminder to come back at 3-4pm. Skipped only if we can't send.
// ============================================

interface WalkInReceivedArgs {
  parentName: string;
  qrToken: string;
  reference: string; // short id shown on the ticket
  childrenCount: number;
}

export async function walkInReceivedEmail({
  parentName,
  qrToken,
  reference,
  childrenCount,
}: WalkInReceivedArgs): Promise<{
  subject: string;
  html: string;
  attachments: Array<{ filename: string; content: string; contentId: string }>;
}> {
  const url = verifyUrl(qrToken);
  const dataUrl = await QRCode.toDataURL(url, {
    width: 480,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: BRAND.dark, light: "#ffffff" },
  });
  const base64 = dataUrl.split(",")[1] ?? "";
  const contentId = `b2s-walkin-qr-${qrToken}`;

  const kidsLabel =
    childrenCount === 1 ? "your child" : `your ${childrenCount} children`;

  const content = `
    <h1 style="margin: 0 0 16px; font-family: 'Montserrat', sans-serif; font-size: 26px; color: ${BRAND.dark}; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px;">
      You&rsquo;re <span style="color: ${BRAND.green};">on the list.</span>
    </h1>

    <p style="margin: 0 0 18px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      Hi <strong>${parentName}</strong>,
    </p>

    <p style="margin: 0 0 18px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      Thanks for registering ${kidsLabel} at the venue. Come back to us
      between <strong>3pm and 4pm today</strong> and we&rsquo;ll get you sorted
      from whatever stock we have left.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.pale}; border-radius: 12px; margin: 22px 0;">
      <tr>
        <td style="padding: 22px 24px; text-align: center;">
          <p style="margin: 0 0 6px; font-family: 'Montserrat', sans-serif; font-size: 11px; color: ${BRAND.blue}; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">
            Your walk-in QR
          </p>
          <img src="cid:${contentId}" alt="Walk-in QR" width="200" height="200" style="display: block; margin: 8px auto; background: #fff; padding: 8px; border-radius: 8px;" />
          <p style="margin: 6px 0 0; font-family: 'Courier New', monospace; font-size: 14px; color: ${BRAND.dark}; font-weight: 700; letter-spacing: 1px;">
            Ref: ${reference}
          </p>
          <p style="margin: 6px 0 0; font-family: 'Inter', sans-serif; font-size: 12px; color: #666;">
            Show this at the door — either the QR above or tell us your name.
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.amberBg}; border-radius: 12px; margin-bottom: 6px;">
      <tr>
        <td style="padding: 18px 22px; text-align: left;">
          <p style="margin: 0 0 6px; font-family: 'Montserrat', sans-serif; font-size: 11px; color: ${BRAND.amber}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
            Nothing is guaranteed
          </p>
          <p style="margin: 0; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.6; color: ${BRAND.dark};">
            Walk-ins are served <strong>first-come, first-served</strong> from
            whatever stock is left after the registered families have collected.
            Please come back at 3pm.
          </p>
        </td>
      </tr>
    </table>

    ${eventDetailsBlock()}

    <p style="margin: 25px 0 0; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark}; line-height: 1.6;">
      See you soon,<br>
      <strong>The Evolution Impact Initiative team</strong>
    </p>
  `;

  return {
    subject: `You're on the ${B2S.title} walk-in list — come back at 3pm`,
    html: emailWrapper(content),
    attachments: [
      {
        filename: `b2s-walkin-${reference}.png`,
        content: base64,
        contentId,
      },
    ],
  };
}


export async function registrationApprovedEmail({
  parentName,
  qrToken,
  children,
}: RegistrationApprovedArgs): Promise<{
  subject: string;
  html: string;
  attachments: Array<{ filename: string; content: string; contentId: string }>;
}> {
  const url = verifyUrl(qrToken);
  const dataUrl = await QRCode.toDataURL(url, {
    width: 480,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: BRAND.dark, light: "#ffffff" },
  });
  const base64 = dataUrl.split(",")[1] ?? "";
  const contentId = `b2s-qr-${qrToken}`;

  const childRows = children
    .map((c) => {
      const uniformLine = c.uniform_choices
        ? `<br><span style="font-size: 13px; color: ${BRAND.blue}; font-weight: 600;">Uniform: ${uniformChoicesSummary(c.uniform_choices)}</span>`
        : "";
      return `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid ${BRAND.pale}; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark};">
            <strong>${c.child_name}</strong>${c.child_age != null ? ` <span style="color: #888888;">(age ${c.child_age})</span>` : ""}
            <br>
            <span style="font-size: 13px; color: #666666;">Size ${c.uniform_size ?? "-"} · ${needsLabel(c.needs)}</span>
            ${uniformLine}
          </td>
        </tr>
      `;
    })
    .join("");

  const content = `
    <h1 style="margin: 0 0 16px; font-family: 'Montserrat', sans-serif; font-size: 26px; color: ${BRAND.dark}; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px;">
      You&rsquo;re <span style="color: ${BRAND.green};">approved.</span>
    </h1>

    <p style="margin: 0 0 18px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      Hi <strong>${parentName}</strong>,
    </p>

    <p style="margin: 0 0 22px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      Your ${B2S.title} registration has been approved. Bring the QR code below on the day, and our team will scan it on arrival.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border: 2px solid ${BRAND.pale}; border-radius: 16px; margin-bottom: 22px;">
      <tr>
        <td style="padding: 24px; text-align: center;">
          <img src="cid:${contentId}" alt="Your QR code" width="240" style="display: block; margin: 0 auto; width: 240px; height: 240px;" />
          <p style="margin: 14px 0 0; font-family: 'Inter', sans-serif; font-size: 12px; color: #888888; word-break: break-all;">
            Or open: <a href="${url}" style="color: ${BRAND.blue};">${url}</a>
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.pale}; border-radius: 12px; margin-bottom: 22px;">
      <tr>
        <td style="padding: 20px 22px; text-align: left;">
          <p style="margin: 0 0 10px; font-family: 'Montserrat', sans-serif; font-size: 12px; color: ${BRAND.blue}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
            Your registration
          </p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            ${childRows}
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.amberBg}; border-radius: 12px; margin-bottom: 6px;">
      <tr>
        <td style="padding: 20px 22px; text-align: left;">
          <p style="margin: 0 0 10px; font-family: 'Montserrat', sans-serif; font-size: 12px; color: ${BRAND.amber}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
            On the day
          </p>
          <p style="margin: 0 0 6px; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.6; color: ${BRAND.dark};">
            &bull; Please <strong>arrive early</strong>. Supplies are first come, first served.
          </p>
          <p style="margin: 0 0 6px; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.6; color: ${BRAND.dark};">
            &bull; Approval doesn&rsquo;t guarantee every size or item, but we&rsquo;ll do our best.
          </p>
          <p style="margin: 0; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.6; color: ${BRAND.dark};">
            &bull; Bring the QR code above (printed or on your phone).
          </p>
        </td>
      </tr>
    </table>

    ${eventDetailsBlock()}

    <p style="margin: 25px 0 0; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark}; line-height: 1.6;">
      See you soon,<br>
      <strong>The Evolution Impact Initiative team</strong>
    </p>
  `;

  return {
    subject: `You're approved for the ${B2S.title}. Bring this QR.`,
    html: emailWrapper(content),
    attachments: [
      {
        filename: `back-to-school-qr-${qrToken}.png`,
        content: base64,
        contentId,
      },
    ],
  };
}

// ============================================
// 3. Supply pledge received
// ============================================

interface SupplyPledgeReceivedArgs {
  donorName: string;
  itemCount: number;
  deliveryMethod: "drop_off" | "collection";
}

export function supplyPledgeReceivedEmail({
  donorName,
  itemCount,
  deliveryMethod,
}: SupplyPledgeReceivedArgs): { subject: string; html: string } {
  const methodCopy =
    deliveryMethod === "collection"
      ? "we&rsquo;ll be in touch to arrange a collection from your address"
      : "we&rsquo;ll send you drop-off details shortly";

  const content = `
    <h1 style="margin: 0 0 16px; font-family: 'Montserrat', sans-serif; font-size: 26px; color: ${BRAND.dark}; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px;">
      Thank <span style="color: ${BRAND.green};">you.</span>
    </h1>

    <p style="margin: 0 0 18px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      Hi <strong>${donorName}</strong>,
    </p>

    <p style="margin: 0 0 18px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      We&rsquo;ve received your pledge to donate ${itemCount} ${itemCount === 1 ? "item" : "items"} to the ${B2S.title}. Every donation gets a child ready for the new school year.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.pale}; border-radius: 12px; margin-bottom: 22px;">
      <tr>
        <td style="padding: 20px 22px; text-align: left;">
          <p style="margin: 0 0 8px; font-family: 'Montserrat', sans-serif; font-size: 12px; color: ${BRAND.blue}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
            What happens next
          </p>
          <p style="margin: 0; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.6; color: ${BRAND.dark};">
            ${methodCopy}. Please make sure any items are <strong>brand new</strong>. Once we&rsquo;ve confirmed, we&rsquo;ll send a follow-up email.
          </p>
        </td>
      </tr>
    </table>

    ${eventDetailsBlock()}

    <p style="margin: 25px 0 0; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark}; line-height: 1.6;">
      With gratitude,<br>
      <strong>The Evolution Impact Initiative team</strong>
    </p>
  `;

  return {
    subject: `Thank you for your ${B2S.title} pledge`,
    html: emailWrapper(content),
  };
}

// ============================================
// 4. Sponsor inquiry received — to the sponsor
// ============================================

const TIER_LABEL: Record<string, string> = {
  friend: "Friend (£50)",
  bronze: "Bronze (£100)",
  silver: "Silver (£250)",
  gold: "Gold (£500)",
  family: "Family (£750)",
  champion: "Back to School Champion (£1,000+)",
  major: "Community Impact Partner (£1,500)",
  title: "Title Partner (£3,000)",
  custom: "Custom amount",
  undecided: "Exploring options",
};

interface SponsorInquiryReceivedArgs {
  contactName: string;
  businessName: string;
  tier: string;
}

export function sponsorInquiryReceivedEmail({
  contactName,
  businessName,
  tier,
}: SponsorInquiryReceivedArgs): { subject: string; html: string } {
  const content = `
    <h1 style="margin: 0 0 16px; font-family: 'Montserrat', sans-serif; font-size: 26px; color: ${BRAND.dark}; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px;">
      Thanks for backing <span style="color: ${BRAND.green};">Medway.</span>
    </h1>

    <p style="margin: 0 0 18px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      Hi <strong>${contactName}</strong>,
    </p>

    <p style="margin: 0 0 18px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
      We&rsquo;ve received your sponsorship inquiry on behalf of <strong>${businessName}</strong> at level: <strong>${TIER_LABEL[tier] || tier}</strong>. Luke will be in touch within 2 working days to arrange the details.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.pale}; border-radius: 12px; margin-bottom: 22px;">
      <tr>
        <td style="padding: 20px 22px; text-align: left;">
          <p style="margin: 0 0 8px; font-family: 'Montserrat', sans-serif; font-size: 12px; color: ${BRAND.blue}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
            Your point of contact
          </p>
          <p style="margin: 0 0 4px; font-family: 'Inter', sans-serif; font-size: 15px; color: ${BRAND.dark};">
            <strong>${SPONSOR_CONTACT.name}</strong>
          </p>
          <p style="margin: 0 0 8px; font-family: 'Inter', sans-serif; font-size: 13px; color: #666;">
            ${SPONSOR_CONTACT.role}
          </p>
          <p style="margin: 0; font-family: 'Inter', sans-serif; font-size: 13px; color: ${BRAND.dark};">
            📞 ${SPONSOR_CONTACT.mobile} · ☎️ ${SPONSOR_CONTACT.landline}<br>
            ✉️ <a href="mailto:${SPONSOR_CONTACT.email}" style="color: ${BRAND.blue};">${SPONSOR_CONTACT.email}</a>
          </p>
        </td>
      </tr>
    </table>

    ${eventDetailsBlock()}

    <p style="margin: 25px 0 0; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark}; line-height: 1.6;">
      With gratitude,<br>
      <strong>The Evolution Impact Initiative team</strong>
    </p>
  `;

  return {
    subject: `Thanks for backing the ${B2S.title}, ${businessName}`,
    html: emailWrapper(content),
  };
}

// ============================================
// 5. Sponsor inquiry — admin notification
// ============================================

interface SponsorInquiryAdminArgs {
  businessName: string;
  contactName: string;
  contactRole: string | null;
  contactEmail: string;
  contactPhone: string;
  tier: string;
  amountGbp: number | null;
  message: string | null;
}

export function sponsorInquiryAdminEmail(
  args: SponsorInquiryAdminArgs,
): { subject: string; html: string } {
  const tierLabel = TIER_LABEL[args.tier] || args.tier;
  const amountLine = args.amountGbp
    ? `<p style="margin: 0 0 6px;"><strong>Amount:</strong> £${args.amountGbp.toLocaleString("en-GB")}</p>`
    : "";
  const roleLine = args.contactRole
    ? `<p style="margin: 0 0 6px;"><strong>Role:</strong> ${args.contactRole}</p>`
    : "";
  const messageBlock = args.message
    ? `
        <p style="margin: 12px 0 4px; font-family: 'Montserrat', sans-serif; font-size: 11px; color: ${BRAND.blue}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
          Message
        </p>
        <p style="margin: 0; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.6; color: ${BRAND.dark}; white-space: pre-wrap;">${args.message}</p>
      `
    : "";

  const content = `
    <h1 style="margin: 0 0 16px; font-family: 'Montserrat', sans-serif; font-size: 22px; color: ${BRAND.dark}; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px;">
      New sponsor inquiry
    </h1>

    <p style="margin: 0 0 18px; font-family: 'Inter', sans-serif; font-size: 15px; line-height: 24px; color: #555;">
      A business has sent through a sponsorship inquiry for the ${B2S.title}. Details below. Follow up within 2 working days.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.pale}; border-radius: 12px; margin-bottom: 18px;">
      <tr>
        <td style="padding: 20px 22px; text-align: left; font-family: 'Inter', sans-serif; font-size: 14px; color: ${BRAND.dark};">
          <p style="margin: 0 0 6px;"><strong>Business:</strong> ${args.businessName}</p>
          <p style="margin: 0 0 6px;"><strong>Contact:</strong> ${args.contactName}</p>
          ${roleLine}
          <p style="margin: 0 0 6px;"><strong>Email:</strong> <a href="mailto:${args.contactEmail}" style="color: ${BRAND.blue};">${args.contactEmail}</a></p>
          <p style="margin: 0 0 6px;"><strong>Phone:</strong> <a href="tel:${args.contactPhone}" style="color: ${BRAND.blue};">${args.contactPhone}</a></p>
          <p style="margin: 0 0 6px;"><strong>Tier:</strong> ${tierLabel}</p>
          ${amountLine}
          ${messageBlock}
        </td>
      </tr>
    </table>

    <p style="margin: 20px 0 0; font-family: 'Inter', sans-serif; font-size: 13px; color: #888;">
      View + manage in the admin at
      <a href="${BASE_URL}/admin/back-to-school/sponsors" style="color: ${BRAND.blue};">/admin/back-to-school/sponsors</a>.
    </p>
  `;

  return {
    subject: `[Sponsor inquiry] ${args.businessName} · ${tierLabel}`,
    html: emailWrapper(content),
  };
}
