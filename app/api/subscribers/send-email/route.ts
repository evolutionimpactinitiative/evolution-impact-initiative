import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://evolutionimpactinitiative.co.uk";
const LOGO_URL = "https://evolutionimpactinitiative.co.uk/logos/evolution_full_logo_2.png";

export async function POST(request: NextRequest) {
  try {
    const { recipientEmail, recipientName, subject, body } = await request.json();

    if (!recipientEmail || !subject || !body) {
      return NextResponse.json(
        { error: "Email, subject, and body are required" },
        { status: 400 }
      );
    }

    // Generate HTML email with branding
    const html = generateEmailHtml(recipientName || "there", subject, body, recipientEmail);

    await resend.emails.send({
      from: "Evolution Impact Initiative <noreply@evolutionimpactinitiative.co.uk>",
      to: recipientEmail,
      subject,
      html,
    });

    // Log the email
    try {
      const supabase = await createClient();
      await supabase.from("email_logs" as "profiles").insert({
        recipient_email: recipientEmail,
        recipient_name: recipientName || null,
        subject,
        email_type: "individual",
        status: "sent",
      } as never);
    } catch (logError) {
      console.error("Failed to log email:", logError);
    }

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Send email error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}

function generateEmailHtml(
  recipientName: string,
  subject: string,
  body: string,
  recipientEmail: string
): string {
  // Convert newlines to <br> for HTML
  const htmlBody = body.replace(/\n/g, "<br>");
  const unsubscribeLink = `${BASE_URL}/unsubscribe?email=${encodeURIComponent(recipientEmail)}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
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
          <td style="background-color: #ffffff; border-radius: 8px; padding: 40px; text-align: left;">
            <p style="margin: 0 0 25px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 26px; color: #555555;">
              ${htmlBody}
            </p>
          </td>
        </tr>
      </table>

      <!-- Footer -->
      <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="border-top: 3px solid #17559D; padding: 30px; text-align: center;">
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
              <a href="${unsubscribeLink}" style="color: #17559D; text-decoration: underline;">Unsubscribe</a>
              &nbsp;&nbsp;|&nbsp;&nbsp;
              <a href="${BASE_URL}" style="color: #17559D; text-decoration: underline;">Visit Website</a>
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
