import { createAdminClient } from "@/lib/supabase/admin";
import { StatCard } from "@/components/admin/StatCard";
import { SubscribersView } from "@/components/admin/SubscribersView";

type Subscriber = {
  id: string;
  email: string;
  name: string | null;
  status: string;
  source: string;
  subscribed_at: string;
  unsubscribed_at: string | null;
  created_at: string;
};

export default async function SubscribersPage() {
  const supabase = createAdminClient();

  // Get all subscribers
  const { data: subscribersData } = await supabase
    .from("mailing_list")
    .select("*")
    .order("subscribed_at", { ascending: false });

  const subscribers = (subscribersData as Subscriber[] | null) || [];

  // Calculate stats
  const totalSubscribers = subscribers.length;
  const activeSubscribers = subscribers.filter((s) => s.status === "active").length;
  const unsubscribed = subscribers.filter((s) => s.status === "unsubscribed").length;

  // Get this month's subscribers
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthSubscribers = subscribers.filter(
    (s) => new Date(s.subscribed_at) >= startOfMonth && s.status === "active"
  ).length;

  // Source breakdown
  const footerSignups = subscribers.filter((s) => s.source === "footer").length;
  const registrationSignups = subscribers.filter((s) => s.source === "registration").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading font-black text-xl lg:text-2xl text-gray-900">
          Mailing List
        </h1>
        <p className="text-gray-600 text-sm lg:text-base mt-1">
          Manage newsletter subscribers and mailing list
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
        <StatCard
          title="Total Subscribers"
          value={totalSubscribers}
          icon="Mail"
          iconColor="text-brand-blue"
          iconBgColor="bg-brand-blue/10"
        />
        <StatCard
          title="Active"
          value={activeSubscribers}
          icon="CheckCircle"
          iconColor="text-brand-green"
          iconBgColor="bg-brand-green/10"
        />
        <StatCard
          title="This Month"
          value={thisMonthSubscribers}
          subtitle="New signups"
          icon="TrendingUp"
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
        <StatCard
          title="Unsubscribed"
          value={unsubscribed}
          icon="XCircle"
          iconColor="text-gray-400"
          iconBgColor="bg-gray-100"
        />
        <StatCard
          title="From Footer"
          value={footerSignups}
          subtitle={`${registrationSignups} from registrations`}
          icon="Users"
          iconColor="text-brand-accent"
          iconBgColor="bg-brand-accent/10"
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {/* Subscribers List/Table */}
      <SubscribersView subscribers={subscribers} />
    </div>
  );
}
