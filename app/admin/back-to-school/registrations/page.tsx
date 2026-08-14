import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { B2S, B2S_SLUG } from "@/lib/back-to-school";
import { B2SRegistrationRow } from "@/components/admin/back-to-school/RegistrationRow";
import { B2SBulkActions } from "@/components/admin/back-to-school/BulkActions";

type StatusFilter =
  | "all"
  | "waitlisted"
  | "walk_in"
  | "pending"
  | "approved"
  | "declined"
  | "collected"
  | "no_show";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export type B2SRegistration = {
  id: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  parent_postcode: string | null;
  status: string;
  qr_token: string | null;
  approval_email_sent_at: string | null;
  distribution_status: string | null;
  distribution_recorded_at: string | null;
  admin_notes: string | null;
  created_at: string;
  registration_children: Array<{
    id: string;
    child_name: string;
    child_age: number | null;
    uniform_size: string | null;
    sex: string | null;
    school: string | null;
    needs: string[] | null;
    items_given: Record<string, boolean> | null;
    uniform_choices: import("@/lib/back-to-school").UniformChoices | null;
    notes: string | null;
    display_order: number;
  }>;
};

const STATUS_TABS: Array<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "waitlisted", label: "Waitlist" },
  { key: "walk_in", label: "Walk-ins" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "declined", label: "Declined" },
  { key: "collected", label: "Collected" },
  { key: "no_show", label: "No-show" },
];

export default async function B2SRegistrationsAdminPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const statusFilter = (params.status as StatusFilter) ?? "all";

  const supabase = createAdminClient();

  const { data: eventRow } = await supabase
    .from("events")
    .select("id")
    .eq("slug", B2S_SLUG)
    .maybeSingle();

  if (!eventRow) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/back-to-school"
          className="text-sm text-gray-600 hover:text-brand-dark inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-6 text-sm text-amber-900">
          Drive event not seeded yet. Run the migration.
        </div>
      </div>
    );
  }
  const eventId = (eventRow as { id: string }).id;

  // Full list for counts (small volume; 500 max), then filter for display
  const { data: allRegs } = await supabase
    .from("registrations")
    .select(
      `
      id, parent_name, parent_email, parent_phone, parent_postcode,
      status, qr_token, approval_email_sent_at,
      distribution_status, distribution_recorded_at, admin_notes, created_at,
      registration_children (
        id, child_name, child_age, uniform_size, sex, school, needs,
        items_given, uniform_choices, notes, display_order
      )
      `,
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  const list = (allRegs as B2SRegistration[] | null) ?? [];

  const countBy = (status: string) =>
    list.filter((r) => r.status === status).length;
  const countDistribution = (dist: string) =>
    list.filter((r) => r.distribution_status === dist).length;

  const counts: Record<StatusFilter, number> = {
    all: list.length,
    waitlisted: countBy("waitlisted"),
    walk_in: countBy("walk_in"),
    pending: countBy("pending"),
    approved: countBy("approved"),
    declined: countBy("declined"),
    collected: countDistribution("collected"),
    no_show: countDistribution("no_show"),
  };

  const approvedNotEmailed = list.filter(
    (r) => r.status === "approved" && !r.approval_email_sent_at,
  ).length;

  const filtered = list.filter((r) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "collected" || statusFilter === "no_show") {
      return r.distribution_status === statusFilter;
    }
    return r.status === statusFilter;
  });

  // Waitlist and walk-ins are both FIFO — older sign-ups at the top so the
  // person who signed up first is seen first.
  if (statusFilter === "waitlisted" || statusFilter === "walk_in") {
    filtered.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <Link
          href="/admin/back-to-school"
          className="text-sm text-gray-600 hover:text-brand-dark inline-flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Back to School
        </Link>
        <h1 className="text-2xl md:text-3xl font-heading font-black text-brand-dark">
          Registrations
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {B2S.title} · Registration closes {B2S.registrationDeadlineLabel}
        </p>
      </div>

      {/* BULK ACTIONS */}
      <B2SBulkActions
        pendingCount={counts.pending}
        approvedNotEmailedCount={approvedNotEmailed}
      />

      {/* TABS */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {STATUS_TABS.map((tab) => {
          const isActive = tab.key === statusFilter;
          return (
            <Link
              key={tab.key}
              href={
                tab.key === "all"
                  ? "/admin/back-to-school/registrations"
                  : `/admin/back-to-school/registrations?status=${tab.key}`
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
          No registrations in this bucket yet.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((reg) => (
            <B2SRegistrationRow key={reg.id} registration={reg} />
          ))}
        </div>
      )}
    </div>
  );
}
