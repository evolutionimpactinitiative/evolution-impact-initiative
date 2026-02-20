import { createAdminClient } from "@/lib/supabase/admin";
import { StatCard } from "@/components/admin/StatCard";
import { DonationsView } from "@/components/admin/DonationsView";

type Donation = {
  id: string;
  amount: number;
  currency: string;
  payment_method: string;
  gift_aid_claimed: boolean;
  status: string;
  donation_date: string;
  donors?: {
    name: string | null;
    email: string;
  } | null;
};

type Subscription = {
  id: string;
  amount: number;
  currency: string;
  interval: string;
  status: string;
  gift_aid_claimed: boolean;
  start_date: string;
  donors?: {
    name: string | null;
    email: string;
  } | null;
};

export default async function DonationsPage() {
  const supabase = createAdminClient();

  // Get all donations
  const { data: donationsData } = await supabase
    .from("donations")
    .select(`
      *,
      donors (name, email)
    `)
    .order("donation_date", { ascending: false })
    .limit(50);

  const donations = (donationsData as Donation[] | null) || [];

  // Get active subscriptions
  const { data: subscriptionsData } = await supabase
    .from("donation_subscriptions")
    .select(`
      *,
      donors (name, email)
    `)
    .eq("status", "active")
    .order("start_date", { ascending: false });

  const subscriptions = (subscriptionsData as Subscription[] | null) || [];

  // Calculate stats
  const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
  const monthlyRecurring = subscriptions.reduce((sum, s) => sum + s.amount, 0);
  const giftAidTotal = donations
    .filter((d) => d.gift_aid_claimed)
    .reduce((sum, d) => sum + d.amount * 0.25, 0);
  const donorCount = new Set(donations.map((d) => d.donors?.email).filter(Boolean)).size;

  // Get this month's donations
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthDonations = donations.filter(
    (d) => new Date(d.donation_date) >= startOfMonth
  );
  const thisMonthTotal = thisMonthDonations.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading font-black text-xl lg:text-2xl text-gray-900">
          Donations
        </h1>
        <p className="text-gray-600 text-sm lg:text-base mt-1">
          Track donations and manage Gift Aid
        </p>
      </div>

      {/* Stats - 2x3 grid on mobile, 5 cols on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
        <StatCard
          title="Total Raised"
          value={`£${totalDonations.toFixed(2)}`}
          icon="Heart"
          iconColor="text-brand-green"
          iconBgColor="bg-brand-green/10"
        />
        <StatCard
          title="This Month"
          value={`£${thisMonthTotal.toFixed(2)}`}
          icon="Calendar"
          iconColor="text-brand-blue"
          iconBgColor="bg-brand-blue/10"
        />
        <StatCard
          title="Monthly"
          value={`£${monthlyRecurring.toFixed(2)}`}
          subtitle="Recurring"
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

      {/* Donations List/Table */}
      <DonationsView donations={donations} subscriptions={subscriptions} />
    </div>
  );
}
