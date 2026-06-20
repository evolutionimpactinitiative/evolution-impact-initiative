import { NextRequest, NextResponse } from "next/server";
import { getStripeClient, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import { donationReceiptEmail } from "@/lib/email/templates";
import {
  sponsorConfirmedEmail,
  vendorApplicationReceivedEmail,
} from "@/lib/email/festival-templates";
import { postDonationToAccounting } from "@/lib/accounting/donations-bridge";
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

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const sessionMetadata = session.metadata || {};

        // Branch: festival sponsor payment
        if (sessionMetadata.kind === "festival_sponsor") {
          const sponsorId = sessionMetadata.sponsor_id;
          if (!sponsorId) {
            console.warn("[webhook] festival_sponsor session missing sponsor_id");
            break;
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: updated } = await (supabase as any)
            .from("festival_sponsors")
            .update({
              status: "confirmed",
              paid_at: new Date().toISOString(),
              stripe_payment_intent_id: session.payment_intent as string,
            })
            .eq("id", sponsorId)
            .select()
            .single();

          if (!updated) {
            console.warn(`[webhook] sponsor ${sponsorId} not found after payment`);
            break;
          }

          try {
            const resend = getResendClient();
            if (resend) {
              const { subject, html } = sponsorConfirmedEmail({
                sponsor: {
                  organisation_name: updated.organisation_name,
                  contact_name: updated.contact_name,
                  path: updated.path,
                  tier_key: updated.tier_key,
                  amount_pledged: updated.amount_pledged,
                  display_name: updated.display_name,
                },
              });
              await resend.emails.send({
                from: FROM_EMAIL,
                to: updated.email,
                replyTo: REPLY_TO_EMAIL,
                subject,
                html,
              });
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await (supabase as any).from("email_logs").insert({
                email_type: "sponsor_confirmed",
                recipient_email: updated.email,
                subject,
                sent_at: new Date().toISOString(),
                status: "sent",
              });
            }
          } catch (emailErr) {
            console.error("[webhook] sponsor email send error:", emailErr);
          }
          break;
        }

        // Branch: festival vendor payment
        if (sessionMetadata.kind === "festival_vendor") {
          const vendorId = sessionMetadata.vendor_id;
          if (!vendorId) {
            console.warn("[webhook] festival_vendor session missing vendor_id");
            break;
          }

          // Mark the vendor application as paid and move to review queue
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: updated } = await (supabase as any)
            .from("festival_vendors")
            .update({
              status: "pending_review",
              paid_at: new Date().toISOString(),
              stripe_payment_intent_id: session.payment_intent as string,
            })
            .eq("id", vendorId)
            .select()
            .single();

          if (!updated) {
            console.warn(`[webhook] vendor ${vendorId} not found after payment`);
            break;
          }

          // Fire the "application received" email (paid path defers it to after payment)
          try {
            const resend = getResendClient();
            if (resend) {
              const { subject, html } = vendorApplicationReceivedEmail({
                vendor: {
                  business_name: updated.business_name,
                  contact_name: updated.contact_name,
                  category: updated.category,
                  contribution_amount: updated.contribution_amount,
                },
              });
              await resend.emails.send({
                from: FROM_EMAIL,
                to: updated.email,
                replyTo: REPLY_TO_EMAIL,
                subject,
                html,
              });
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await (supabase as any).from("email_logs").insert({
                email_type: "vendor_application_received",
                recipient_email: updated.email,
                subject,
                sent_at: new Date().toISOString(),
                status: "sent",
              });
            }
          } catch (emailErr) {
            console.error("[webhook] vendor email send error:", emailErr);
          }
          break;
        }

        if (session.mode === "payment") {
          // One-time donation
          const metadata = sessionMetadata;

          // Prefer the email Stripe collected at checkout (customer_details)
          // and fall back to the one the user pre-filled on our form.
          // Both can be null if the customer somehow skipped email entry.
          const donorEmail =
            session.customer_details?.email ||
            session.customer_email ||
            null;
          const donorNameFromStripe =
            session.customer_details?.name || metadata.donor_name || "";

          // Find or create donor
          let donorId: string | null = null;

          if (donorEmail) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: existingDonor } = await (supabase as any)
              .from("donors")
              .select("id")
              .eq("email", donorEmail)
              .maybeSingle();

            if (existingDonor) {
              donorId = existingDonor.id;
            } else {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { data: newDonor } = await (supabase as any)
                .from("donors")
                .insert({
                  email: donorEmail,
                  name: donorNameFromStripe || "Anonymous",
                  gift_aid_declaration: metadata.gift_aid === "yes",
                })
                .select()
                .single();

              donorId = newDonor?.id || null;
            }
          }

          // Record donation
          const donationAmount = (session.amount_total || 0) / 100;
          const donationCurrency = session.currency?.toUpperCase() || "GBP";
          const giftAidClaimed = metadata.gift_aid === "yes";
          const giftAidAmount = giftAidClaimed ? donationAmount * 0.25 : 0;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: insertedDonation } = await (supabase as any)
            .from("donations")
            .insert({
              donor_id: donorId,
              amount: donationAmount,
              currency: donationCurrency,
              donation_type: "one_time",
              stripe_payment_intent_id: session.payment_intent as string,
              gift_aid_amount: giftAidAmount,
              campaign: metadata.campaign || "general",
              status: "completed",
              completed_at: new Date().toISOString(),
            })
            .select("id")
            .single();

          // Bridge the donation into the accounting ledger.
          // Fire-and-forget — failure here must NOT fail the Stripe webhook.
          if (insertedDonation?.id) {
            void postDonationToAccounting(insertedDonation.id).then((res) => {
              if (!res.ok) {
                console.error(
                  "[webhook] accounting bridge failed for donation",
                  insertedDonation.id,
                  res.error,
                );
              }
            });
          }

          // Send donation receipt email
          if (donorEmail) {
            const resend = getResendClient();
            if (resend) {
              try {
                const { subject, html } = donationReceiptEmail(
                  donorNameFromStripe,
                  donorEmail,
                  donationAmount,
                  donationCurrency,
                  giftAidClaimed,
                  false, // one-time donation
                  session.payment_intent as string
                );

                const { error: emailSendError } = await resend.emails.send({
                  from: FROM_EMAIL,
                  to: donorEmail,
                  replyTo: REPLY_TO_EMAIL,
                  subject,
                  html,
                });
                if (emailSendError) {
                  console.error("[webhook] receipt resend error:", emailSendError);
                }
              } catch (emailError) {
                console.error("[webhook] receipt error:", emailError);
              }
            } else {
              console.warn(
                "[webhook] RESEND_API_KEY not set — skipping receipt to",
                donorEmail,
              );
            }
          } else {
            console.warn(
              "[webhook] no email on session for payment_intent",
              session.payment_intent,
            );
          }
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
          const recurringAmount = (invoiceAny.amount_paid || 0) / 100;
          const recurringCurrency = (invoiceAny.currency || "gbp").toUpperCase();
          const recurringGiftAid = metadata.gift_aid === "yes";
          const recurringGiftAidAmount = recurringGiftAid ? recurringAmount * 0.25 : 0;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: insertedRecurring } = await (supabase as any)
            .from("donations")
            .insert({
              donor_id: donorId,
              amount: recurringAmount,
              currency: recurringCurrency,
              donation_type: "recurring",
              stripe_payment_intent_id: invoiceAny.payment_intent as string,
              stripe_subscription_id: subscriptionId as string,
              gift_aid_amount: recurringGiftAidAmount,
              campaign: metadata.campaign || "general",
              status: "completed",
              completed_at: new Date().toISOString(),
            })
            .select("id")
            .single();

          if (insertedRecurring?.id) {
            void postDonationToAccounting(insertedRecurring.id).then((res) => {
              if (!res.ok) {
                console.error(
                  "[webhook] accounting bridge failed for recurring donation",
                  insertedRecurring.id,
                  res.error,
                );
              }
            });
          }

          // Send donation receipt email for recurring payment
          if (customerEmail) {
            const resend = getResendClient();
            if (resend) {
              try {
                const { subject, html } = donationReceiptEmail(
                  metadata.donor_name || "",
                  customerEmail,
                  recurringAmount,
                  recurringCurrency,
                  recurringGiftAid,
                  true, // recurring donation
                  invoiceAny.payment_intent as string
                );

                await resend.emails.send({
                  from: FROM_EMAIL,
                  to: customerEmail,
                  replyTo: REPLY_TO_EMAIL,
                  subject,
                  html,
                });
              } catch (emailError) {
                console.error("Failed to send recurring donation receipt email:", emailError);
              }
            }
          }
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
              frequency: "monthly",
              status: "active",
              started_at: new Date(subscription.start_date * 1000).toISOString(),
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
            cancelled_at: new Date().toISOString(),
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
