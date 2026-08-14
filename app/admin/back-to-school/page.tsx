import Link from "next/link";
import QRCode from "qrcode";
import {
  ClipboardList,
  Package,
  ArrowRight,
  Building2,
  Boxes,
  Heart,
  Printer,
  Radio,
  ScanLine,
  ShoppingBag,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { B2S, B2S_SLUG } from "@/lib/back-to-school";
import { FESTIVAL } from "@/lib/festival";
import { StatCard } from "@/components/admin/StatCard";
import { QrShareCard } from "@/components/admin/QrShareCard";
import { RegistrationModeToggle } from "@/components/admin/back-to-school/RegistrationModeToggle";

export default async function BackToSchoolAdminPage() {
  const supabase = createAdminClient();

  const { data: eventRow } = await supabase
    .from("events")
    .select("id, total_slots, registration_mode")
    .eq("slug", B2S_SLUG)
    .maybeSingle();

  let totalSlots: number = B2S.totalSlots;
  let pending = 0;
  let approved = 0;
  let declined = 0;
  let waitlisted = 0;
  let familiesRegistered = 0;
  let childrenOnTheList = 0;
  let childrenOnWaitlist = 0;
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
    waitlisted = rows.filter((r) => r.status === "waitlisted").length;
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
    const waitlistIds = rows
      .filter((r) => r.status === "waitlisted")
      .map((r) => r.id);
    if (waitlistIds.length > 0) {
      const { count } = await supabase
        .from("registration_children")
        .select("id", { count: "exact", head: true })
        .in("registration_id", waitlistIds);
      childrenOnWaitlist = count ?? 0;
    }
  }
  const registrationMode =
    (eventRow as { registration_mode?: "open" | "waitlist" | "closed" } | null)
      ?.registration_mode ?? "open";

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

  // Stock summary — sum quantity + count unique SKUs
  const { data: stockRows } = await supabase
    .from("back_to_school_stock")
    .select("quantity");
  const stockList =
    (stockRows as Array<{ quantity: number }> | null) ?? [];
  const stockTotal = stockList.reduce((s, r) => s + (r.quantity ?? 0), 0);
  const stockSkuCount = stockList.length;

  // Donations tagged to the Back to School campaign. amount is stored in
  // whole pounds (see webhook), so no /100 conversion.
  const { data: donationsData } = await supabase
    .from("donations")
    .select("amount, donor_id, created_at")
    .eq("campaign", FESTIVAL.campaignKey)
    .eq("status", "completed");
  const donationsList =
    (donationsData as Array<{
      amount: number;
      donor_id: string | null;
      created_at: string;
    }> | null) ?? [];
  const donationStripePounds = donationsList.reduce(
    (s, d) => s + (d.amount ?? 0),
    0,
  );
  const donationTotalPounds =
    donationStripePounds + FESTIVAL.campaignOfflineRaisedPounds;
  const uniqueDonorIds = new Set(
    donationsList.map((d) => d.donor_id).filter(Boolean),
  );
  const donationCount = donationsList.length;
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const donationsThisWeek = donationsList
    .filter((d) => new Date(d.created_at) >= oneWeekAgo)
    .reduce((s, d) => s + (d.amount ?? 0), 0);
  const donationGoalPct =
    FESTIVAL.campaignTarget > 0
      ? Math.min(
          100,
          Math.round((donationTotalPounds / FESTIVAL.campaignTarget) * 100),
        )
      : 0;

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

  // Walk-in QR: only rendered if B2S_WALK_IN_KEY is set. Used at Station 1
  // on the day so walk-in families can self-register on their phones.
  const walkInKey = (process.env.B2S_WALK_IN_KEY ?? "").trim();
  const walkInLink = walkInKey
    ? `${BASE_URL}/back-to-school/walk-in?k=${encodeURIComponent(walkInKey)}`
    : null;
  const walkInQrSrc = walkInLink
    ? await QRCode.toDataURL(walkInLink, {
        width: 480,
        margin: 1,
        errorCorrectionLevel: "M",
        color: { dark: "#1E1E1E", light: "#FFFFFF" },
      })
    : null;

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

      {/* REGISTRATION MODE + WAITLIST / FUNDING */}
      <div className="bg-white rounded-2xl p-6 border-2 border-brand-blue/20 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="font-heading font-bold text-lg text-brand-dark">
              Registration mode
            </h3>
            <p className="text-xs text-gray-500 mt-1 mb-3">
              Controls what happens when families sign up on the public form.
              Existing registrations are never touched by a mode change.
            </p>
            <RegistrationModeToggle currentMode={registrationMode} />
          </div>
          {(registrationMode === "waitlist" || waitlisted > 0) && (
            <Link
              href="/admin/back-to-school/registrations?status=waitlisted"
              className="inline-flex items-center gap-1 text-brand-blue font-heading font-bold text-sm uppercase tracking-widest hover:text-brand-dark"
            >
              Waitlist ({waitlisted})
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {(registrationMode === "waitlist" || waitlisted > 0) &&
          (() => {
            const funded = Math.min(
              B2S.goalChildren,
              Math.floor(
                (donationStripePounds + FESTIVAL.campaignOfflineRaisedPounds) /
                  20,
              ),
            );
            const room = Math.max(0, funded - childrenOnTheList);
            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 pt-4 border-t border-gray-100">
                <MoneyTile
                  label="Funded for"
                  value={`${funded} kids`}
                  sub={`£${(donationStripePounds + FESTIVAL.campaignOfflineRaisedPounds).toLocaleString("en-GB")} raised ÷ £20`}
                />
                <MoneyTile
                  label="Committed"
                  value={`${childrenOnTheList} kids`}
                  sub="pending + approved"
                />
                <MoneyTile
                  label="On waitlist"
                  value={`${childrenOnWaitlist} kids`}
                  sub={`${waitlisted} famil${waitlisted === 1 ? "y" : "ies"}`}
                />
                <MoneyTile
                  label="Room to promote"
                  value={room > 0 ? `${room} kids` : "None yet"}
                  sub={
                    room > 0
                      ? "you can safely offer places"
                      : "raise more or wait for supplies"
                  }
                />
              </div>
            );
          })()}
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

      {/* DONATIONS */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="font-heading font-bold text-lg text-brand-dark inline-flex items-center gap-2">
              <Heart className="h-5 w-5 text-brand-green" />
              Donations to the drive
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Everything tagged{" "}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded">
                {FESTIVAL.campaignKey}
              </code>{" "}
              plus £{FESTIVAL.campaignOfflineRaisedPounds} offline offset.
            </p>
            {FESTIVAL.donationCampaignOverrideUntil &&
              Date.now() <=
                new Date(FESTIVAL.donationCampaignOverrideUntil).getTime() && (
                <p className="text-xs text-brand-blue font-heading font-bold uppercase tracking-widest mt-2">
                  Auto-tag on · every donation counts to B2S until{" "}
                  {new Date(
                    FESTIVAL.donationCampaignOverrideUntil,
                  ).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
          </div>
          <Link
            href="/admin/festival/donations"
            className="inline-flex items-center gap-1 text-brand-blue font-heading font-bold text-sm uppercase tracking-widest hover:text-brand-dark"
          >
            All donations
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
          <MoneyTile
            label="Raised so far"
            value={`£${donationTotalPounds.toLocaleString("en-GB")}`}
            sub={`${donationGoalPct}% of £${FESTIVAL.campaignTarget.toLocaleString("en-GB")}`}
          />
          <MoneyTile
            label="This week"
            value={`£${donationsThisWeek.toLocaleString("en-GB")}`}
          />
          <MoneyTile
            label="Donations"
            value={String(donationCount)}
            sub={`${uniqueDonorIds.size} donor${uniqueDonorIds.size === 1 ? "" : "s"}`}
          />
          <MoneyTile
            label="Children sponsored"
            value={String(
              Math.min(B2S.goalChildren, Math.floor(donationTotalPounds / 20)),
            )}
            sub={`£20 covers 1 kid`}
          />
        </div>

        <div className="h-2 rounded-full bg-brand-blue/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-brand-green transition-all duration-500"
            style={{ width: `${donationGoalPct}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          £
          {Math.max(
            0,
            FESTIVAL.campaignTarget - donationTotalPounds,
          ).toLocaleString("en-GB")}{" "}
          to go to hit the £
          {FESTIVAL.campaignTarget.toLocaleString("en-GB")} goal.
        </p>
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
          href="/admin/back-to-school/stock"
          className="group bg-white rounded-2xl p-6 border-2 border-brand-blue/10 hover:border-brand-blue transition-colors"
        >
          <Boxes className="h-6 w-6 text-brand-blue mb-3" />
          <h3 className="font-heading font-bold text-lg text-brand-dark mb-1">
            Stock
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            {stockTotal} items across {stockSkuCount} SKUs. See what&rsquo;s in
            the store vs. what&rsquo;s been requested and add new stock.
          </p>
          <span className="inline-flex items-center gap-1 text-brand-blue font-heading font-bold text-sm uppercase tracking-widest">
            Open
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>

        <Link
          href="/admin/back-to-school/tickets"
          className="group bg-white rounded-2xl p-6 border-2 border-brand-blue/10 hover:border-brand-blue transition-colors"
        >
          <Printer className="h-6 w-6 text-brand-blue mb-3" />
          <h3 className="font-heading font-bold text-lg text-brand-dark mb-1">
            Pick tickets
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            One printable A5 ticket per family, for the runners on the day.
            Bulk-print Friday night after the approval blast.
          </p>
          <span className="inline-flex items-center gap-1 text-brand-blue font-heading font-bold text-sm uppercase tracking-widest">
            Open
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>

        <Link
          href="/admin/back-to-school/day-view"
          className="group bg-white rounded-2xl p-6 border-2 border-brand-green/25 hover:border-brand-green transition-colors"
        >
          <Radio className="h-6 w-6 text-brand-green mb-3" />
          <h3 className="font-heading font-bold text-lg text-brand-dark mb-1">
            Day view (live)
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Big-screen counters for Station 4 on the day — served, still
            expected, no-shows, low stock, recent activity. Auto-refreshes
            every 20s.
          </p>
          <span className="inline-flex items-center gap-1 text-brand-green font-heading font-bold text-sm uppercase tracking-widest">
            Open
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>

        <Link
          href="/admin/back-to-school/stewards"
          className="group bg-white rounded-2xl p-6 border-2 border-brand-blue/10 hover:border-brand-blue transition-colors"
        >
          <ScanLine className="h-6 w-6 text-brand-blue mb-3" />
          <h3 className="font-heading font-bold text-lg text-brand-dark mb-1">
            Steward scanners
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            One private scanner URL per volunteer. WhatsApp the link or show
            them a QR to scan from your screen. Revoke instantly.
          </p>
          <span className="inline-flex items-center gap-1 text-brand-blue font-heading font-bold text-sm uppercase tracking-widest">
            Open
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>

        <Link
          href="/admin/back-to-school/shopping-list"
          className="group bg-white rounded-2xl p-6 border-2 border-amber-200 hover:border-amber-500 transition-colors"
        >
          <ShoppingBag className="h-6 w-6 text-amber-700 mb-3" />
          <h3 className="font-heading font-bold text-lg text-brand-dark mb-1">
            Shopping list
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Share one link with donors — they tick items to buy for the drive.
            Mark received when you collect + stock updates automatically.
          </p>
          <span className="inline-flex items-center gap-1 text-amber-700 font-heading font-bold text-sm uppercase tracking-widest">
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

      {/* WALK-IN QR — for Station 1 on the day */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-4">
        <div>
          <h3 className="font-heading font-bold text-lg text-brand-dark">
            Walk-in QR (venue only)
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Print this and put it at Station 1 on the day. Families without a
            pre-registration scan it on their own phone, register, and come
            back at 3pm for the walk-in slot.
          </p>
        </div>
        {walkInLink && walkInQrSrc ? (
          <>
            <QrShareCard
              link={walkInLink}
              qrSrc={walkInQrSrc}
              title={`${B2S.title} — Walk-in`}
              linkLabel="Walk-in URL:"
              posterSubtitle="Walk-in registration · 3pm – 4pm"
              description="Keep this away from the public site — the URL contains a venue key so only families at Station 1 can register."
            />
            <div className="bg-brand-pale/40 border border-brand-blue/20 rounded-xl p-4 text-sm text-brand-dark">
              <p className="font-heading font-bold uppercase tracking-widest text-xs mb-2 text-brand-blue">
                Station 1 · Assisted registration (phoneless families)
              </p>
              <p>
                Station 1 volunteers already have a big{" "}
                <strong>&ldquo;Register a phoneless family&rdquo;</strong>{" "}
                button on their scanner page. When a family arrives without
                a phone, the volunteer taps that, fills the form on their
                own device, prints the ticket, then loops back for the next
                family — no page reload, no URL wrangling.
              </p>
            </div>
          </>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
            <p className="font-heading font-bold uppercase tracking-widest text-xs mb-1">
              Walk-in QR not configured
            </p>
            <p>
              Set the <code className="bg-amber-100 px-1 py-0.5 rounded">B2S_WALK_IN_KEY</code> environment variable
              in Vercel (any secret string) and redeploy. The walk-in form will
              refuse any URL that doesn&rsquo;t include the matching key.
            </p>
          </div>
        )}
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

function MoneyTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-brand-pale/40 rounded-xl p-4">
      <p className="text-xs text-gray-500 uppercase tracking-widest font-heading font-bold">
        {label}
      </p>
      <p className="text-xl md:text-2xl font-heading font-black text-brand-dark mt-1">
        {value}
      </p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}
