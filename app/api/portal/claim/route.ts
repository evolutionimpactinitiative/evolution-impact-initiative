import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import { portalVerifyEmail } from "@/lib/email/portal-templates";

// Convert an anonymous (shadow) parent_carer into a full portal account.
//
// The parent registered without creating an account; we minted a
// claim_token and emailed it to them. Clicking the link lands on
// /portal/claim where they set a password — this route then creates
// the auth.users row and binds it to their existing parent_carer so
// their previous registration + children stay attached.

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://evolutionimpactinitiative.co.uk";

interface Body {
  token: string;
  password: string;
  postcode?: string;
  relationshipToChild?: string;
  howHeardAboutGt?: string;
  preferredContactMethod?: "email" | "phone" | "sms" | "whatsapp";
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const token = body.token?.trim();
  const password = body.password;

  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: carer } = await (admin as any)
    .from("parent_carers")
    .select("id, name, email, user_id, family_id, claim_token_expires_at")
    .eq("claim_token", token)
    .maybeSingle();

  if (!carer) {
    return NextResponse.json(
      { error: "This link isn't valid. Try creating an account the normal way." },
      { status: 404 },
    );
  }
  if (carer.user_id) {
    return NextResponse.json(
      { error: "An account for this email already exists. Try logging in." },
      { status: 409 },
    );
  }
  if (
    carer.claim_token_expires_at &&
    new Date(carer.claim_token_expires_at) < new Date()
  ) {
    return NextResponse.json(
      { error: "This link has expired. Please create an account the normal way." },
      { status: 410 },
    );
  }

  const email = carer.email as string;

  // Create the auth user. email_confirm=false so Supabase requires them
  // to click our verify link before they can log in.
  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: { name: carer.name, source: "portal_claim" },
  });

  if (userError || !userData.user) {
    if (userError?.message?.toLowerCase().includes("registered")) {
      return NextResponse.json(
        {
          error:
            "An account with that email already exists. Try logging in or resetting your password.",
        },
        { status: 409 },
      );
    }
    console.error("Portal claim: createUser failed", userError);
    return NextResponse.json(
      { error: userError?.message || "Could not create account." },
      { status: 500 },
    );
  }

  const userId = userData.user.id;

  // Bind the new auth user to the existing shadow carer. Clear the
  // claim token so the link can't be used again.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: carerUpdErr } = await (admin as any)
    .from("parent_carers")
    .update({
      user_id: userId,
      relationship_to_child: body.relationshipToChild || null,
      claim_token: null,
      claim_token_expires_at: null,
    })
    .eq("id", carer.id);

  if (carerUpdErr) {
    await admin.auth.admin.deleteUser(userId);
    console.error("Portal claim: parent_carer bind failed", carerUpdErr);
    return NextResponse.json(
      { error: "Could not link your account. Please try again." },
      { status: 500 },
    );
  }

  // Optional family-level touch-ups.
  if (body.postcode || body.howHeardAboutGt || body.preferredContactMethod) {
    const familyPatch: Record<string, string> = {};
    if (body.postcode) familyPatch.postcode = body.postcode;
    if (body.howHeardAboutGt) familyPatch.how_heard_about_gt = body.howHeardAboutGt;
    if (body.preferredContactMethod)
      familyPatch.preferred_contact_method = body.preferredContactMethod;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from("families")
      .update(familyPatch)
      .eq("id", carer.family_id);
  }

  // Send the branded verification email (same path as /api/portal/signup).
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: {
      redirectTo: `${BASE_URL}/auth/portal-callback?next=/portal/family`,
    },
  });

  if (!linkError && linkData?.properties?.action_link) {
    const resend = getResendClient();
    if (resend) {
      const { subject, html } = portalVerifyEmail({
        name: carer.name,
        verifyUrl: linkData.properties.action_link,
      });
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          replyTo: REPLY_TO_EMAIL,
          subject,
          html,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin as any).from("email_logs").insert({
          recipient_email: email,
          email_type: "portal_verify",
          subject,
          status: "sent",
        });
      } catch (err) {
        console.error("Portal claim: verify email send failed", err);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
