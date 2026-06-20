import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { InvitationForm } from "@/components/admin/outcomes/InvitationForm";
import type { OutcomeInstrument } from "@/lib/outcomes/types";

export const dynamic = "force-dynamic";

export default async function NewInvitationPage() {
  const admin = createAdminClient();

  const [instrumentsRes, participantsRes, strandsRes] = await Promise.all([
    admin.from("outcome_instruments").select("*").eq("is_active", true).order("display_order"),
    admin
      .from("outcome_participants")
      .select("id, name, email")
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("outcome_invitations")
      .select("programme_strand")
      .not("programme_strand", "is", null),
  ]);

  const instruments = (instrumentsRes.data ?? []) as OutcomeInstrument[];
  const recentParticipants = (participantsRes.data ?? []) as {
    id: string;
    name: string | null;
    email: string | null;
  }[];
  const strandSuggestions = Array.from(
    new Set(
      ((strandsRes.data ?? []) as { programme_strand: string | null }[])
        .map((r) => r.programme_strand)
        .filter((s): s is string => !!s),
    ),
  ).sort();

  // Seed common strands if there's no history yet
  const defaultStrands = [
    "cin_early_years",
    "nlafa_youth",
    "nlafa_mens",
    "nlafa_womens",
    "general",
  ];
  const merged = Array.from(new Set([...strandSuggestions, ...defaultStrands]));

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
          Send a wellbeing survey
        </h1>
        <p className="text-gray-600 text-sm lg:text-base mt-1">
          Generates a single-use token, optionally emails the participant.
          They click the link and fill in the survey on their own device.
        </p>
      </div>

      <InvitationForm
        instruments={instruments}
        recentParticipants={recentParticipants}
        strandSuggestions={merged}
      />
    </div>
  );
}
