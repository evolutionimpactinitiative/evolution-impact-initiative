import Link from "next/link";
import { ClipboardList, Package, ArrowRight } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { B2S, B2S_SLUG } from "@/lib/back-to-school";
import { StatCard } from "@/components/admin/StatCard";

export default async function BackToSchoolAdminPage() {
  const supabase = createAdminClient();

  const { data: eventRow } = await supabase
    .from("events")
    .select("id, total_slots")
    .eq("slug", B2S_SLUG)
    .maybeSingle();

  let totalSlots: number = B2S.totalSlots;
  let pending = 0;
  let approved = 0;
  let declined = 0;
  let familiesRegistered = 0;
  let childrenOnTheList = 0;
  let approvalEmailsSent = 0;
  let collected = 0;

  if (eventRow) {
    const eventId = (eventRow as { id: string; total_slots: number }).id;
    totalSlots =
      (eventRow as { total_slots: number }).total_slots ?? B2S.totalSlots;

    const { data: statusRows } = await supabase
      .from("registrations")
      .select("id, status, approval_email_sent_at, distribution_status")
      .eq("event_id", eventId);
    const rows =
      (statusRows as Array<{
        id: string;
        status: string;
        approval_email_sent_at: string | null;
        distribution_status: string | null;
      }> | null) ?? [];

    pending = rows.filter((r) => r.status === "pending").length;
    approved = rows.filter((r) => r.status === "approved").length;
    declined = rows.filter((r) => r.status === "declined").length;
    familiesRegistered = rows.filter((r) =>
      ["pending", "approved"].includes(r.status),
    ).length;
    approvalEmailsSent = rows.filter(
      (r) => r.approval_email_sent_at,
    ).length;
    collected = rows.filter(
      (r) => r.distribution_status === "collected",
    ).length;

    const activeIds = rows
      .filter((r) => ["pending", "approved"].includes(r.status))
      .map((r) => r.id);
    if (activeIds.length > 0) {
      const { count } = await supabase
        .from("registration_children")
        .select("id", { count: "exact", head: true })
        .in("registration_id", activeIds);
      childrenOnTheList = count ?? 0;
    }
  }

  const { count: pledgesPending } = await supabase
    .from("back_to_school_supply_pledges")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  const { count: pledgesReceived } = await supabase
    .from("back_to_school_supply_pledges")
    .select("id", { count: "exact", head: true })
    .eq("status", "received");

  const capacityPct = totalSlots > 0 ? (familiesRegistered / totalSlots) * 100 : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-black text-brand-dark">
          {B2S.title}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {B2S.dateLabel} · {B2S.timeLabel} · {B2S.venueName}
        </p>
      </div>

      {/* CAPACITY */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <p className="text-sm font-heading font-bold text-brand-dark">
            {familiesRegistered} / {totalSlots} families registered
          </p>
          <p className="text-xs text-gray-500 uppercase tracking-widest">
            {Math.max(0, totalSlots - familiesRegistered)} spots left
          </p>
        </div>
        <div className="h-2 rounded-full bg-brand-blue/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-brand-green"
            style={{ width: `${Math.min(100, capacityPct)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Registration closes {B2S.registrationDeadlineLabel}
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard title="Pending" value={pending} icon="ClipboardList" />
        <StatCard title="Approved" value={approved} icon="UserCheck" />
        <StatCard
          title="Approval emails sent"
          value={approvalEmailsSent}
          icon="Mail"
        />
        <StatCard title="Collected on day" value={collected} icon="Gift" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <StatCard
          title="Children on the list"
          value={childrenOnTheList}
          icon="Users"
        />
        <StatCard title="Declined" value={declined} icon="XCircle" />
        <StatCard
          title="Supply pledges pending"
          value={pledgesPending ?? 0}
          icon="Gift"
        />
      </div>

      {/* QUICK LINKS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/back-to-school/registrations"
          className="group bg-white rounded-2xl p-6 border-2 border-brand-blue/10 hover:border-brand-blue transition-colors"
        >
          <ClipboardList className="h-6 w-6 text-brand-blue mb-3" />
          <h3 className="font-heading font-bold text-lg text-brand-dark mb-1">
            Manage registrations
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Approve, decline, and send approval emails to families.
          </p>
          <span className="inline-flex items-center gap-1 text-brand-blue font-heading font-bold text-sm uppercase tracking-widest">
            Open
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>

        <Link
          href="/admin/back-to-school/supplies"
          className="group bg-white rounded-2xl p-6 border-2 border-brand-blue/10 hover:border-brand-blue transition-colors"
        >
          <Package className="h-6 w-6 text-brand-blue mb-3" />
          <h3 className="font-heading font-bold text-lg text-brand-dark mb-1">
            Supply pledges
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            {pledgesPending ?? 0} pending · {pledgesReceived ?? 0} received.
            Confirm collections and mark items in.
          </p>
          <span className="inline-flex items-center gap-1 text-brand-blue font-heading font-bold text-sm uppercase tracking-widest">
            Open
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>
      </div>

      {!eventRow && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-6 text-sm text-amber-900">
          The drive event row hasn&rsquo;t been created yet. Run
          <code className="bg-amber-100 px-1.5 py-0.5 rounded ml-1">
            supabase-migration-back-to-school.sql
          </code>{" "}
          to seed it.
        </div>
      )}
    </div>
  );
}
