import { NextRequest, NextResponse } from "next/server";
import { getStripeClient, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const stripe = getStripeClient();
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === "payment") {
          // One-time donation
          const metadata = session.metadata || {};

          // Find or create donor
          let donorId: string | null = null;

          if (session.customer_email) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: existingDonor } = await (supabase as any)
              .from("donors")
              .select("id")
              .eq("email", session.customer_email)
              .single();

            if (existingDonor) {
              donorId = existingDonor.id;
            } else {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { data: newDonor } = await (supabase as any)
                .from("donors")
                .insert({
                  email: session.customer_email,
                  name: metadata.donor_name || null,
                  gift_aid_eligible: metadata.gift_aid === "yes",
                })
                .select()
                .single();

              donorId = newDonor?.id || null;
            }
          }

          // Record donation
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from("donations").insert({
            donor_id: donorId,
            amount: (session.amount_total || 0) / 100,
            currency: session.currency?.toUpperCase() || "GBP",
            payment_method: "card",
            stripe_payment_id: session.payment_intent as string,
            gift_aid_claimed: metadata.gift_aid === "yes",
            status: "completed",
            donation_date: new Date().toISOString(),
          });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoiceAny = invoice as any;
        const subscriptionId = invoiceAny.subscription;

        if (subscriptionId) {
          // Recurring donation payment
          const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
          const metadata = subscription.metadata || {};

          // Find or create donor
          let donorId: string | null = null;

          const customerEmail = invoiceAny.customer_email;
          if (customerEmail) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: existingDonor } = await (supabase as any)
              .from("donors")
              .select("id")
              .eq("email", customerEmail)
              .single();

            if (existingDonor) {
              donorId = existingDonor.id;
            }
          }

          // Record donation
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from("donations").insert({
            donor_id: donorId,
            amount: (invoiceAny.amount_paid || 0) / 100,
            currency: (invoiceAny.currency || "gbp").toUpperCase(),
            payment_method: "card",
            stripe_payment_id: invoiceAny.payment_intent as string,
            stripe_subscription_id: subscriptionId as string,
            gift_aid_claimed: metadata.gift_aid === "yes",
            status: "completed",
            donation_date: new Date().toISOString(),
          });
        }
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);

        if (customer && !("deleted" in customer)) {
          const metadata = subscription.metadata || {};

          // Find donor
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: donor } = await (supabase as any)
            .from("donors")
            .select("id")
            .eq("email", customer.email)
            .single();

          if (donor) {
            // Record subscription
            const priceId = subscription.items.data[0]?.price.id;
            const price = await stripe.prices.retrieve(priceId);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any).from("donation_subscriptions").insert({
              donor_id: donor.id,
              stripe_subscription_id: subscription.id,
              amount: (price.unit_amount || 0) / 100,
              currency: price.currency.toUpperCase(),
              interval: "monthly",
              status: subscription.status,
              gift_aid_claimed: metadata.gift_aid === "yes",
              start_date: new Date(subscription.start_date * 1000).toISOString(),
            });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from("donation_subscriptions")
          .update({
            status: "cancelled",
            end_date: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
