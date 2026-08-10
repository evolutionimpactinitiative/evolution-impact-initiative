import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import {
  registrationReceivedEmail,
  waitlistReceivedEmail,
} from "@/lib/email/back-to-school-templates";
import { B2S, B2S_SLUG, UNIFORM_SIZES } from "@/lib/back-to-school";

interface UniformChoicesPayload {
  bottom?: { type?: string; colour?: string };
  polo?: { colour?: string; sleeve?: string } | null;
  shirt?: { sleeve?: string } | null;
}

interface ChildPayload {
  name?: string;
  age?: number;
  uniformSize?: string;
  sex?: string;
  school?: string;
  needs?: string[];
  notes?: string;
  uniformChoices?: UniformChoicesPayload;
}

interface RegisterPayload {
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  postcode?: string;
  children?: ChildPayload[];
  disclaimersAccepted?: boolean;
}

const VALID_SEX = ["male", "female", "other", "prefer_not_to_say"] as const;
const VALID_NEEDS = ["uniform", "stationery", "bag"] as const;
const VALID_UNIFORM_SIZES: readonly string[] = UNIFORM_SIZES;
const VALID_BOTTOM_TYPES = ["trousers", "skirt", "dress", "shorts"] as const;
const VALID_UNIFORM_COLOURS = ["grey", "black", "blue"] as const;
const VALID_POLO_COLOURS = ["white", "blue"] as const;
const VALID_SLEEVES = ["short", "long"] as const;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export async function POST(request: NextRequest) {
  try {
    // Deadline check — server-side enforcement
    const now = new Date();
    const deadline = new Date(B2S.registrationDeadline);
    if (now > deadline) {
      return NextResponse.json(
        {
          error: `Registration closed on ${B2S.registrationDeadlineLabel}.`,
        },
        { status: 410 },
      );
    }

    const body = (await request.json()) as RegisterPayload;

    // Parent field validation
    if (
      !isNonEmptyString(body.parentName) ||
      !isNonEmptyString(body.parentEmail) ||
      !isNonEmptyString(body.parentPhone) ||
      !isNonEmptyString(body.postcode)
    ) {
      return NextResponse.json(
        { error: "Please fill in your name, email, phone and postcode." },
        { status: 400 },
      );
    }

    if (!Array.isArray(body.children) || body.children.length === 0) {
      return NextResponse.json(
        { error: "Please add at least one child." },
        { status: 400 },
      );
    }
    if (body.children.length > B2S.maxChildrenPerRegistration) {
      return NextResponse.json(
        {
          error: `Maximum ${B2S.maxChildrenPerRegistration} children per registration.`,
        },
        { status: 400 },
      );
    }

    // Per-child validation
    for (let i = 0; i < body.children.length; i++) {
      const c = body.children[i];
      const label = c.name ? `"${c.name}"` : `child ${i + 1}`;

      if (!isNonEmptyString(c.name)) {
        return NextResponse.json(
          { error: `Please enter a name for child ${i + 1}.` },
          { status: 400 },
        );
      }
      if (
        typeof c.age !== "number" ||
        !Number.isFinite(c.age) ||
        c.age < B2S.minChildAge ||
        c.age > B2S.maxChildAge
      ) {
        return NextResponse.json(
          {
            error: `Age for ${label} must be between ${B2S.minChildAge} and ${B2S.maxChildAge}.`,
          },
          { status: 400 },
        );
      }
      if (
        !isNonEmptyString(c.uniformSize) ||
        !VALID_UNIFORM_SIZES.includes(c.uniformSize)
      ) {
        return NextResponse.json(
          { error: `Please choose a valid uniform size for ${label}.` },
          { status: 400 },
        );
      }
      if (c.sex && !VALID_SEX.includes(c.sex as (typeof VALID_SEX)[number])) {
        return NextResponse.json(
          { error: `Invalid sex value for ${label}.` },
          { status: 400 },
        );
      }
      if (!Array.isArray(c.needs) || c.needs.length === 0) {
        return NextResponse.json(
          { error: `Please tick at least one thing you need for ${label}.` },
          { status: 400 },
        );
      }
      for (const n of c.needs) {
        if (!VALID_NEEDS.includes(n as (typeof VALID_NEEDS)[number])) {
          return NextResponse.json(
            { error: `Invalid need value "${n}" for ${label}.` },
            { status: 400 },
          );
        }
      }

      // Uniform choices required if uniform is in the needs list
      if (c.needs.includes("uniform")) {
        const uc = c.uniformChoices;
        if (!uc || !uc.bottom) {
          return NextResponse.json(
            { error: `Please choose a bottom garment for ${label}.` },
            { status: 400 },
          );
        }
        if (
          !uc.bottom.type ||
          !VALID_BOTTOM_TYPES.includes(
            uc.bottom.type as (typeof VALID_BOTTOM_TYPES)[number],
          )
        ) {
          return NextResponse.json(
            { error: `Invalid bottom garment type for ${label}.` },
            { status: 400 },
          );
        }
        if (
          !uc.bottom.colour ||
          !VALID_UNIFORM_COLOURS.includes(
            uc.bottom.colour as (typeof VALID_UNIFORM_COLOURS)[number],
          )
        ) {
          return NextResponse.json(
            { error: `Invalid bottom garment colour for ${label}.` },
            { status: 400 },
          );
        }
        if (uc.polo) {
          if (
            !uc.polo.colour ||
            !VALID_POLO_COLOURS.includes(
              uc.polo.colour as (typeof VALID_POLO_COLOURS)[number],
            ) ||
            !uc.polo.sleeve ||
            !VALID_SLEEVES.includes(
              uc.polo.sleeve as (typeof VALID_SLEEVES)[number],
            )
          ) {
            return NextResponse.json(
              { error: `Invalid polo choices for ${label}.` },
              { status: 400 },
            );
          }
        }
        if (uc.shirt) {
          if (
            !uc.shirt.sleeve ||
            !VALID_SLEEVES.includes(
              uc.shirt.sleeve as (typeof VALID_SLEEVES)[number],
            )
          ) {
            return NextResponse.json(
              { error: `Invalid shirt sleeve for ${label}.` },
              { status: 400 },
            );
          }
        }
      }
    }

    if (body.disclaimersAccepted !== true) {
      return NextResponse.json(
        { error: "Please tick the box to confirm the important info." },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    // Look up the drive event
    const { data: eventRow } = await supabase
      .from("events")
      .select("id, total_slots, registration_mode")
      .eq("slug", B2S_SLUG)
      .maybeSingle();

    if (!eventRow) {
      return NextResponse.json(
        {
          error:
            "The drive event isn't configured yet — please try again shortly.",
        },
        { status: 503 },
      );
    }
    const event = eventRow as {
      id: string;
      total_slots: number;
      registration_mode: "open" | "waitlist" | "closed" | null;
    };
    const eventId = event.id;
    const totalSlots = event.total_slots ?? B2S.totalSlots;
    const registrationMode = event.registration_mode ?? "open";

    if (registrationMode === "closed") {
      return NextResponse.json(
        {
          error:
            "Registration is closed. Please come and see us on the day if you can — we'll do our best to help.",
        },
        { status: 410 },
      );
    }

    // In waitlist mode we skip the capacity gate entirely — every new sign-up
    // lands as waitlisted regardless of how many places are already booked,
    // and the admin promotes as we get more supplies/funds.
    if (registrationMode !== "waitlist") {
      const { count: registeredCount } = await supabase
        .from("registrations")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .in("status", ["pending", "approved", "confirmed"]);

      if ((registeredCount ?? 0) >= totalSlots) {
        return NextResponse.json(
          {
            error: `We're at capacity — all ${totalSlots} spots have been taken. Please come and see us on the day if you can — we'll do our best to help.`,
          },
          { status: 409 },
        );
      }
    }

    const initialStatus = registrationMode === "waitlist" ? "waitlisted" : "pending";

    // Insert registration row
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inserted, error: insertErr } = await (supabase as any)
      .from("registrations")
      .insert({
        event_id: eventId,
        parent_name: body.parentName.trim(),
        parent_email: body.parentEmail.trim().toLowerCase(),
        parent_phone: body.parentPhone.trim(),
        status: initialStatus,
        photo_video_consent: false,
        terms_accepted_at: new Date().toISOString(),
        accessibility_requirements: null,
        parent_postcode: body.postcode.trim().toUpperCase(),
      })
      .select("id")
      .single();

    if (insertErr || !inserted) {
      console.error("[b2s-register] insert error:", insertErr);
      return NextResponse.json(
        { error: "Failed to save registration. Please try again." },
        { status: 500 },
      );
    }

    const registrationId = (inserted as { id: string }).id;

    // Insert children
    const childRows = body.children.map((c, i) => {
      let uniformChoices: unknown = null;
      if (c.needs!.includes("uniform") && c.uniformChoices?.bottom) {
        uniformChoices = {
          bottom: {
            type: c.uniformChoices.bottom.type,
            colour: c.uniformChoices.bottom.colour,
          },
          polo: c.uniformChoices.polo
            ? {
                colour: c.uniformChoices.polo.colour,
                sleeve: c.uniformChoices.polo.sleeve,
              }
            : null,
          shirt: c.uniformChoices.shirt
            ? { sleeve: c.uniformChoices.shirt.sleeve }
            : null,
        };
      }
      return {
        registration_id: registrationId,
        child_name: c.name!.trim(),
        child_age: c.age!,
        display_order: i + 1,
        uniform_size: c.uniformSize,
        sex: c.sex || null,
        school: isNonEmptyString(c.school) ? c.school.trim() : null,
        needs: c.needs,
        uniform_choices: uniformChoices,
        notes: isNonEmptyString(c.notes) ? c.notes.trim() : null,
      };
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: childErr } = await (supabase as any)
      .from("registration_children")
      .insert(childRows);

    if (childErr) {
      console.error("[b2s-register] child insert error:", childErr);
      // Roll back registration to avoid orphans
      await supabase.from("registrations").delete().eq("id", registrationId);
      return NextResponse.json(
        { error: "Failed to save children. Please try again." },
        { status: 500 },
      );
    }

    // Fire confirmation email — non-fatal if it fails.
    // Different template depending on whether we landed as pending or waitlisted.
    try {
      const resend = getResendClient();
      if (resend) {
        const { subject, html } =
          initialStatus === "waitlisted"
            ? waitlistReceivedEmail({
                parentName: body.parentName.trim(),
                childrenCount: body.children.length,
              })
            : registrationReceivedEmail({
                parentName: body.parentName.trim(),
                childrenCount: body.children.length,
              });
        await resend.emails.send({
          from: FROM_EMAIL,
          to: body.parentEmail.trim().toLowerCase(),
          replyTo: REPLY_TO_EMAIL,
          subject,
          html,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("email_logs").insert({
          registration_id: registrationId,
          email_type:
            initialStatus === "waitlisted"
              ? "back_to_school_waitlist_received"
              : "back_to_school_registration_received",
          recipient_email: body.parentEmail.trim().toLowerCase(),
          subject,
          sent_at: new Date().toISOString(),
          status: "sent",
        });
      }
    } catch (err) {
      console.error("[b2s-register] email error (non-fatal):", err);
    }

    return NextResponse.json({ success: true, registrationId });
  } catch (err) {
    console.error("[b2s-register] handler error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
