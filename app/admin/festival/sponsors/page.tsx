import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { FESTIVAL_SLUG } from "@/lib/festival";
import { StatCard } from "@/components/admin/StatCard";
import { SponsorAdminRow } from "@/components/admin/festival/SponsorAdminRow";
import { FestivalAdminTabs } from "@/components/admin/festival/FestivalAdminTabs";
import type { FestivalSponsor } from "@/lib/supabase/types";

type SponsorFilter =
  | "all"
  | "pending_payment"
  | "pending_review"
  | "confirmed"
  | "cancelled"
  | "refunded";

interface PageProps {
  searchParams: Promise<{ status?: string; path?: string }>;
}

export default async function FestivalSponsorsAdminPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const statusFilter = (params.status as SponsorFilter | undefined) ?? "all";
  const pathFilter = params.path ?? "all";

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
        <h1 className="font-heading font-black text-xl text-gray-900">
          Festival Sponsors
        </h1>
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">
            Run the M1 migration to seed the festival event row.
          </p>
        </div>
      </div>
    );
  }

  let query = supabase
    .from("festival_sponsors")
    .select("*")
    .eq("event_id", event.id)
    .order("amount_pledged", { ascending: false });

  if (statusFilter !== "all") query = query.eq("status", statusFilter);
  if (pathFilter !== "all") query = query.eq("path", pathFilter);

  const { data: sponsorsData } = await query;
  const sponsors = (sponsorsData as FestivalSponsor[] | null) ?? [];

  // Stats from full dataset
  const { data: allData } = await supabase
    .from("festival_sponsors")
    .select("status, amount_pledged")
    .eq("event_id", event.id);
  type AllRow = {
    status: FestivalSponsor["status"];
    amount_pledged: number;
  };
  const all = (allData as AllRow[] | null) ?? [];

  const pendingReview = all.filter((s) => s.status === "pending_review").length;
  const pendingPayment = all.filter((s) => s.status === "pending_payment").length;
  const confirmed = all.filter((s) => s.status === "confirmed").length;
  const confirmedPledges = all
    .filter((s) => s.status === "confirmed")
    .reduce((sum, s) => sum + (s.amount_pledged ?? 0), 0);

  return (
    <div className="space-y-6">
      <FestivalAdminTabs />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading font-black text-xl lg:text-2xl text-gray-900">
            Festival Sponsors
          </h1>
          <p className="text-gray-600 text-sm lg:text-base mt-1">
            Approval queue for {event.title}
          </p>
        </div>
        <Link
          href={`/${FESTIVAL_SLUG}/sponsor`}
          target="_blank"
          className="text-sm font-heading font-semibold text-brand-blue hover:text-brand-green"
        >
          View public form ↗
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          title="Pending review"
          value={pendingReview}
          icon="ClipboardList"
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
        />
        <StatCard
          title="Awaiting payment"
          value={pendingPayment}
          icon="TrendingUp"
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
        <StatCard
          title="Confirmed"
          value={confirmed}
          icon="Heart"
          iconColor="text-brand-green"
          iconBgColor="bg-brand-green/10"
        />
        <StatCard
          title="Pledged total"
          value={`£${(confirmedPledges / 100).toFixed(0)}`}
          subtitle="Confirmed only"
          icon="Gift"
          iconColor="text-brand-accent"
          iconBgColor="bg-brand-accent/10"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { v: "all", l: "All statuses" },
            { v: "pending_review", l: "Pending review" },
            { v: "pending_payment", l: "Awaiting payment" },
            { v: "confirmed", l: "Confirmed" },
            { v: "cancelled", l: "Cancelled" },
            { v: "refunded", l: "Refunded" },
          ] as const
        ).map((s) => {
          const params = new URLSearchParams();
          if (s.v !== "all") params.set("status", s.v);
          if (pathFilter !== "all") params.set("path", pathFilter);
          const href = `/admin/festival/sponsors${params.toString() ? `?${params.toString()}` : ""}`;
          return (
            <FilterPill
              key={s.v}
              href={href}
              label={s.l}
              active={statusFilter === s.v}
            />
          );
        })}
        <span className="text-gray-300 mx-2">·</span>
        {(
          [
            { v: "all", l: "All paths" },
            { v: "premium", l: "Premium" },
            { v: "community", l: "Community" },
            { v: "activity", l: "Activity" },
            { v: "custom", l: "Custom" },
          ] as const
        ).map((p) => {
          const params = new URLSearchParams();
          if (p.v !== "all") params.set("path", p.v);
          if (statusFilter !== "all") params.set("status", statusFilter);
          const href = `/admin/festival/sponsors${params.toString() ? `?${params.toString()}` : ""}`;
          return (
            <FilterPill
              key={p.v}
              href={href}
              label={p.l}
              active={pathFilter === p.v}
            />
          );
        })}
      </div>

      {sponsors.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
          <p className="text-gray-500 text-sm">
            No sponsorship applications matching this filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sponsors.map((s) => (
            <SponsorAdminRow key={s.id} sponsor={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPill({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`text-xs font-heading font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors ${
        active
          ? "bg-brand-blue text-white border-brand-blue"
          : "bg-white text-gray-700 border-gray-200 hover:border-brand-blue hover:text-brand-blue"
      }`}
    >
      {label}
    </Link>
  );
}
