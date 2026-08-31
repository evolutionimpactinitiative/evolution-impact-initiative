import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slotsForRegistration } from "@/lib/events";

interface Body {
  eventId: string;
  childIds: string[];
  accessibilityNote?: string;
}

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

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body?.eventId || !Array.isArray(body.childIds) || body.childIds.length === 0) {
    return NextResponse.json(
      { error: "Please pick at least one child to register." },
      { status: 400 },
    );
  }

  // Parent session — enforces the caller is a verified portal user.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (!user.email_confirmed_at) {
    return NextResponse.json(
      { error: "Please confirm your email address first." },
      { status: 403 },
    );
  }

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: carer } = await (admin as any)
    .from("parent_carers")
    .select("id, family_id, name, email, phone")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!carer) {
    return NextResponse.json(
      { error: "We couldn't find your family record. Please contact us." },
      { status: 404 },
    );
  }

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
    return NextResponse.json({ error: "Registration is closed for this session." }, { status: 400 });
  }
  if (event.publish_at && new Date(event.publish_at) > new Date()) {
    return NextResponse.json(
      { error: "Registration for this session hasn't opened yet." },
      { status: 400 },
    );
  }

  // Duplicate guard — one active registration per family per event.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin as any)
    .from("registrations")
    .select("id, status")
    .eq("event_id", body.eventId)
    .eq("family_id", carer.family_id)
    .neq("status", "cancelled")
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      {
        error: "Your family is already registered for this session.",
        registrationId: existing.id,
      },
      { status: 409 },
    );
  }

  // Fetch the selected children and confirm they belong to this family.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: childrenRows } = await (admin as any)
    .from("children")
    .select("id, first_name, date_of_birth")
    .in("id", body.childIds)
    .eq("family_id", carer.family_id)
    .is("archived_at", null);

  const children = (childrenRows as { id: string; first_name: string; date_of_birth: string }[] | null) || [];
  if (children.length !== body.childIds.length) {
    return NextResponse.json(
      { error: "One of those children doesn't belong to your family." },
      { status: 400 },
    );
  }

  // Age eligibility — Growing Together is 0–5 (children aged 5 are
  // included; 6+ is out). Check age as at the session date.
  const sessionDate = new Date(event.date);
  const tooOld = children.filter((c) => ageAtDate(c.date_of_birth, sessionDate) > 5);
  if (tooOld.length > 0) {
    return NextResponse.json(
      {
        error: `Growing Together is for children aged 0–5. ${tooOld
          .map((c) => c.first_name)
          .join(", ")} would be older than 5 on the session date.`,
      },
      { status: 400 },
    );
  }

  // Capacity — reuse existing counting logic. GT events default to
  // event_type='children' so slots = number of children.
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
  const slotsNeeded = children.length;
  const spotsRemaining = event.total_slots - confirmedUsed;
  const waitlistRemaining = event.waitlist_slots - waitlistUsed;

  let status: "confirmed" | "waitlisted";
  if (event.registration_status !== "closed" && spotsRemaining >= slotsNeeded) {
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
      parent_name: carer.name,
      parent_email: carer.email,
      parent_phone: carer.phone || "",
      accessibility_requirements: body.accessibilityNote?.trim() || null,
      status,
      photo_video_consent: false,
      terms_accepted_at: new Date().toISOString(),
      family_id: carer.family_id,
      registered_by_parent_carer_id: carer.id,
    })
    .select("id")
    .single();

  if (regErr || !registration) {
    console.error("Portal registration insert failed:", regErr);
    return NextResponse.json({ error: "Could not save registration." }, { status: 500 });
  }

  const childRows = children.map((c, i) => ({
    registration_id: registration.id,
    child_id: c.id,
    child_name: c.first_name,
    child_age: Math.max(0, ageAtDate(c.date_of_birth, sessionDate)),
    display_order: i,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: childErr } = await (admin as any)
    .from("registration_children")
    .insert(childRows);

  if (childErr) {
    // Try to roll back to keep counts accurate.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from("registrations").delete().eq("id", registration.id);
    console.error("Portal registration_children insert failed:", childErr);
    return NextResponse.json({ error: "Could not save children on registration." }, { status: 500 });
  }

  // Fire confirmation email using the shared endpoint (same one the
  // anonymous flow uses). Non-blocking — swallow errors so a mail
  // outage doesn't fail the registration.
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  try {
    await fetch(`${siteUrl}/api/email/send-registration`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId: registration.id }),
    });
  } catch (err) {
    console.error("Portal registration email dispatch failed:", err);
  }

  return NextResponse.json({
    ok: true,
    registrationId: registration.id,
    status,
  });
}
