import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { StewardScanner } from "@/components/festival/StewardScanner";
import { FESTIVAL } from "@/lib/festival";

export const metadata: Metadata = {
  title: `Door scanner · ${FESTIVAL.title}`,
  description: "Steward QR scanner for Evolution Fest 2026 check-in.",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ScanPage({ params }: PageProps) {
  const { token } = await params;

  const supabase = createAdminClient();
  const { data: tokenRow } = await supabase
    .from("festival_steward_tokens")
    .select("id, event_id, label, revoked_at")
    .eq("token", token)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const steward = tokenRow as any;
  if (!steward || steward.revoked_at) return notFound();

  // Total tickets for this event (so the steward sees the denominator)
  const { count: totalCount } = await supabase
    .from("festival_tickets")
    .select("id", { count: "exact", head: true })
    .eq("event_id", steward.event_id);

  return (
    <StewardScanner
      token={token}
      label={steward.label}
      totalTickets={totalCount ?? 0}
    />
  );
}
