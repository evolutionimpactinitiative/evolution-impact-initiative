import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { slotsForRegistration } from "@/lib/events";

// Anonymous Growing Together registration.
//
// Signed-in parents go through /api/portal/register-session (which trusts
// the auth session + existing children records). This endpoint is the
// public-facing alternative: a parent registers *without* an account,
// we create a shadow parent_carer (user_id = NULL), persist their
// children up-front so grant reporting and later portal use both work,
// and mint a 90-day claim_token so they can convert the shadow row into
// a real account via the link in their confirmation email.

interface ChildInput {
  firstName: string;
  dateOfBirth: string; // YYYY-MM-DD
}

interface Body {
  eventId: string;
  parentName: string;
  parentEmail: string;
  parentPhone?: string;
  postcode?: string;
  relationshipToChild?: string;
  howHeardAboutGt?: string;
  preferredContactMethod?: "email" | "phone" | "sms" | "whatsapp";
  children: ChildInput[];
  accessibilityNote?: string;
  photoVideoConsent: boolean;
  termsAccepted: boolean;
}

const CLAIM_TOKEN_TTL_DAYS = 90;

function ageAtDate(dob: string, date: Date): number {
  const b = new Date(dob);
  let years = date.getFullYear() - b.getFullYear();
  if (
    date.getMonth() < b.getMonth() ||
    (date.getMonth() === b.getMonth() && date.getDate() < b.getDate())
  ) {
    years -= 1;
  }
  return years;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidIsoDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parentName = body.parentName?.trim();
  const parentEmail = body.parentEmail?.trim().toLowerCase();
  const parentPhone = body.parentPhone?.trim();

  if (!parentName) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!parentEmail || !isValidEmail(parentEmail)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }
  if (!body.termsAccepted) {
    return NextResponse.json(
      { error: "Please agree to the terms before registering." },
      { status: 400 },
    );
  }
  if (!body.eventId) {
    return NextResponse.json({ error: "Session is required." }, { status: 400 });
  }

  const childrenInput = (body.children || [])
    .map((c) => ({
      firstName: c.firstName?.trim() || "",
      dateOfBirth: c.dateOfBirth?.trim() || "",
    }))
    .filter((c) => c.firstName && c.dateOfBirth);

  if (childrenInput.length === 0) {
    return NextResponse.json(
      { error: "Please add at least one child." },
      { status: 400 },
    );
  }
  for (const c of childrenInput) {
    if (!isValidIsoDate(c.dateOfBirth)) {
      return NextResponse.json(
        { error: `Please enter a valid date of birth for ${c.firstName}.` },
        { status: 400 },
      );
    }
  }

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: event } = await (admin as any)
    .from("events")
    .select("*")
    .eq("id", body.eventId)
    .maybeSingle();

  if (!event) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }
  if (event.programme !== "growing_together") {
    return NextResponse.json(
      { error: "This session isn't part of Growing Together." },
      { status: 400 },
    );
  }
  if (event.status !== "published") {
    return NextResponse.json({ error: "Session isn't open." }, { status: 400 });
  }
  if (event.registration_status === "closed") {
    return NextResponse.json(
      { error: "Registration is closed for this session." },
      { status: 400 },
    );
  }

  const sessionDate = new Date(event.date);
  if (sessionDate < new Date()) {
    return NextResponse.json({ error: "This session has already taken place." }, { status: 400 });
  }

  // Anonymous registrations can't use the early-access door (that's a
  // reward for returning families with session history). If registration
  // hasn't opened publicly, hold them off.
  if (event.publish_at && new Date(event.publish_at) > new Date()) {
    return NextResponse.json(
      { error: "Registration for this session hasn't opened yet." },
      { status: 400 },
    );
  }

  // Age eligibility — GT is 0–5 as at the session date.
  const tooOld = childrenInput.filter(
    (c) => ageAtDate(c.dateOfBirth, sessionDate) > 5,
  );
  if (tooOld.length > 0) {
    return NextResponse.json(
      {
        error: `Growing Together is for children aged 0–5. ${tooOld
          .map((c) => c.firstName)
          .join(", ")} would be older than 5 on the session date.`,
      },
      { status: 400 },
    );
  }
  const notBornYet = childrenInput.filter(
    (c) => ageAtDate(c.dateOfBirth, sessionDate) < 0,
  );
  if (notBornYet.length > 0) {
    return NextResponse.json(
      {
        error: `${notBornYet
          .map((c) => c.firstName)
          .join(", ")} wouldn't be born yet on the session date.`,
      },
      { status: 400 },
    );
  }

  // Reuse an existing family if we've seen this email before. If the
  // parent already has a real (claimed) account, send them to login
  // instead of creating a parallel shadow row.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingCarer } = await (admin as any)
    .from("parent_carers")
    .select("id, family_id, user_id, name, email, phone")
    .eq("email", parentEmail)
    .maybeSingle();

  let familyId: string;
  let parentCarerId: string;

  if (existingCarer && existingCarer.user_id) {
    return NextResponse.json(
      {
        error:
          "An account with that email already exists. Log in to register — your family details are already saved.",
        hasAccount: true,
      },
      { status: 409 },
    );
  } else if (existingCarer) {
    // Shadow row for this email already exists (previous anonymous
    // registration). Reuse the family + parent_carer.
    familyId = existingCarer.family_id;
    parentCarerId = existingCarer.id;

    // Refresh name/phone in case they typed them differently this time
    // — small quality-of-life so the latest attempt wins.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from("parent_carers")
      .update({
        name: parentName,
        phone: parentPhone || existingCarer.phone || null,
      })
      .eq("id", existingCarer.id);
  } else {
    // Fresh shadow family + parent_carer.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: familyRow, error: famErr } = await (admin as any)
      .from("families")
      .insert({
        postcode: body.postcode?.trim() || null,
        preferred_contact_method: body.preferredContactMethod || "email",
        how_heard_about_gt: body.howHeardAboutGt || null,
        photo_video_consent: !!body.photoVideoConsent,
      })
      .select("id")
      .single();

    if (famErr || !familyRow) {
      console.error("Public GT: family insert failed", famErr);
      return NextResponse.json(
        { error: "Could not save your family record." },
        { status: 500 },
      );
    }
    familyId = familyRow.id;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: carerRow, error: carerErr } = await (admin as any)
      .from("parent_carers")
      .insert({
        family_id: familyId,
        user_id: null,
        name: parentName,
        email: parentEmail,
        phone: parentPhone || null,
        relationship_to_child: body.relationshipToChild || null,
        is_primary: true,
      })
      .select("id")
      .single();

    if (carerErr || !carerRow) {
      // Roll back the orphan family so capacity + reporting stay clean.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from("families").delete().eq("id", familyId);
      console.error("Public GT: parent_carer insert failed", carerErr);
      return NextResponse.json(
        { error: "Could not save your details. Please try again." },
        { status: 500 },
      );
    }
    parentCarerId = carerRow.id;
  }

  // Duplicate guard — one active registration per family per event.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingReg } = await (admin as any)
    .from("registrations")
    .select("id, status")
    .eq("event_id", body.eventId)
    .eq("family_id", familyId)
    .neq("status", "cancelled")
    .maybeSingle();

  if (existingReg) {
    return NextResponse.json(
      {
        error: "Your family is already registered for this session.",
        registrationId: existingReg.id,
      },
      { status: 409 },
    );
  }

  // Materialise children up-front (grant reporting + future portal use
  // both need real rows, not just the per-event snapshot). Match by
  // first name (case-insensitive) + dob to avoid duplicating the same
  // child across multiple anonymous registrations.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingChildren } = await (admin as any)
    .from("children")
    .select("id, first_name, date_of_birth")
    .eq("family_id", familyId)
    .is("archived_at", null);

  const existingList =
    (existingChildren as { id: string; first_name: string; date_of_birth: string }[] | null) ||
    [];

  const resolvedChildren: { id: string; first_name: string; date_of_birth: string }[] = [];

  for (const input of childrenInput) {
    const match = existingList.find(
      (c) =>
        c.first_name.trim().toLowerCase() === input.firstName.toLowerCase() &&
        c.date_of_birth === input.dateOfBirth,
    );
    if (match) {
      resolvedChildren.push(match);
      continue;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newChild, error: childErr } = await (admin as any)
      .from("children")
      .insert({
        family_id: familyId,
        first_name: input.firstName,
        date_of_birth: input.dateOfBirth,
      })
      .select("id, first_name, date_of_birth")
      .single();

    if (childErr || !newChild) {
      console.error("Public GT: child insert failed", childErr);
      return NextResponse.json(
        { error: "Could not save your child's details. Please try again." },
        { status: 500 },
      );
    }
    resolvedChildren.push(newChild);
  }

  // Capacity — mirrors /api/portal/register-session so counts stay
  // consistent whether the parent registered anonymously or through
  // the portal.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: currentRegistrations } = await (admin as any)
    .from("registrations")
    .select(`status, registration_children (id), registration_attendees (id)`)
    .eq("event_id", body.eventId);

  type RegWithCounts = {
    status: string;
    registration_children: { id: string }[];
    registration_attendees: { id: string }[];
  };
  const regs = (currentRegistrations as RegWithCounts[] | null) || [];

  let confirmedUsed = 0;
  let waitlistUsed = 0;
  for (const r of regs) {
    const n = slotsForRegistration(r, event.event_type);
    if (r.status === "confirmed") confirmedUsed += n;
    else if (r.status === "waitlisted") waitlistUsed += n;
  }
  const slotsNeeded = resolvedChildren.length;
  const spotsRemaining = event.total_slots - confirmedUsed;
  const waitlistRemaining = event.waitlist_slots - waitlistUsed;

  let status: "confirmed" | "waitlisted";
  if (spotsRemaining >= slotsNeeded) {
    status = "confirmed";
  } else if (waitlistRemaining >= slotsNeeded) {
    status = "waitlisted";
  } else {
    return NextResponse.json(
      {
        error: `Sorry, only ${Math.max(
          0,
          spotsRemaining,
        )} spots remain on this session. Try removing a child or joining another session.`,
      },
      { status: 400 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: registration, error: regErr } = await (admin as any)
    .from("registrations")
    .insert({
      event_id: body.eventId,
      parent_name: parentName,
      parent_email: parentEmail,
      parent_phone: parentPhone || "",
      accessibility_requirements: body.accessibilityNote?.trim() || null,
      status,
      photo_video_consent: !!body.photoVideoConsent,
      terms_accepted_at: new Date().toISOString(),
      family_id: familyId,
      registered_by_parent_carer_id: parentCarerId,
    })
    .select("id")
    .single();

  if (regErr || !registration) {
    console.error("Public GT: registration insert failed", regErr);
    return NextResponse.json(
      { error: "Could not save your registration. Please try again." },
      { status: 500 },
    );
  }

  const childRows = resolvedChildren.map((c, i) => ({
    registration_id: registration.id,
    child_id: c.id,
    child_name: c.first_name,
    child_age: Math.max(0, ageAtDate(c.date_of_birth, sessionDate)),
    display_order: i,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: regChildErr } = await (admin as any)
    .from("registration_children")
    .insert(childRows);

  if (regChildErr) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from("registrations").delete().eq("id", registration.id);
    console.error("Public GT: registration_children insert failed", regChildErr);
    return NextResponse.json(
      { error: "Could not save children on registration." },
      { status: 500 },
    );
  }

  // Mint a fresh 90-day claim token — the latest wins if they register
  // for multiple sessions before converting to an account.
  const claimToken = randomBytes(24).toString("base64url");
  const expiresAt = new Date(
    Date.now() + CLAIM_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from("parent_carers")
    .update({
      claim_token: claimToken,
      claim_token_expires_at: expiresAt,
    })
    .eq("id", parentCarerId);

  // Dispatch the confirmation email (non-blocking — a mail outage
  // shouldn't fail the registration itself).
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  try {
    await fetch(`${siteUrl}/api/email/send-registration`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId: registration.id, claimToken }),
    });
  } catch (err) {
    console.error("Public GT: email dispatch failed", err);
  }

  return NextResponse.json({
    ok: true,
    registrationId: registration.id,
    status,
    claimToken,
  });
}
