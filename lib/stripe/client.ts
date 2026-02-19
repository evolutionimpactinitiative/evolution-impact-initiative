import Stripe from "stripe";

export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe | null {
  if (!STRIPE_SECRET_KEY) {
    return null;
  }
  if (!stripeClient) {
    stripeClient = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2026-01-28.clover",
      typescript: true,
    });
  }
  return stripeClient;
}

export const DONATION_AMOUNTS = [
  { value: 5, label: "£5" },
  { value: 10, label: "£10" },
  { value: 25, label: "£25" },
  { value: 50, label: "£50" },
  { value: 100, label: "£100" },
];

export const DONATION_FREQUENCIES = [
  { value: "one-time", label: "One-time donation" },
  { value: "monthly", label: "Monthly donation" },
];
