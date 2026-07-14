import { randomBytes } from "crypto";

/**
 * Generate a URL-safe QR token for a Back to School registration.
 * 24 random bytes → 32-char base64url, enough entropy that the token itself
 * is the secret (nobody guesses their way into a scan page).
 */
export function generateQrToken(): string {
  return randomBytes(24)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
