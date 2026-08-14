import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EventProposal } from "@/lib/event-proposals/types";
import { ProposalWizard } from "@/components/admin/events/ProposalWizard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string }>;
}

export default async function EditProposalPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const stepParam = Number(sp.step ?? "1");
  const step = Number.isFinite(stepParam) && stepParam >= 1 && stepParam <= 10
    ? Math.floor(stepParam)
    : 1;

  const supabase = createAdminClient();

  const { data: proposal } = await supabase
    .from("event_proposals")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!proposal) notFound();

  // Team members for planner/facilitator/volunteer selects
  const { data: teamRows } = await supabase
    .from("team_members")
    .select("id, name, email, role")
    .order("name", { ascending: true });
  const team =
    (teamRows as Array<{ id: string; name: string | null; email: string; role: string | null }> | null) ??
    [];

  // Funds for the funding pot picker
  const { data: fundRows } = await supabase
    .from("funds")
    .select("id, code, name")
    .order("name", { ascending: true });
  const funds =
    (fundRows as Array<{ id: string; code: string; name: string }> | null) ?? [];

  return (
    <ProposalWizard
      initial={proposal as EventProposal}
      team={team}
      funds={funds}
      initialStep={step}
    />
  );
}
