import { Resend } from "resend";

// Always use the company name in the from field
const fromAddress = process.env.FROM_EMAIL || "hello@evolutionimpactinitiative.co.uk";
export const FROM_EMAIL = `Evolution Impact Initiative <${fromAddress.includes("<") ? fromAddress.split("<")[1].replace(">", "") : fromAddress}>`;
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
