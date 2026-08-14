// URL builder for the Back to School steward scanner. Kept separate from
// the festival helper so it stays obvious which drive we're pointing at.

export function b2sStewardScanUrl(token: string, baseUrl?: string): string {
  const base =
    baseUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://www.evolutionimpactinitiative.co.uk");
  return `${base.replace(/\/$/, "")}/b2s/scan/${token}`;
}
