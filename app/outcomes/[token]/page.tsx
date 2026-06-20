import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { OutcomeSurveyForm } from "@/components/outcomes/OutcomeSurveyForm";
import type { OutcomeInstrument, OutcomeInvitation } from "@/lib/outcomes/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function PublicOutcomeSurveyPage({ params }: PageProps) {
  const { token } = await params;
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: invRaw } = await (admin as any)
    .from("outcome_invitations")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  const invitation = invRaw as OutcomeInvitation | null;
  if (!invitation) notFound();

  const isExpired =
    invitation.expires_at != null &&
    new Date(invitation.expires_at) < new Date();
  const alreadySubmitted = invitation.response_id != null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: instRaw } = await (admin as any)
    .from("outcome_instruments")
    .select("*")
    .eq("id", invitation.instrument_id)
    .maybeSingle();
  const instrument = instRaw as OutcomeInstrument | null;
  if (!instrument) notFound();

  let participantName: string | null = null;
  let participantEmail: string | null = null;
  if (invitation.participant_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: p } = await (admin as any)
      .from("outcome_participants")
      .select("name, email")
      .eq("id", invitation.participant_id)
      .maybeSingle();
    participantName = p?.name ?? null;
    participantEmail = p?.email ?? null;
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto">
        <header className="mb-6 sm:mb-8 text-center">
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-brand-dark">
            {instrument.name}
          </h1>
          {instrument.short_description && (
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              {instrument.short_description}
            </p>
          )}
          {invitation.context_label && (
            <p className="text-xs text-gray-500 mt-3 italic">
              {invitation.context_label}
            </p>
          )}
          {invitation.programme_strand && !invitation.context_label && (
            <p className="text-xs text-gray-400 mt-3 uppercase tracking-wide">
              {invitation.programme_strand.replace(/_/g, " ")}
            </p>
          )}
        </header>

        {alreadySubmitted ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 text-center">
            <p className="text-gray-700">
              Thank you — this survey has already been submitted.
            </p>
          </div>
        ) : isExpired ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 text-center">
            <p className="text-gray-700">
              This survey link has expired. Please contact us if you still
              need to fill it in.
            </p>
          </div>
        ) : (
          <OutcomeSurveyForm
            token={token}
            instrument={instrument}
            knownParticipantName={participantName}
            knownParticipantEmail={participantEmail}
          />
        )}

        <footer className="mt-8 text-center text-xs text-gray-400">
          Evolution Impact Initiative · responses are stored securely
        </footer>
      </div>
    </main>
  );
}
