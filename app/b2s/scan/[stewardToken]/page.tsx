import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { B2S, B2S_SLUG } from "@/lib/back-to-school";
import { StewardScannerB2S } from "@/components/back-to-school/StewardScannerB2S";

interface Props {
  params: Promise<{ stewardToken: string }>;
}

export const dynamic = "force-dynamic";

export default async function B2SScanStewardPage({ params }: Props) {
  const { stewardToken } = await params;
  const supabase = createAdminClient();

  const { data: eventRow } = await supabase
    .from("events")
    .select("id")
    .eq("slug", B2S_SLUG)
    .maybeSingle();

  if (!eventRow) notFound();
  const eventId = (eventRow as { id: string }).id;

  const { data: tokenRow } = await supabase
    .from("festival_steward_tokens")
    .select("id, label, revoked_at, event_id")
    .eq("token", stewardToken)
    .maybeSingle();

  const token = tokenRow as {
    id: string;
    label: string;
    revoked_at: string | null;
    event_id: string;
  } | null;

  if (!token || token.event_id !== eventId || token.revoked_at) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center border border-red-200">
          <AlertTriangle className="h-10 w-10 text-red-600 mx-auto mb-4" />
          <h1 className="font-heading font-black text-2xl text-brand-dark mb-2">
            Scanner unavailable
          </h1>
          <p className="text-gray-600 mb-6">
            {token?.revoked_at
              ? "This steward link has been revoked."
              : "This link isn't valid for the Back to School Drive."}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-heading font-bold uppercase tracking-widest text-brand-blue hover:text-brand-dark"
          >
            Home
          </Link>
        </div>
      </div>
    );
  }

  const { count: totalRegistrations } = await supabase
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("status", "approved");

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6 md:py-10">
      <div className="max-w-lg mx-auto mb-4 text-center">
        <p className="text-xs uppercase tracking-widest text-brand-blue font-heading font-bold mb-1">
          Back to School Drive
        </p>
        <h1 className="font-heading font-black text-xl text-brand-dark">
          {B2S.venueName} · {B2S.timeLabel}
        </h1>
      </div>

      <StewardScannerB2S
        stewardToken={stewardToken}
        label={token.label}
        totalRegistrations={totalRegistrations ?? 0}
      />
    </div>
  );
}
