import Link from "next/link";
import QRCode from "qrcode";
import { ClipboardList, Package, ArrowRight, Building2 } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { B2S, B2S_SLUG } from "@/lib/back-to-school";
import { StatCard } from "@/components/admin/StatCard";
import { QrShareCard } from "@/components/admin/QrShareCard";

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

  const { count: sponsorsPending } = await supabase
    .from("back_to_school_sponsor_inquiries")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  const { count: sponsorsConfirmed } = await supabase
    .from("back_to_school_sponsor_inquiries")
    .select("id", { count: "exact", head: true })
    .eq("status", "confirmed");

  const capacityPct = totalSlots > 0 ? (childrenOnTheList / totalSlots) * 100 : 0;

  const BASE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || "https://evolutionimpactinitiative.co.uk";
  const donateLink = `${BASE_URL}/back-to-school`;
  const donateQrSrc = await QRCode.toDataURL(donateLink, {
    width: 480,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#1E1E1E", light: "#FFFFFF" },
  });

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
            {childrenOnTheList} / {totalSlots} kids registered
          </p>
          <p className="text-xs text-gray-500 uppercase tracking-widest">
            {Math.max(0, totalSlots - childrenOnTheList)} kids left
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
          title="Families registered"
          value={familiesRegistered}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        <Link
          href="/admin/back-to-school/sponsors"
          className="group bg-white rounded-2xl p-6 border-2 border-brand-green/25 hover:border-brand-green transition-colors"
        >
          <Building2 className="h-6 w-6 text-brand-green mb-3" />
          <h3 className="font-heading font-bold text-lg text-brand-dark mb-1">
            Sponsor inquiries
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            {sponsorsPending ?? 0} pending · {sponsorsConfirmed ?? 0}{" "}
            confirmed. Follow up within 2 working days.
          </p>
          <span className="inline-flex items-center gap-1 text-brand-green font-heading font-bold text-sm uppercase tracking-widest">
            Open
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>
      </div>

      {/* SHARE / QR */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-4">
        <div>
          <h3 className="font-heading font-bold text-lg text-brand-dark">
            Promote the drive
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Print or display this QR code so people can scan to register, donate money, or pledge supplies.
          </p>
        </div>
        <QrShareCard
          link={donateLink}
          qrSrc={donateQrSrc}
          title={B2S.title}
          linkLabel="Public drive page:"
          posterSubtitle="Scan to donate or pledge supplies"
          description="Print or display this QR on flyers, posters, or at events."
        />
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
