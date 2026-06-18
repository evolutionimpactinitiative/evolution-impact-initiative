import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/client";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import { sponsorInquiryReceivedEmail } from "@/lib/email/festival-templates";
import {
  FESTIVAL,
  FESTIVAL_SLUG,
  getSponsorTier,
  type SponsorPath,
} from "@/lib/festival";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

interface ApplyRequest {
  path?: SponsorPath;
  tierKey?: string;
  amountPence?: number;
  organisationName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  displayName?: string;
  logoUrl?: string;
  website?: string;
  message?: string;
  consent?: boolean;
}

function isString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export async function POST(request: NextRequest) {
  try {
    // Deadline gate (sponsors closed the same day as vendors)
    const now = new Date();
    const deadline = new Date(`${FESTIVAL.applicationDeadline}T23:59:59`);
    if (now > deadline) {
      return NextResponse.json(
        { error: "Sponsorship applications closed on 18 July 2026." },
        { status: 410 },
      );
    }

    const body: ApplyRequest = await request.json();
    const {
      path,
      tierKey,
      amountPence,
      organisationName,
      contactName,
      email,
      phone,
      displayName,
      logoUrl,
      website,
      message,
      consent,
    } = body;

    if (
      !path ||
      !isString(tierKey) ||
      !isString(organisationName) ||
      !isString(contactName) ||
      !isString(email)
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }
    if (!consent) {
      return NextResponse.json(
        { error: "Please accept the terms to continue" },
        { status: 400 },
      );
    }

    // Custom path skips the tier catalog
    const isCustom = path === "custom";
    const tier = isCustom ? null : getSponsorTier(tierKey);
    if (!isCustom && !tier) {
      return NextResponse.json(
        { error: "Invalid tier" },
        { status: 400 },
      );
    }

    // Compute & validate amount
    let pledgedPence = 0;
    if (isCustom) {
      // Custom must include a positive amount (or 0 = "discuss")
      pledgedPence =
        typeof amountPence === "number" && amountPence > 0 ? amountPence : 0;
    } else if (tier) {
      const minPence = tier.pricePence;
      pledgedPence =
        typeof amountPence === "number" && amountPence >= minPence
          ? amountPence
          : minPence;
    }

    const supabase = createAdminClient();

    // Resolve festival event
    const { data: eventRow } = await supabase
      .from("events")
      .select("id")
      .eq("slug", FESTIVAL_SLUG)
      .maybeSingle();
    if (!eventRow) {
      return NextResponse.json(
        { error: "Festival event is not configured yet — please try again shortly." },
        { status: 503 },
      );
    }
    const eventId = (eventRow as { id: string }).id;

    // Capacity check for capped tiers (Title Partner + Activity zones)
    if (tier && tier.cap !== null) {
      const { data: taken } = await supabase
        .from("festival_sponsors")
        .select("id")
        .eq("event_id", eventId)
        .eq("tier_key", tierKey)
        .in("status", ["pending_payment", "pending_review", "confirmed"]);
      if ((taken?.length ?? 0) >= tier.cap) {
        return NextResponse.json(
          {
            error: `Sorry — the ${tier.label} tier is already taken. Choose another tier or go custom.`,
          },
          { status: 409 },
        );
      }
    }

    // Insert sponsor row
    // Custom & "0 to discuss" go straight to pending_review.
    // Paid go to pending_payment until Stripe webhook confirms.
    const initialStatus =
      isCustom || pledgedPence === 0 ? "pending_review" : "pending_payment";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sponsorRow, error: insertErr } = await (supabase as any)
      .from("festival_sponsors")
      .insert({
        event_id: eventId,
        organisation_name: organisationName.trim(),
        contact_name: contactName.trim(),
        email: email.trim().toLowerCase(),
        phone: isString(phone) ? phone.trim() : null,
        path,
        tier_key: tierKey.trim(),
        display_name: isString(displayName) ? displayName.trim() : null,
        logo_url: isString(logoUrl) ? logoUrl.trim() : null,
        website: isString(website) ? website.trim() : null,
        message: isString(message) ? message.trim() : null,
        amount_pledged: pledgedPence,
        status: initialStatus,
      })
      .select()
      .single();

    if (insertErr || !sponsorRow) {
      console.error("[sponsor-apply] insert error:", insertErr);
      return NextResponse.json(
        { error: "Failed to save application" },
        { status: 500 },
      );
    }

    const sponsorId = sponsorRow.id as string;

    // If no payment is required, send received email + return
    if (initialStatus === "pending_review") {
      await sendReceivedEmail(sponsorRow);
      return NextResponse.json({
        success: true,
        sponsorId,
        status: "pending_review",
      });
    }

    // Otherwise create Stripe Checkout
    const stripe = getStripeClient();
    if (!stripe) {
      console.warn("[sponsor-apply] STRIPE_SECRET_KEY not set");
      return NextResponse.json(
        { error: "Payment processing isn't configured. Please contact us directly." },
        { status: 503 },
      );
    }

    const productName = `${FESTIVAL.title} — ${tier?.label ?? tierKey}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: productName,
              description: `Sponsorship pledge for ${sponsorRow.organisation_name}`,
            },
            unit_amount: pledgedPence,
          },
          quantity: 1,
        },
      ],
      customer_email: sponsorRow.email,
      metadata: {
        kind: "festival_sponsor",
        sponsor_id: sponsorId,
        tier_key: tierKey,
        path,
        organisation_name: sponsorRow.organisation_name,
      },
      success_url: `${BASE_URL}/${FESTIVAL_SLUG}/sponsor/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/${FESTIVAL_SLUG}/sponsor/cancelled?sponsor_id=${sponsorId}`,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("festival_sponsors")
      .update({ stripe_session_id: session.id })
      .eq("id", sponsorId);

    return NextResponse.json({
      success: true,
      sponsorId,
      status: "pending_payment",
      checkoutUrl: session.url,
    });
  } catch (err) {
    console.error("[sponsor-apply] handler error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendReceivedEmail(sponsor: any) {
  try {
    const resend = getResendClient();
    if (!resend) {
      console.log(
        `[sponsor-apply] would email ${sponsor.email} (RESEND_API_KEY not set)`,
      );
      return;
    }
    const { subject, html } = sponsorInquiryReceivedEmail({
      sponsor: {
        organisation_name: sponsor.organisation_name,
        contact_name: sponsor.contact_name,
        path: sponsor.path,
        tier_key: sponsor.tier_key,
        amount_pledged: sponsor.amount_pledged,
        display_name: sponsor.display_name,
      },
    });
    await resend.emails.send({
      from: FROM_EMAIL,
      to: sponsor.email,
      replyTo: REPLY_TO_EMAIL,
      subject,
      html,
    });
    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("email_logs").insert({
      email_type: "sponsor_inquiry_received",
      recipient_email: sponsor.email,
      subject,
      sent_at: new Date().toISOString(),
      status: "sent",
    });
  } catch (err) {
    console.error("[sponsor-apply] email error (non-fatal):", err);
  }
}
