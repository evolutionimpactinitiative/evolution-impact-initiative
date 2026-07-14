import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { SponsorInquiryRow } from "@/components/admin/back-to-school/SponsorInquiryRow";

type StatusFilter =
  | "all"
  | "pending"
  | "contacted"
  | "confirmed"
  | "declined"
  | "cancelled";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export type SponsorInquiry = {
  id: string;
  business_name: string;
  contact_name: string;
  contact_role: string | null;
  contact_email: string;
  contact_phone: string;
  tier: string;
  amount_gbp: number | null;
  message: string | null;
  admin_notes: string | null;
  status: "pending" | "contacted" | "confirmed" | "declined" | "cancelled";
  followed_up_at: string | null;
  confirmed_at: string | null;
  created_at: string;
};

const STATUS_TABS: Array<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "contacted", label: "Contacted" },
  { key: "confirmed", label: "Confirmed" },
  { key: "declined", label: "Declined" },
  { key: "cancelled", label: "Cancelled" },
];

export default async function B2SSponsorsAdminPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = (params.status as StatusFilter) ?? "all";

  const supabase = createAdminClient();

  const { data: inquiries } = await supabase
    .from("back_to_school_sponsor_inquiries")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (inquiries as SponsorInquiry[] | null) ?? [];

  const countBy = (status: string) =>
    list.filter((p) => p.status === status).length;

  const counts: Record<StatusFilter, number> = {
    all: list.length,
    pending: countBy("pending"),
    contacted: countBy("contacted"),
    confirmed: countBy("confirmed"),
    declined: countBy("declined"),
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
          Sponsor inquiries
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Businesses interested in sponsoring the drive. Follow up within 2
          working days.
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
                  ? "/admin/back-to-school/sponsors"
                  : `/admin/back-to-school/sponsors?status=${tab.key}`
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
          No sponsor inquiries in this bucket yet.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inq) => (
            <SponsorInquiryRow key={inq.id} inquiry={inq} />
          ))}
        </div>
      )}
    </div>
  );
}
