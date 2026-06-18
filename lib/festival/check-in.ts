import { randomBytes } from "crypto";

const STEWARD_TOKEN_LENGTH = 32;

/**
 * Generate a long URL-safe random string for steward access tokens.
 * 32 chars from a 64-char alphabet ≈ 192 bits of entropy.
 */
export function generateStewardToken(): string {
  return randomBytes(STEWARD_TOKEN_LENGTH).toString("base64url").slice(0, STEWARD_TOKEN_LENGTH);
}

/**
 * Build the public scan URL for a given steward token.
 */
export function stewardScanUrl(token: string, baseUrl?: string): string {
  const base =
    baseUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://www.evolutionimpactinitiative.co.uk");
  return `${base.replace(/\/$/, "")}/scan/${token}`;
}

/**
 * Extract a ticket code from either a raw 10-char code or a full ticket URL.
 * Returns null if nothing recognisable is present.
 */
export function extractTicketCode(rawInput: string): string | null {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  // If it's a URL containing /ticket/CODE, pull the last path segment
  if (trimmed.includes("/ticket/")) {
    const segment = trimmed.split("/ticket/")[1]?.split(/[?#/]/)[0];
    if (segment) return segment.toUpperCase().trim();
  }

  // If it looks like a raw code (alphanumeric, no spaces) just normalise it
  if (/^[A-Z0-9]+$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  return null;
}
