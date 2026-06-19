import { createAdminClient } from "@/lib/supabase/admin";
import { FESTIVAL_SLUG } from "@/lib/festival";
import { stewardScanUrl } from "@/lib/festival/check-in";
import { StatCard } from "@/components/admin/StatCard";
import { FestivalAdminTabs } from "@/components/admin/festival/FestivalAdminTabs";
import { StewardTokensView } from "@/components/admin/festival/StewardTokensView";
import { ManualCheckInForm } from "@/components/admin/festival/ManualCheckInForm";
import {
  CheckedInList,
  type CheckedInRow,
} from "@/components/admin/festival/CheckedInList";
import type { FestivalStewardToken } from "@/lib/supabase/types";

interface HeadcountRow {
  total_tickets: number;
  checked_in: number;
  pending: number;
}

export default async function FestivalCheckInAdminPage() {
  const supabase = createAdminClient();

  const { data: eventRow } = await supabase
    .from("events")
    .select("id, title")
    .eq("slug", FESTIVAL_SLUG)
    .maybeSingle();
  const event = eventRow as { id: string; title: string } | null;

  if (!event) {
    return (
      <div className="space-y-4">
        <FestivalAdminTabs />
        <h1 className="font-heading font-black text-xl text-gray-900">
          Check-in
        </h1>
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">
            Run the M1 migration to seed the festival event row.
          </p>
        </div>
      </div>
    );
  }

  // Live headcount via RPC
  let totalTickets = 0;
  let checkedIn = 0;
  let pending = 0;
  try {
    const { data } = await supabase.rpc("get_festival_headcount", {
      p_event_id: event.id,
    });
    const row = (data as HeadcountRow[] | null)?.[0];
    if (row) {
      totalTickets = row.total_tickets;
      checkedIn = row.checked_in;
      pending = row.pending;
    }
  } catch {
    // RPC may not exist if migration not run — fall through with zeros
  }

  const checkedInPercent =
    totalTickets > 0 ? Math.round((checkedIn / totalTickets) * 100) : 0;

  // Steward tokens (active + revoked)
  const { data: tokensData } = await supabase
    .from("festival_steward_tokens")
    .select("*")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false });
  const tokens = (tokensData as FestivalStewardToken[] | null) ?? [];

  const activeTokens = tokens.filter((t) => !t.revoked_at);
  const revokedTokens = tokens.filter((t) => t.revoked_at);

  // Pre-compute URLs server-side so the client doesn't need NEXT_PUBLIC_SITE_URL
  const activeWithUrls = activeTokens.map((t) => ({
    ...t,
    scanUrl: stewardScanUrl(t.token),
  }));

  // Recent check-ins (with the lead booker's name from the joined registration)
  const { data: checkedInData } = await supabase
    .from("festival_tickets")
    .select(
      `id, ticket_code, holder_name, holder_type, checked_in_at,
       registrations!inner (parent_name)`,
    )
    .eq("event_id", event.id)
    .not("checked_in_at", "is", null)
    .order("checked_in_at", { ascending: false })
    .limit(200);

  type CheckedInRaw = {
    id: string;
    ticket_code: string;
    holder_name: string | null;
    holder_type: "lead" | "adult" | "child";
    checked_in_at: string;
    registrations: { parent_name: string };
  };
  const checkedInRows: CheckedInRow[] = (
    (checkedInData as CheckedInRaw[] | null) ?? []
  ).map((row) => ({
    id: row.id,
    ticket_code: row.ticket_code,
    holder_name: row.holder_name,
    holder_type: row.holder_type,
    checked_in_at: row.checked_in_at,
    parent_name: row.registrations?.parent_name ?? "Guest",
  }));

  return (
    <div className="space-y-6">
      <FestivalAdminTabs />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading font-black text-xl lg:text-2xl text-gray-900">
            Check-in
          </h1>
          <p className="text-gray-600 text-sm lg:text-base mt-1">
            Live capacity, steward tokens and manual check-in for {event.title}
          </p>
        </div>
      </div>

      {/* Live stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          title="Tickets issued"
          value={totalTickets}
          icon="Users"
          iconColor="text-brand-blue"
          iconBgColor="bg-brand-blue/10"
        />
        <StatCard
          title="Checked in"
          value={checkedIn}
          icon="Heart"
          iconColor="text-brand-green"
          iconBgColor="bg-brand-green/10"
        />
        <StatCard
          title="Still to arrive"
          value={pending}
          icon="ClipboardList"
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
        />
        <StatCard
          title="% checked in"
          value={`${checkedInPercent}%`}
          icon="TrendingUp"
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
      </div>

      {/* Checked-in list */}
      <CheckedInList rows={checkedInRows} />

      {/* Steward tokens */}
      <StewardTokensView
        active={activeWithUrls}
        revoked={revokedTokens}
      />

      {/* Manual check-in */}
      <ManualCheckInForm />
    </div>
  );
}
