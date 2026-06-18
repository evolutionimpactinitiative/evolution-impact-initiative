import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { FESTIVAL_SLUG } from "@/lib/festival";
import { StatCard } from "@/components/admin/StatCard";
import { VolunteerAdminRow } from "@/components/admin/festival/VolunteerAdminRow";
import { FestivalAdminTabs } from "@/components/admin/festival/FestivalAdminTabs";
import type { FestivalVolunteer } from "@/lib/supabase/types";

type VolunteerFilter =
  | "all"
  | "pending"
  | "approved"
  | "assigned"
  | "declined"
  | "cancelled";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function FestivalVolunteersAdminPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const statusFilter = (params.status as VolunteerFilter | undefined) ?? "all";

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
          Festival Volunteers
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
    .from("festival_volunteers")
    .select("*")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") query = query.eq("status", statusFilter);

  const { data: volunteersData } = await query;
  const volunteers = (volunteersData as FestivalVolunteer[] | null) ?? [];

  // Stats from full dataset
  const { data: allData } = await supabase
    .from("festival_volunteers")
    .select("status, availability, t_shirt_size")
    .eq("event_id", event.id);
  type AllRow = {
    status: FestivalVolunteer["status"];
    availability: FestivalVolunteer["availability"];
    t_shirt_size: FestivalVolunteer["t_shirt_size"];
  };
  const all = (allData as AllRow[] | null) ?? [];

  const pending = all.filter((v) => v.status === "pending").length;
  const assigned = all.filter((v) => v.status === "assigned").length;
  const approved = all.filter((v) => v.status === "approved").length;
  const declined = all.filter((v) => v.status === "declined").length;

  const shiftCounts = {
    setup: all.filter((v) => v.availability?.setup).length,
    am: all.filter((v) => v.availability?.am).length,
    pm: all.filter((v) => v.availability?.pm).length,
    packdown: all.filter((v) => v.availability?.packdown).length,
  };

  return (
    <div className="space-y-6">
      <FestivalAdminTabs />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading font-black text-xl lg:text-2xl text-gray-900">
            Festival Volunteers
          </h1>
          <p className="text-gray-600 text-sm lg:text-base mt-1">
            {event.title} day-of team
          </p>
        </div>
        <Link
          href={`/${FESTIVAL_SLUG}/volunteer`}
          target="_blank"
          className="text-sm font-heading font-semibold text-brand-blue hover:text-brand-green"
        >
          View public form ↗
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          title="Pending"
          value={pending}
          icon="ClipboardList"
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
        />
        <StatCard
          title="Approved"
          value={approved}
          icon="Users"
          iconColor="text-brand-blue"
          iconBgColor="bg-brand-blue/10"
        />
        <StatCard
          title="Assigned"
          value={assigned}
          icon="Heart"
          iconColor="text-brand-green"
          iconBgColor="bg-brand-green/10"
        />
        <StatCard
          title="Declined"
          value={declined}
          icon="Mail"
          iconColor="text-gray-500"
          iconBgColor="bg-gray-100"
        />
      </div>

      {/* Shift coverage */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <p className="font-heading font-bold text-xs uppercase tracking-widest text-gray-500 mb-3">
          Shift coverage (across all applications)
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ShiftStat label="Setup" hint="10am–12pm" count={shiftCounts.setup} />
          <ShiftStat label="Festival AM" hint="12pm–3pm" count={shiftCounts.am} />
          <ShiftStat label="Festival PM" hint="3pm–6pm" count={shiftCounts.pm} />
          <ShiftStat
            label="Packdown"
            hint="6pm+"
            count={shiftCounts.packdown}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { v: "all", l: "All statuses" },
            { v: "pending", l: "Pending" },
            { v: "approved", l: "Approved" },
            { v: "assigned", l: "Assigned" },
            { v: "declined", l: "Declined" },
          ] as const
        ).map((s) => {
          const href =
            s.v === "all"
              ? "/admin/festival/volunteers"
              : `/admin/festival/volunteers?status=${s.v}`;
          return (
            <FilterPill
              key={s.v}
              href={href}
              label={s.l}
              active={statusFilter === s.v}
            />
          );
        })}
      </div>

      {volunteers.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
          <p className="text-gray-500 text-sm">
            No volunteer applications matching this filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {volunteers.map((v) => (
            <VolunteerAdminRow key={v.id} volunteer={v} />
          ))}
        </div>
      )}
    </div>
  );
}

function ShiftStat({
  label,
  hint,
  count,
}: {
  label: string;
  hint: string;
  count: number;
}) {
  return (
    <div className="text-center">
      <p className="font-heading font-black text-2xl text-brand-blue leading-none">
        {count}
      </p>
      <p className="text-xs font-heading font-bold uppercase tracking-widest text-gray-500 mt-1.5">
        {label}
      </p>
      <p className="text-[10px] text-gray-400">{hint}</p>
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
