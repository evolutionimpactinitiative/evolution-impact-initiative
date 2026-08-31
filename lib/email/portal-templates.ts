const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://evolutionimpactinitiative.co.uk";
const LOGO_URL = "https://evolutionimpactinitiative.co.uk/logos/evolution_full_logo_1.png";
const CIN_LOGO_URL = "https://evolutionimpactinitiative.co.uk/logos/bbc-children-in-need.png";

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
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 12px;">
              <tr>
                <td style="padding-right:10px;vertical-align:middle;">
                  <img src="${CIN_LOGO_URL}" alt="BBC Children in Need" width="72" style="display:block;height:auto;max-width:72px;" />
                </td>
                <td style="vertical-align:middle;font-size:11px;color:#888;text-align:left;">
                  Funded by BBC Children in Need<br />
                  <span style="color:#aaa;">We Move Fwd: Foundations</span>
                </td>
              </tr>
            </table>
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
