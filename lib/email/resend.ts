import { Resend } from "resend";

export const FROM_EMAIL = process.env.FROM_EMAIL || "Evolution Impact Initiative <hello@evolutionimpactinitiative.co.uk>";
export const REPLY_TO_EMAIL = "info@evolutionimpactinitiative.co.uk";

let resendClient: Resend | null = null;

export function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}
