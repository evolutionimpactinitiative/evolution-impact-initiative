const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://evolutionimpactinitiative.co.uk";
const LOGO_URL = "https://evolutionimpactinitiative.co.uk/logos/evolution_full_logo_1.png";
const CIN_LOGO_URL = "https://evolutionimpactinitiative.co.uk/logos/BBC_Children_in_Need_2022.png";

const BRAND = {
  blue: "#17559D",
  green: "#31B67D",
  pale: "#DCECFF",
  dark: "#1E1E1E",
};

function shell(inner: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Growing Together</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f4f6f8;">
  <center style="width:100%;background-color:#f4f6f8;">
    <div style="max-width:600px;margin:0 auto;padding:0 16px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding:30px 20px;text-align:center;">
            <a href="${BASE_URL}/growing-together" style="text-decoration:none;">
              <img src="${LOGO_URL}" alt="Evolution Impact Initiative" width="200" style="display:block;margin:0 auto;max-width:200px;height:auto;" />
            </a>
          </td>
        </tr>
      </table>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="background-color:#ffffff;border-radius:12px;padding:40px 32px;border:1px solid #e5e7eb;">
            ${inner}
          </td>
        </tr>
      </table>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding:24px 20px;text-align:center;">
            <p style="margin:0 0 6px;font-size:10px;color:#888;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;">
              Funded by
            </p>
            <img src="${CIN_LOGO_URL}" alt="BBC Children in Need" width="120" style="display:block;margin:0 auto 16px;height:auto;max-width:120px;" />
            <p style="margin:0 0 6px;font-size:13px;color:#555;font-weight:600;">Growing Together · Evolution Impact Initiative CIC</p>
            <p style="margin:0 0 8px;font-size:12px;color:#888;">86 King Street, Rochester, Kent, ME1 1YD</p>
            <p style="margin:0;font-size:11px;color:#aaa;">Company No. 16667870 · Registered in England &amp; Wales</p>
          </td>
        </tr>
      </table>
    </div>
  </center>
</body>
</html>`;
}

export function portalVerifyEmail(params: {
  name: string;
  verifyUrl: string;
}): { subject: string; html: string } {
  const subject = "Confirm your Growing Together account";
  const html = shell(`
    <h1 style="margin:0 0 16px;font-family:'Montserrat',sans-serif;font-size:22px;color:${BRAND.dark};font-weight:800;">
      Welcome, ${params.name}
    </h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#444;">
      You&rsquo;re one click away from joining <strong>Growing Together</strong> — our free Early Years programme for children aged 0–5 and their parents and carers.
    </p>
    <p style="margin:0 0 24px;font-size:15px;line-height:24px;color:#444;">
      Please confirm your email address so we know it&rsquo;s really you.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 24px;">
      <tr>
        <td style="background-color:${BRAND.blue};border-radius:8px;">
          <a href="${params.verifyUrl}" style="display:inline-block;padding:14px 28px;font-family:'Montserrat',sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
            Confirm my email
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:13px;color:#777;">
      Or copy and paste this link into your browser:
    </p>
    <p style="margin:0 0 24px;font-size:12px;color:${BRAND.blue};word-break:break-all;">
      ${params.verifyUrl}
    </p>
    <p style="margin:0;font-size:12px;color:#999;">
      If you didn&rsquo;t create an account, you can safely ignore this email.
    </p>
  `);
  return { subject, html };
}

export function portalWelcomeEmail(params: {
  name: string;
  familyUrl: string;
}): { subject: string; html: string } {
  const subject = "You're in — welcome to Growing Together";
  const html = shell(`
    <h1 style="margin:0 0 16px;font-family:'Montserrat',sans-serif;font-size:22px;color:${BRAND.dark};font-weight:800;">
      Welcome to Growing Together, ${params.name}
    </h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#444;">
      Your account is confirmed. Here&rsquo;s what to do next:
    </p>
    <ol style="margin:0 0 24px;padding-left:20px;font-size:15px;line-height:24px;color:#444;">
      <li style="margin-bottom:8px;">Add your child (or children) to your family.</li>
      <li style="margin-bottom:8px;">Browse upcoming Growing Together sessions.</li>
      <li>Register your family for the ones that suit you.</li>
    </ol>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 24px;">
      <tr>
        <td style="background-color:${BRAND.blue};border-radius:8px;">
          <a href="${params.familyUrl}" style="display:inline-block;padding:14px 28px;font-family:'Montserrat',sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
            Add my family
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#777;">
      Questions? Reply to this email — we&rsquo;re here to help.
    </p>
  `);
  return { subject, html };
}

export function portalBaselineInviteEmail(params: {
  name: string;
  url: string;
}): { subject: string; html: string } {
  const subject = "A quick 2-minute Growing Together check-in";
  const html = shell(`
    <h1 style="margin:0 0 16px;font-family:'Montserrat',sans-serif;font-size:22px;color:${BRAND.dark};font-weight:800;">
      Thanks for joining us, ${params.name}
    </h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#444;">
      Now that your family has been to a Growing Together session, we&rsquo;d love to hear how things are for you today.
    </p>
    <p style="margin:0 0 24px;font-size:15px;line-height:24px;color:#444;">
      This is our <strong>baseline check-in</strong> — 6 short statements about confidence, connection and belonging. We&rsquo;ll ask again in a few months so we can see how your family is growing. Takes about 2 minutes.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 24px;">
      <tr>
        <td style="background-color:${BRAND.blue};border-radius:8px;">
          <a href="${params.url}" style="display:inline-block;padding:14px 28px;font-family:'Montserrat',sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
            Start the check-in
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:13px;color:#777;">Or copy this link:</p>
    <p style="margin:0;font-size:12px;color:${BRAND.blue};word-break:break-all;">${params.url}</p>
  `);
  return { subject, html };
}

export function portalSessionFeedbackEmail(params: {
  name: string;
  sessionTitle: string;
  url: string;
}): { subject: string; html: string } {
  const subject = `How was ${params.sessionTitle}?`;
  const html = shell(`
    <h1 style="margin:0 0 16px;font-family:'Montserrat',sans-serif;font-size:22px;color:${BRAND.dark};font-weight:800;">
      Thanks for coming, ${params.name}
    </h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#444;">
      We&rsquo;d love your quick take on <strong>${params.sessionTitle}</strong>. Your feedback shapes what we do next.
    </p>
    <p style="margin:0 0 24px;font-size:15px;line-height:24px;color:#444;">
      Five short questions, under two minutes.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 24px;">
      <tr>
        <td style="background-color:${BRAND.blue};border-radius:8px;">
          <a href="${params.url}" style="display:inline-block;padding:14px 28px;font-family:'Montserrat',sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
            Share feedback
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#777;">
      Prefer to reply? Just hit reply to this email.
    </p>
  `);
  return { subject, html };
}

export function portalPasswordResetEmail(params: {
  name: string;
  resetUrl: string;
}): { subject: string; html: string } {
  const subject = "Reset your Growing Together password";
  const html = shell(`
    <h1 style="margin:0 0 16px;font-family:'Montserrat',sans-serif;font-size:22px;color:${BRAND.dark};font-weight:800;">
      Reset your password
    </h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#444;">
      Hi ${params.name}, we got a request to reset your Growing Together password. Click below to set a new one.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 24px;">
      <tr>
        <td style="background-color:${BRAND.blue};border-radius:8px;">
          <a href="${params.resetUrl}" style="display:inline-block;padding:14px 28px;font-family:'Montserrat',sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
            Reset password
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:12px;color:#999;">
      If you didn&rsquo;t ask for this, you can safely ignore this email — your password won&rsquo;t change.
    </p>
  `);
  return { subject, html };
}

// ============================================
// Our Village — per-post + daily digest emails
// ============================================

const CATEGORY_LABEL: Record<string, string> = {
  activity: "Activity",
  announcement: "Announcement",
  local_service: "Local service",
  programme_update: "Programme update",
  resource: "Resource",
};

// Strip HTML tags for an excerpt. Village post body comes from Tiptap
// so safe to naively strip for a text preview.
function excerpt(html: string | null | undefined, max = 220): string {
  if (!html) return "";
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > max ? text.slice(0, max - 1).trimEnd() + "…" : text;
}

function villagePreferencesLine(prefsUrl: string): string {
  return `
    <p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#999;text-align:center;">
      You&rsquo;re receiving this because you&rsquo;re part of the Growing Together village.
      <a href="${prefsUrl}" style="color:${BRAND.blue};text-decoration:underline;">Change how often we email you</a>.
    </p>
  `;
}

export function villagePostEmail(params: {
  parentName: string;
  post: {
    title: string;
    body: string | null;
    category: string;
    author_name: string | null;
    cover_image_url: string | null;
  };
  viewUrl: string;
  prefsUrl: string;
}): { subject: string; html: string } {
  const { parentName, post, viewUrl, prefsUrl } = params;
  const subject = `Our Village: ${post.title}`;
  const label = CATEGORY_LABEL[post.category] || "Village";
  const preview = excerpt(post.body);
  const cover = post.cover_image_url
    ? `<img src="${post.cover_image_url}" alt="" width="536" style="display:block;width:100%;max-width:536px;height:auto;border-radius:8px;margin:0 0 20px;" />`
    : "";
  const byline = post.author_name
    ? `<p style="margin:0 0 20px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.08em;">Posted by ${post.author_name}</p>`
    : "";

  const html = shell(`
    <p style="margin:0 0 8px;font-size:11px;color:${BRAND.green};font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">
      ${label} · Our Village
    </p>
    <h1 style="margin:0 0 16px;font-family:'Montserrat',sans-serif;font-size:22px;color:${BRAND.dark};font-weight:800;line-height:1.3;">
      ${post.title}
    </h1>
    ${byline}
    ${cover}
    <p style="margin:0 0 24px;font-size:15px;line-height:24px;color:#444;">
      ${preview || `Hi ${parentName}, there&rsquo;s a new post for you in Our Village.`}
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 8px;">
      <tr>
        <td style="background-color:${BRAND.blue};border-radius:8px;">
          <a href="${viewUrl}" style="display:inline-block;padding:14px 28px;font-family:'Montserrat',sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
            Read the full post
          </a>
        </td>
      </tr>
    </table>
    ${villagePreferencesLine(prefsUrl)}
  `);
  return { subject, html };
}

// ============================================
// Chat — team reply + new family message
// ============================================

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function quoteBlock(body: string): string {
  // Preserve newlines in the message body while escaping HTML.
  return escapeHtml(body).replace(/\n/g, "<br/>");
}

export function chatTeamReplyEmail(params: {
  senderName: string;
  body: string;
  viewUrl: string;
}): { subject: string; html: string } {
  const { senderName, body, viewUrl } = params;
  const subject = `${senderName} replied — Growing Together`;
  const html = shell(`
    <p style="margin:0 0 8px;font-size:11px;color:${BRAND.blue};font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">
      New message
    </p>
    <h1 style="margin:0 0 16px;font-family:'Montserrat',sans-serif;font-size:20px;color:${BRAND.dark};font-weight:800;">
      ${escapeHtml(senderName)} replied
    </h1>
    <div style="padding:16px;background-color:#f6f9fd;border-left:3px solid ${BRAND.blue};border-radius:6px;margin:0 0 20px;font-size:15px;line-height:22px;color:#333;">
      ${quoteBlock(body)}
    </div>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 8px;">
      <tr>
        <td style="background-color:${BRAND.blue};border-radius:8px;">
          <a href="${viewUrl}" style="display:inline-block;padding:14px 28px;font-family:'Montserrat',sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
            Open the conversation
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:16px 0 0;font-size:12px;color:#888;text-align:center;">
      Reply from your Growing Together portal — this email is not monitored.
    </p>
  `);
  return { subject, html };
}

export function chatNewFamilyMessageEmail(params: {
  familyName: string;
  body: string;
  adminUrl: string;
}): { subject: string; html: string } {
  const { familyName, body, adminUrl } = params;
  const subject = `New message from ${familyName}`;
  const html = shell(`
    <p style="margin:0 0 8px;font-size:11px;color:${BRAND.green};font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">
      Family message
    </p>
    <h1 style="margin:0 0 16px;font-family:'Montserrat',sans-serif;font-size:20px;color:${BRAND.dark};font-weight:800;">
      ${escapeHtml(familyName)} just messaged the team
    </h1>
    <div style="padding:16px;background-color:#f6fcf7;border-left:3px solid ${BRAND.green};border-radius:6px;margin:0 0 20px;font-size:15px;line-height:22px;color:#333;">
      ${quoteBlock(body)}
    </div>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 8px;">
      <tr>
        <td style="background-color:${BRAND.blue};border-radius:8px;">
          <a href="${adminUrl}" style="display:inline-block;padding:14px 28px;font-family:'Montserrat',sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
            Open in admin
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:16px 0 0;font-size:12px;color:#888;text-align:center;">
      Any team member can reply. First to reply gets assigned automatically.
    </p>
  `);
  return { subject, html };
}

export function villageDigestEmail(params: {
  parentName: string;
  posts: Array<{
    id: string;
    title: string;
    body: string | null;
    category: string;
  }>;
  viewUrl: string;
  prefsUrl: string;
}): { subject: string; html: string } {
  const { parentName, posts, viewUrl, prefsUrl } = params;
  const count = posts.length;
  const subject =
    count === 1
      ? `Our Village: 1 new post today`
      : `Our Village: ${count} new posts today`;

  const items = posts
    .map((p) => {
      const label = CATEGORY_LABEL[p.category] || "Village";
      const preview = excerpt(p.body, 160);
      return `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 16px;">
          <tr>
            <td style="padding:16px;background-color:#fafbfc;border:1px solid #eef0f3;border-radius:10px;">
              <p style="margin:0 0 6px;font-size:10px;color:${BRAND.green};font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">
                ${label}
              </p>
              <h3 style="margin:0 0 8px;font-family:'Montserrat',sans-serif;font-size:16px;color:${BRAND.dark};font-weight:800;line-height:1.3;">
                ${p.title}
              </h3>
              ${
                preview
                  ? `<p style="margin:0;font-size:13px;line-height:20px;color:#555;">${preview}</p>`
                  : ""
              }
            </td>
          </tr>
        </table>
      `;
    })
    .join("");

  const html = shell(`
    <h1 style="margin:0 0 8px;font-family:'Montserrat',sans-serif;font-size:22px;color:${BRAND.dark};font-weight:800;">
      Hi ${parentName}
    </h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:24px;color:#444;">
      Here&rsquo;s what&rsquo;s new in Our Village today.
    </p>
    ${items}
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:16px auto 8px;">
      <tr>
        <td style="background-color:${BRAND.blue};border-radius:8px;">
          <a href="${viewUrl}" style="display:inline-block;padding:14px 28px;font-family:'Montserrat',sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
            Open Our Village
          </a>
        </td>
      </tr>
    </table>
    ${villagePreferencesLine(prefsUrl)}
  `);
  return { subject, html };
}
