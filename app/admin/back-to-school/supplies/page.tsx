import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { SupplyPledgeRow } from "@/components/admin/back-to-school/SupplyPledgeRow";

type StatusFilter = "all" | "pending" | "confirmed" | "received" | "cancelled";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export type SupplyPledge = {
  id: string;
  donor_name: string;
  donor_email: string;
  donor_phone: string;
  items: Array<{ item: string; size: string | null; qty: number }>;
  delivery_method: "drop_off" | "collection";
  collection_address: string | null;
  collection_postcode: string | null;
  preferred_window: string | null;
  notes: string | null;
  admin_notes: string | null;
  status: "pending" | "confirmed" | "received" | "cancelled";
  received_at: string | null;
  created_at: string;
};

const STATUS_TABS: Array<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "received", label: "Received" },
  { key: "cancelled", label: "Cancelled" },
];

export default async function B2SSuppliesAdminPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = (params.status as StatusFilter) ?? "all";

  const supabase = createAdminClient();

  const { data: pledges } = await supabase
    .from("back_to_school_supply_pledges")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (pledges as SupplyPledge[] | null) ?? [];

  const countBy = (status: string) =>
    list.filter((p) => p.status === status).length;

  const counts: Record<StatusFilter, number> = {
    all: list.length,
    pending: countBy("pending"),
    confirmed: countBy("confirmed"),
    received: countBy("received"),
    cancelled: countBy("cancelled"),
  };

  const filtered = list.filter((p) =>
    statusFilter === "all" ? true : p.status === statusFilter,
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/back-to-school"
          className="text-sm text-gray-600 hover:text-brand-dark inline-flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Back to School
        </Link>
        <h1 className="text-2xl md:text-3xl font-heading font-black text-brand-dark">
          Supply pledges
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Confirm pickup/drop-off arrangements, then mark items in on the day.
        </p>
      </div>

      {/* TABS */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {STATUS_TABS.map((tab) => {
          const isActive = tab.key === statusFilter;
          return (
            <Link
              key={tab.key}
              href={
                tab.key === "all"
                  ? "/admin/back-to-school/supplies"
                  : `/admin/back-to-school/supplies?status=${tab.key}`
              }
              className={
                isActive
                  ? "bg-brand-blue text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest"
                  : "bg-white text-brand-dark border border-gray-200 hover:border-brand-blue px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest"
              }
            >
              {tab.label}
              <span
                className={`ml-2 text-xs ${isActive ? "text-white/70" : "text-gray-500"}`}
              >
                {counts[tab.key]}
              </span>
            </Link>
          );
        })}
      </div>

      {/* LIST */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-500">
          No pledges in this bucket yet.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((pledge) => (
            <SupplyPledgeRow key={pledge.id} pledge={pledge} />
          ))}
        </div>
      )}
    </div>
  );
}
