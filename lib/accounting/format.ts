// Money helpers. Pence in, formatted GBP out (and vice versa).

export function formatPence(pence: number): string {
  const pounds = pence / 100;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(pounds);
}

export function formatPenceShort(pence: number): string {
  // £450 (no .00 if whole pounds), £450.50 otherwise
  if (pence % 100 === 0) {
    return `£${(pence / 100).toLocaleString("en-GB")}`;
  }
  return formatPence(pence);
}

export function poundsToPence(pounds: string | number): number {
  // Accepts "450", "450.50", "1,250.99", 450.5
  const cleaned = String(pounds).replace(/,/g, "").trim();
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`Invalid amount: ${pounds}`);
  }
  return Math.round(n * 100);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
