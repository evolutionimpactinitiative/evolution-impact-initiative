import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import { portalVerifyEmail } from "@/lib/email/portal-templates";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://evolutionimpactinitiative.co.uk";

interface SignupBody {
  email: string;
  password: string;
  name: string;
  phone?: string;
  relationship_to_child?: string;
  postcode?: string;
  how_heard_about_gt?: string;
  preferred_contact_method?: "email" | "phone" | "sms" | "whatsapp";
  next?: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  let body: SignupBody;
  try {
    body = (await request.json()) as SignupBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  const name = body.name?.trim();

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Reject if a *claimed* parent_carer already exists for this email. A
  // shadow carer (user_id = NULL) means the parent registered for a
  // session anonymously but never created an account — in that case we
  // bind the new auth user to the shadow row below so their previous
  // registration + children stay attached.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingCarer } = await (admin as any)
    .from("parent_carers")
    .select("id, family_id, user_id")
    .eq("email", email)
    .maybeSingle();

  if (existingCarer && existingCarer.user_id) {
    return NextResponse.json(
      { error: "An account with that email already exists. Try logging in instead." },
      { status: 409 },
    );
  }

  const shadowCarer = existingCarer && !existingCarer.user_id
    ? { id: existingCarer.id as string, family_id: existingCarer.family_id as string }
    : null;

  // Create the auth user. email_confirm=false so Supabase requires them
  // to click our verify link before they can log in.
  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: { name, source: "portal" },
  });

  if (userError || !userData.user) {
    // Most common error: user already exists in auth.users but has no
    // parent_carer row. Surface a helpful message.
    if (userError?.message?.toLowerCase().includes("registered")) {
      return NextResponse.json(
        { error: "An account with that email already exists. Try logging in or resetting your password." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: userError?.message || "Could not create account." },
      { status: 500 },
    );
  }

  const userId = userData.user.id;

  if (shadowCarer) {
    // The parent already registered anonymously — bind the new auth
    // user to their shadow carer and refresh any patch fields they
    // typed on the join form. We don't touch the family record beyond
    // the optional updates below.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: bindError } = await (admin as any)
      .from("parent_carers")
      .update({
        user_id: userId,
        name,
        phone: body.phone || null,
        relationship_to_child: body.relationship_to_child || null,
        claim_token: null,
        claim_token_expires_at: null,
      })
      .eq("id", shadowCarer.id);

    if (bindError) {
      await admin.auth.admin.deleteUser(userId);
      console.error("Portal signup: shadow bind failed", bindError);
      return NextResponse.json(
        { error: "Could not link your account. Please try again." },
        { status: 500 },
      );
    }

    if (body.postcode || body.how_heard_about_gt || body.preferred_contact_method) {
      const patch: Record<string, string> = {};
      if (body.postcode) patch.postcode = body.postcode;
      if (body.how_heard_about_gt) patch.how_heard_about_gt = body.how_heard_about_gt;
      if (body.preferred_contact_method)
        patch.preferred_contact_method = body.preferred_contact_method;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any)
        .from("families")
        .update(patch)
        .eq("id", shadowCarer.family_id);
    }
  } else {
    // Fresh family + parent_carer. If parent_carer fails, roll back the
    // family; if that fails, log — the auth user will be orphaned but
    // subsequent signup attempts hit the "user already exists" branch
    // and the parent can email-verify later.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: familyRow, error: familyError } = await (admin as any)
      .from("families")
      .insert({
        postcode: body.postcode || null,
        preferred_contact_method: body.preferred_contact_method || "email",
        how_heard_about_gt: body.how_heard_about_gt || null,
      })
      .select("id")
      .single();

    if (familyError || !familyRow) {
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: "Could not create family record." },
        { status: 500 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: carerError } = await (admin as any).from("parent_carers").insert({
      family_id: familyRow.id,
      user_id: userId,
      name,
      email,
      phone: body.phone || null,
      relationship_to_child: body.relationship_to_child || null,
      is_primary: true,
    });

    if (carerError) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from("families").delete().eq("id", familyRow.id);
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: "Could not create parent record." },
        { status: 500 },
      );
    }
  }

  // Generate the verification link ourselves so we can wrap it in our
  // own branded email (rather than Supabase's default template).
  const safeNext =
    body.next && body.next.startsWith("/") && !body.next.startsWith("//")
      ? body.next
      : "/portal/family";
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: {
      redirectTo: `${BASE_URL}/auth/portal-callback?next=${encodeURIComponent(safeNext)}`,
    },
  });

  if (linkError || !linkData?.properties?.action_link) {
    // The user is created but we couldn't get the link — they can hit
    // resend-verify to try again.
    return NextResponse.json(
      { ok: true, warning: "Account created but verification email could not be sent. Please use resend." },
      { status: 200 },
    );
  }

  const resend = getResendClient();
  if (resend) {
    const { subject, html } = portalVerifyEmail({
      name,
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
      console.error("Failed to send portal verify email", err);
    }
  }

  return NextResponse.json({ ok: true });
}
