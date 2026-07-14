import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { StatCard } from "@/components/admin/StatCard";
import { DonationsView } from "@/components/admin/DonationsView";
import { FestivalAdminTabs } from "@/components/admin/festival/FestivalAdminTabs";
import { FESTIVAL, FIRST_YEAR_STATS } from "@/lib/festival";

// Live as donations come in via the webhook
export const revalidate = 0;

type Donation = {
  id: string;
  amount: number;
  currency: string;
  donation_type: string;
  gift_aid_amount: number;
  status: string;
  created_at: string;
  completed_at: string | null;
  donors?: {
    name: string | null;
    email: string;
  } | null;
};

type Subscription = {
  id: string;
  amount: number;
  frequency: string;
  status: string;
  started_at: string;
  donors?: {
    name: string | null;
    email: string;
  } | null;
};

export default async function FestivalDonationsAdminPage() {
  const supabase = createAdminClient();

  // Pull every donation tagged to the Back to School campaign
  const { data: donationsData } = await supabase
    .from("donations")
    .select(`*, donors (name, email)`)
    .eq("campaign", FESTIVAL.campaignKey)
    .order("created_at", { ascending: false })
    .limit(200);
  const donations = (donationsData as Donation[] | null) ?? [];

  // Active recurring subscriptions that fed donations into this campaign
  const recurringSubIds = Array.from(
    new Set(
      donations
        .filter((d) => d.donation_type === "recurring")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((d) => (d as any).stripe_subscription_id)
        .filter(Boolean),
    ),
  ) as string[];

  let subscriptions: Subscription[] = [];
  if (recurringSubIds.length > 0) {
    const { data: subsData } = await supabase
      .from("donation_subscriptions")
      .select(`*, donors (name, email)`)
      .in("stripe_subscription_id", recurringSubIds)
      .order("started_at", { ascending: false });
    subscriptions = (subsData as Subscription[] | null) ?? [];
  }

  // Stats — only completed donations count toward "raised"
  const completed = donations.filter((d) => d.status === "completed");
  const totalRaised = completed.reduce((sum, d) => sum + (d.amount ?? 0), 0);
  const giftAidTotal = completed.reduce(
    (sum, d) => sum + (d.gift_aid_amount ?? 0),
    0,
  );
  const monthlyRecurring = subscriptions
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + (s.amount ?? 0), 0);
  const donorCount = new Set(
    completed.map((d) => d.donors?.email).filter(Boolean),
  ).size;

  // This week (last 7 days)
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekTotal = completed
    .filter((d) => new Date(d.created_at) >= oneWeekAgo)
    .reduce((sum, d) => sum + (d.amount ?? 0), 0);

  const targetPounds = FESTIVAL.campaignTarget;
  const goalPercent =
    targetPounds > 0
      ? Math.min(100, Math.round((totalRaised / targetPounds) * 100))
      : 0;

  return (
    <div className="space-y-6">
      <FestivalAdminTabs />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading font-black text-xl lg:text-2xl text-gray-900">
            Back to School donations
          </h1>
          <p className="text-gray-600 text-sm lg:text-base mt-1">
            All donations tagged{" "}
            <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
              {FESTIVAL.campaignKey}
            </code>{" "}
            — for the {FIRST_YEAR_STATS.goalChildren}-child campaign.
          </p>
        </div>
        <Link
          href="/back-to-school"
          target="_blank"
          className="text-sm font-heading font-semibold text-brand-blue hover:text-brand-green"
        >
          View public donation page ↗
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
        <StatCard
          title="Raised so far"
          value={`£${totalRaised.toFixed(2)}`}
          subtitle={`${goalPercent}% of £${targetPounds.toLocaleString("en-GB")}`}
          icon="Heart"
          iconColor="text-brand-green"
          iconBgColor="bg-brand-green/10"
        />
        <StatCard
          title="This week"
          value={`£${weekTotal.toFixed(2)}`}
          icon="Calendar"
          iconColor="text-brand-blue"
          iconBgColor="bg-brand-blue/10"
        />
        <StatCard
          title="Monthly recurring"
          value={`£${monthlyRecurring.toFixed(2)}`}
          subtitle="Active subs"
          icon="TrendingUp"
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
        <StatCard
          title="Gift Aid"
          value={`£${giftAidTotal.toFixed(2)}`}
          subtitle="+25% bonus"
          icon="Gift"
          iconColor="text-brand-accent"
          iconBgColor="bg-brand-accent/10"
        />
        <StatCard
          title="Donors"
          value={donorCount}
          icon="Users"
          iconColor="text-gray-600"
          iconBgColor="bg-gray-100"
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {/* Progress bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
          <p className="font-heading font-bold text-xs uppercase tracking-widest text-brand-blue">
            £10,000 goal · {goalPercent}%
          </p>
          <p className="text-xs text-gray-500">
            £{(targetPounds - totalRaised).toLocaleString("en-GB")} to go
          </p>
        </div>
        <div
          className="h-3 bg-brand-blue/10 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={goalPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-brand-green rounded-full transition-all duration-500"
            style={{ width: `${goalPercent}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-3">
          That&rsquo;s{" "}
          <span className="font-heading font-bold text-brand-dark">
            {Math.min(
              FIRST_YEAR_STATS.goalChildren,
              Math.floor(totalRaised / 20),
            )}
          </span>{" "}
          of {FIRST_YEAR_STATS.goalChildren} children sponsored so far (£20 per
          uniform).
        </p>
      </div>

      {/* Empty state */}
      {donations.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
          <p className="text-gray-500 text-sm">
            No Back to School donations yet. Share{" "}
            <Link
              href="/back-to-school"
              target="_blank"
              className="text-brand-blue underline"
            >
              the campaign page
            </Link>{" "}
            to get the first one.
          </p>
        </div>
      ) : (
        <DonationsView donations={donations} subscriptions={subscriptions} />
      )}
    </div>
  );
}
