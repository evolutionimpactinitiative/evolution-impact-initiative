import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe/client";
import { resolveDonationCampaign } from "@/lib/festival";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function POST(request: NextRequest) {
  try {
    const { amount, frequency, giftAid, donorEmail, donorName, campaign } =
      await request.json();

    // Validate amount
    const amountInPence = Math.round(parseFloat(amount) * 100);
    if (isNaN(amountInPence) || amountInPence < 100) {
      return NextResponse.json(
        { error: "Minimum donation is £1" },
        { status: 400 }
      );
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return NextResponse.json(
        { error: "Payment processing is not configured" },
        { status: 500 }
      );
    }

    const isRecurring = frequency === "monthly";
    // resolveDonationCampaign forces `back-to-school-2026` while the
    // FESTIVAL.donationCampaignOverrideUntil window is active, so both the
    // Stripe checkout product label and the DB row line up with what the
    // admin sees on the drive dashboard.
    const normalisedCampaign = resolveDonationCampaign(campaign);
    const metadata = {
      donor_name: donorName || "",
      gift_aid: giftAid ? "yes" : "no",
      frequency: frequency || "one-time",
      campaign: normalisedCampaign,
    };

    // Send campaign-specific donations to their own thank-you / cancel pages.
    const isBackToSchool = normalisedCampaign === "back-to-school-2026";
    const successUrl = isBackToSchool
      ? `${BASE_URL}/back-to-school/thank-you?session_id={CHECKOUT_SESSION_ID}`
      : `${BASE_URL}/donate/thank-you?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = isBackToSchool
      ? `${BASE_URL}/back-to-school?cancelled=true`
      : `${BASE_URL}/donate?cancelled=true`;

    const productDisplayName = isBackToSchool
      ? "Back to School Campaign 2026"
      : "Donation to Evolution Impact Initiative";

    let session;

    if (isRecurring) {
      // Create a price for the subscription
      const price = await stripe.prices.create({
        unit_amount: amountInPence,
        currency: "gbp",
        recurring: { interval: "month" },
        product_data: {
          name: isBackToSchool
            ? "Monthly donation — Back to School Campaign 2026"
            : "Monthly Donation to Evolution Impact Initiative",
        },
      });

      session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        customer_email: donorEmail || undefined,
        metadata,
        subscription_data: {
          metadata,
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
    } else {
      // One-time donation
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "gbp",
              product_data: {
                name: productDisplayName,
                description: giftAid
                  ? "One-time donation with Gift Aid"
                  : "One-time donation",
              },
              unit_amount: amountInPence,
            },
            quantity: 1,
          },
        ],
        customer_email: donorEmail || undefined,
        metadata,
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
    }

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
