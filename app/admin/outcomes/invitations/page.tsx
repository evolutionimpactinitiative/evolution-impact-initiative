import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { InvitationsList } from "@/components/admin/outcomes/InvitationsList";

export const dynamic = "force-dynamic";

interface JoinedRow {
  id: string;
  token: string;
  context_label: string | null;
  programme_strand: string | null;
  timepoint: string;
  recipient_email: string | null;
  email_sent_at: string | null;
  expires_at: string | null;
  response_id: string | null;
  created_at: string;
  instrument: { code: string; name: string } | null;
  participant: { name: string | null; email: string | null } | null;
}

export default async function InvitationsPage() {
  const admin = createAdminClient();

  const { data } = await admin
    .from("outcome_invitations")
    .select(
      `
      id, token, context_label, programme_strand, timepoint,
      recipient_email, email_sent_at, expires_at, response_id, created_at,
      instrument:outcome_instruments ( code, name ),
      participant:outcome_participants ( name, email )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as JoinedRow[];
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://evolutionimpactinitiative.co.uk";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/outcomes"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to outcomes
        </Link>
        <h1 className="font-heading font-black text-xl lg:text-2xl text-gray-900">
          Invitations
        </h1>
        <p className="text-gray-600 text-sm lg:text-base mt-1">
          {rows.length} invitation{rows.length === 1 ? "" : "s"} created.
        </p>
      </div>

      <InvitationsList rows={rows} baseUrl={baseUrl} />
    </div>
  );
}
