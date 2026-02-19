import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe/client";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function POST(request: NextRequest) {
  try {
    const { amount, frequency, giftAid, donorEmail, donorName } = await request.json();

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
    const metadata = {
      donor_name: donorName || "",
      gift_aid: giftAid ? "yes" : "no",
      frequency: frequency || "one-time",
    };

    let session;

    if (isRecurring) {
      // Create a price for the subscription
      const price = await stripe.prices.create({
        unit_amount: amountInPence,
        currency: "gbp",
        recurring: { interval: "month" },
        product_data: {
          name: "Monthly Donation to Evolution Impact Initiative",
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
        success_url: `${BASE_URL}/donate/thank-you?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${BASE_URL}/donate?cancelled=true`,
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
                name: "Donation to Evolution Impact Initiative",
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
        success_url: `${BASE_URL}/donate/thank-you?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${BASE_URL}/donate?cancelled=true`,
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
