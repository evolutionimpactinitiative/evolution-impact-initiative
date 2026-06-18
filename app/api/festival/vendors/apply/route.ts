import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/client";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import { vendorApplicationReceivedEmail } from "@/lib/email/festival-templates";
import {
  FESTIVAL,
  FESTIVAL_SLUG,
  VENDOR_CATEGORIES,
  type VendorCategoryKey,
} from "@/lib/festival";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

interface ApplyRequest {
  businessName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  category?: VendorCategoryKey;
  description?: string;
  whatSelling?: string;
  website?: string;
  socialHandles?: Record<string, string>;
  powerNeeded?: boolean;
  powerNotes?: string;
  gazeboSize?: string;
  // Declarations
  hasPublicLiability?: boolean;
  hasFoodHygieneRating?: boolean;
  foodHygieneScore?: number;
  hasRiskAssessment?: boolean;
  // Anti-spam / consent
  consent?: boolean;
}

function isString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export async function POST(request: NextRequest) {
  try {
    // Deadline gate
    const now = new Date();
    const deadline = new Date(`${FESTIVAL.applicationDeadline}T23:59:59`);
    if (now > deadline) {
      return NextResponse.json(
        { error: "Applications closed on 18 July 2026." },
        { status: 410 },
      );
    }

    const body: ApplyRequest = await request.json();
    const {
      businessName,
      contactName,
      email,
      phone,
      category,
      description,
      whatSelling,
      website,
      socialHandles,
      powerNeeded,
      powerNotes,
      gazeboSize,
      hasPublicLiability,
      hasFoodHygieneRating,
      foodHygieneScore,
      hasRiskAssessment,
      consent,
    } = body;

    if (
      !isString(businessName) ||
      !isString(contactName) ||
      !isString(email) ||
      !isString(phone) ||
      !category
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

    const categoryDef = VENDOR_CATEGORIES.find((c) => c.key === category);
    if (!categoryDef) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    // Find the festival event row
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

    // Live capacity check (counts active applications)
    const { data: countRows } = await supabase.rpc(
      "get_festival_vendor_counts",
      { p_event_id: eventId },
    );
    type CountRow = {
      category: string;
      active_total: number;
    };
    const counts = (countRows as CountRow[] | null) ?? [];
    const activeForCategory =
      counts.find((c) => c.category === category)?.active_total ?? 0;
    if (activeForCategory >= categoryDef.cap) {
      return NextResponse.json(
        {
          error: `Sorry — all ${categoryDef.cap} ${categoryDef.label.toLowerCase()} spaces are taken.`,
        },
        { status: 409 },
      );
    }

    // Insert the application row
    const isFree = categoryDef.contributionPence === 0;
    const initialStatus = isFree ? "pending_review" : "pending_payment";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: vendorRow, error: insertErr } = await (supabase as any)
      .from("festival_vendors")
      .insert({
        event_id: eventId,
        business_name: businessName.trim(),
        contact_name: contactName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        category,
        description: isString(description) ? description.trim() : null,
        what_selling: isString(whatSelling) ? whatSelling.trim() : null,
        website: isString(website) ? website.trim() : null,
        social_handles: socialHandles ?? {},
        power_needed: !!powerNeeded,
        power_notes: isString(powerNotes) ? powerNotes.trim() : null,
        gazebo_size: isString(gazeboSize) ? gazeboSize.trim() : null,
        has_public_liability: !!hasPublicLiability,
        has_food_hygiene_rating: !!hasFoodHygieneRating,
        food_hygiene_score:
          typeof foodHygieneScore === "number" && foodHygieneScore >= 0
            ? foodHygieneScore
            : null,
        has_risk_assessment: !!hasRiskAssessment,
        contribution_amount: categoryDef.contributionPence,
        status: initialStatus,
      })
      .select()
      .single();

    if (insertErr || !vendorRow) {
      console.error("[vendor-apply] insert error:", insertErr);
      return NextResponse.json(
        { error: "Failed to save application" },
        { status: 500 },
      );
    }

    const vendorId = vendorRow.id as string;

    // Free path — send received email immediately and return
    if (isFree) {
      await sendReceivedEmail(vendorRow);
      return NextResponse.json({
        success: true,
        vendorId,
        status: "pending_review",
      });
    }

    // Paid path — create Stripe Checkout
    const stripe = getStripeClient();
    if (!stripe) {
      // Payment processing not configured — fall back to manual flow
      console.warn(
        "[vendor-apply] STRIPE_SECRET_KEY not set — vendor row stuck in pending_payment",
      );
      return NextResponse.json(
        { error: "Payment processing isn't configured. Please contact us directly." },
        { status: 503 },
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `${FESTIVAL.title} — ${categoryDef.label}`,
              description: `Community contribution for ${vendorRow.business_name}`,
            },
            unit_amount: categoryDef.contributionPence,
          },
          quantity: 1,
        },
      ],
      customer_email: vendorRow.email,
      metadata: {
        kind: "festival_vendor",
        vendor_id: vendorId,
        category,
        business_name: vendorRow.business_name,
      },
      success_url: `${BASE_URL}/${FESTIVAL_SLUG}/apply-vendor/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/${FESTIVAL_SLUG}/apply-vendor/cancelled?vendor_id=${vendorId}`,
    });

    // Store the session id so we can correlate it back to the vendor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("festival_vendors")
      .update({ stripe_session_id: session.id })
      .eq("id", vendorId);

    return NextResponse.json({
      success: true,
      vendorId,
      status: "pending_payment",
      checkoutUrl: session.url,
    });
  } catch (err) {
    console.error("[vendor-apply] handler error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendReceivedEmail(vendor: any) {
  try {
    const resend = getResendClient();
    if (!resend) {
      console.log(
        `[vendor-apply] would email ${vendor.email} (RESEND_API_KEY not set)`,
      );
      return;
    }
    const { subject, html } = vendorApplicationReceivedEmail({
      vendor: {
        business_name: vendor.business_name,
        contact_name: vendor.contact_name,
        category: vendor.category,
        contribution_amount: vendor.contribution_amount,
      },
    });
    await resend.emails.send({
      from: FROM_EMAIL,
      to: vendor.email,
      replyTo: REPLY_TO_EMAIL,
      subject,
      html,
    });
    // Log
    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("email_logs").insert({
      email_type: "vendor_application_received",
      recipient_email: vendor.email,
      subject,
      sent_at: new Date().toISOString(),
      status: "sent",
    });
  } catch (err) {
    console.error("[vendor-apply] email send error (non-fatal):", err);
  }
}
