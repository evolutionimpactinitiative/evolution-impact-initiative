/**
 * Extract a Back to School QR token from a scanned string.
 * Accepts:
 *   - Full URLs like https://site/b2s/verify/{token}
 *   - Bare tokens (base64url-ish strings)
 * Returns null if nothing matches.
 */
export function extractB2SQrToken(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Try to match /b2s/verify/{token} in a URL
  const urlMatch = trimmed.match(/\/b2s\/verify\/([A-Za-z0-9_\-]+)/);
  if (urlMatch) return urlMatch[1];

  // Fall back to accepting a bare token
  if (/^[A-Za-z0-9_\-]{16,}$/.test(trimmed)) return trimmed;

  return null;
}
