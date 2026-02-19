import { createClient } from "@/lib/supabase/server";
import { Heart, TrendingUp, Users, Calendar, Gift } from "lucide-react";

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
  const supabase = await createClient();

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
        <h1 className="font-heading font-black text-2xl md:text-3xl text-gray-900">Donations</h1>
        <p className="text-gray-600 mt-1">Track donations and manage Gift Aid</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-brand-green/10 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-brand-green" />
            </div>
            <span className="text-sm text-gray-500">Total Raised</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">£{totalDonations.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-brand-blue/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-brand-blue" />
            </div>
            <span className="text-sm text-gray-500">This Month</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">£{thisMonthTotal.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Monthly Recurring</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">£{monthlyRecurring.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-brand-accent/10 rounded-lg flex items-center justify-center">
              <Gift className="w-5 h-5 text-brand-accent" />
            </div>
            <span className="text-sm text-gray-500">Gift Aid Value</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">£{giftAidTotal.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-sm text-gray-500">Total Donors</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{donorCount}</p>
        </div>
      </div>

      {/* Active Subscriptions */}
      {subscriptions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Active Monthly Donors</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Donor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gift Aid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {sub.donors?.name || "Anonymous"}
                      </div>
                      <div className="text-sm text-gray-500">{sub.donors?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      £{sub.amount.toFixed(2)}/month
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {sub.gift_aid_claimed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                          <Gift className="w-3 h-3" />
                          Claimed
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(sub.start_date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Donations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Recent Donations</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Donor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gift Aid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {donations.length > 0 ? (
                donations.map((donation) => (
                  <tr key={donation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(donation.donation_date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {donation.donors?.name || "Anonymous"}
                      </div>
                      {donation.donors?.email && (
                        <div className="text-sm text-gray-500">{donation.donors.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      £{donation.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {donation.payment_method === "card" ? "Card" : donation.payment_method}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {donation.gift_aid_claimed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                          <Gift className="w-3 h-3" />
                          +£{(donation.amount * 0.25).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                          donation.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : donation.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No donations yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
