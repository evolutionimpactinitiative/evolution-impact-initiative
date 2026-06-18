import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { FESTIVAL_SLUG, VENDOR_CATEGORIES } from "@/lib/festival";
import { StatCard } from "@/components/admin/StatCard";
import { VendorAdminRow } from "@/components/admin/festival/VendorAdminRow";
import { FestivalAdminTabs } from "@/components/admin/festival/FestivalAdminTabs";
import type { FestivalVendor } from "@/lib/supabase/types";

type VendorFilter = "all" | "pending_review" | "approved" | "rejected" | "pending_payment";

interface PageProps {
  searchParams: Promise<{ status?: string; category?: string }>;
}

export default async function FestivalVendorsAdminPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const statusFilter = (params.status as VendorFilter | undefined) ?? "all";
  const categoryFilter = params.category ?? "all";

  const supabase = createAdminClient();

  // Festival event id
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
          Festival Vendors
        </h1>
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">
            The festival event row doesn&rsquo;t exist yet. Run the M1 migration
            to seed it.
          </p>
        </div>
      </div>
    );
  }

  // Load vendors
  let query = supabase
    .from("festival_vendors")
    .select("*")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") query = query.eq("status", statusFilter);
  if (categoryFilter !== "all") query = query.eq("category", categoryFilter);

  const { data: vendorsData } = await query;
  const vendors = (vendorsData as FestivalVendor[] | null) ?? [];

  // Stats from full dataset (no filter)
  const { data: allData } = await supabase
    .from("festival_vendors")
    .select("status, contribution_amount")
    .eq("event_id", event.id);
  type AllRow = {
    status: FestivalVendor["status"];
    contribution_amount: number;
  };
  const all = (allData as AllRow[] | null) ?? [];

  const pendingReview = all.filter((v) => v.status === "pending_review").length;
  const approved = all.filter((v) => v.status === "approved").length;
  const rejected = all.filter((v) => v.status === "rejected").length;
  const pendingPayment = all.filter((v) => v.status === "pending_payment").length;
  const totalContribution = all
    .filter((v) => v.status === "approved" || v.status === "pending_review")
    .reduce((sum, v) => sum + (v.contribution_amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <FestivalAdminTabs />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading font-black text-xl lg:text-2xl text-gray-900">
            Festival Vendors
          </h1>
          <p className="text-gray-600 text-sm lg:text-base mt-1">
            Approval queue for {event.title}
          </p>
        </div>
        <Link
          href={`/${FESTIVAL_SLUG}/apply-vendor`}
          target="_blank"
          className="text-sm font-heading font-semibold text-brand-blue hover:text-brand-green"
        >
          View public form ↗
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
        <StatCard
          title="Pending review"
          value={pendingReview}
          icon="ClipboardList"
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
        />
        <StatCard
          title="Approved"
          value={approved}
          icon="Heart"
          iconColor="text-brand-green"
          iconBgColor="bg-brand-green/10"
        />
        <StatCard
          title="Awaiting payment"
          value={pendingPayment}
          icon="TrendingUp"
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
        <StatCard
          title="Rejected"
          value={rejected}
          icon="Users"
          iconColor="text-gray-600"
          iconBgColor="bg-gray-100"
        />
        <StatCard
          title="Contributions"
          value={`£${(totalContribution / 100).toFixed(0)}`}
          subtitle="Approved + queued"
          icon="Gift"
          iconColor="text-brand-accent"
          iconBgColor="bg-brand-accent/10"
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterPill
          href={`/admin/festival/vendors${categoryFilter !== "all" ? `?category=${categoryFilter}` : ""}`}
          label="All statuses"
          active={statusFilter === "all"}
        />
        {(
          [
            { v: "pending_review", l: "Pending review" },
            { v: "approved", l: "Approved" },
            { v: "rejected", l: "Rejected" },
            { v: "pending_payment", l: "Awaiting payment" },
          ] as const
        ).map((s) => {
          const params = new URLSearchParams({ status: s.v });
          if (categoryFilter !== "all") params.set("category", categoryFilter);
          return (
            <FilterPill
              key={s.v}
              href={`/admin/festival/vendors?${params.toString()}`}
              label={s.l}
              active={statusFilter === s.v}
            />
          );
        })}
        <span className="text-gray-300 mx-2">·</span>
        <FilterPill
          href={`/admin/festival/vendors${statusFilter !== "all" ? `?status=${statusFilter}` : ""}`}
          label="All categories"
          active={categoryFilter === "all"}
        />
        {VENDOR_CATEGORIES.map((c) => {
          const params = new URLSearchParams({ category: c.key });
          if (statusFilter !== "all") params.set("status", statusFilter);
          return (
            <FilterPill
              key={c.key}
              href={`/admin/festival/vendors?${params.toString()}`}
              label={c.label}
              active={categoryFilter === c.key}
            />
          );
        })}
      </div>

      {/* List */}
      {vendors.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
          <p className="text-gray-500 text-sm">
            No vendor applications matching this filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {vendors.map((v) => (
            <VendorAdminRow key={v.id} vendor={v} />
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
