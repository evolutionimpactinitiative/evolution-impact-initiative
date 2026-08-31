import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import { portalVerifyEmail } from "@/lib/email/portal-templates";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://evolutionimpactinitiative.co.uk";

export async function POST(request: Request) {
  const { email } = await request.json().catch(() => ({ email: "" }));
  const clean = String(email || "").trim().toLowerCase();

  if (!clean) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: carer } = await (admin as any)
    .from("parent_carers")
    .select("name, email")
    .eq("email", clean)
    .maybeSingle();

  // Don't leak whether an account exists — always respond OK.
  if (!carer) return NextResponse.json({ ok: true });

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: clean,
    options: {
      redirectTo: `${BASE_URL}/auth/portal-callback?next=/portal/family`,
    },
  });

  if (linkError || !linkData?.properties?.action_link) {
    return NextResponse.json({ ok: true });
  }

  const resend = getResendClient();
  if (resend) {
    const { subject, html } = portalVerifyEmail({
      name: carer.name,
      verifyUrl: linkData.properties.action_link,
    });
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: clean,
        replyTo: REPLY_TO_EMAIL,
        subject,
        html,
      });
    } catch (err) {
      console.error("Failed to resend portal verify email", err);
    }
  }

  return NextResponse.json({ ok: true });
}
