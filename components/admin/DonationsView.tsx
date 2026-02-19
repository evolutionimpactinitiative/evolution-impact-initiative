"use client";

import { useState } from "react";
import { Heart, Gift } from "lucide-react";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { ViewToggle } from "@/components/admin/ViewToggle";
import { DonationCard, SubscriptionCard } from "@/components/admin/DonationCard";

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

interface DonationsViewProps {
  donations: Donation[];
  subscriptions: Subscription[];
}

export function DonationsView({ donations, subscriptions }: DonationsViewProps) {
  const isMobile = useIsMobile();
  const [view, setView] = useState<"cards" | "table">(isMobile ? "cards" : "table");

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex justify-end">
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {/* Active Subscriptions */}
      {subscriptions.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900">Active Monthly Donors</h2>

          {view === "cards" ? (
            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <SubscriptionCard
                  key={sub.id}
                  subscription={{
                    id: sub.id,
                    donor_name: sub.donors?.name || null,
                    donor_email: sub.donors?.email || "",
                    amount: sub.amount * 100, // Convert to pence for component
                    gift_aid: sub.gift_aid_claimed,
                    status: sub.status,
                    current_period_start: sub.start_date,
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Donor
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gift Aid
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Started
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {subscriptions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-50">
                        <td className="px-4 lg:px-6 py-4">
                          <div className="font-medium text-gray-900 truncate max-w-[150px]">
                            {sub.donors?.name || "Anonymous"}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-[150px]">
                            {sub.donors?.email}
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 font-medium text-gray-900">
                          £{sub.amount.toFixed(2)}/mo
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          {sub.gift_aid_claimed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                              <Gift className="w-3 h-3" />
                              +25%
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-sm text-gray-500">
                          {new Date(sub.start_date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 lg:px-6 py-4">
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
        </div>
      )}

      {/* Recent Donations */}
      <div className="space-y-4">
        <h2 className="font-semibold text-gray-900">Recent Donations</h2>

        {donations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="font-medium text-gray-900 mb-1">No donations yet</p>
            <p className="text-sm text-gray-500">
              Donations will appear here when people contribute
            </p>
          </div>
        ) : view === "cards" ? (
          <div className="space-y-3">
            {donations.map((donation) => (
              <DonationCard
                key={donation.id}
                donation={{
                  id: donation.id,
                  donor_name: donation.donors?.name || null,
                  donor_email: donation.donors?.email || "",
                  amount: donation.amount * 100, // Convert to pence for component
                  type: "one_time",
                  gift_aid: donation.gift_aid_claimed,
                  status: donation.status,
                  created_at: donation.donation_date,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Donor
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gift Aid
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {donations.map((donation) => (
                    <tr key={donation.id} className="hover:bg-gray-50">
                      <td className="px-4 lg:px-6 py-4 text-sm text-gray-500">
                        {new Date(donation.donation_date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="font-medium text-gray-900 truncate max-w-[150px]">
                          {donation.donors?.name || "Anonymous"}
                        </div>
                        {donation.donors?.email && (
                          <div className="text-sm text-gray-500 truncate max-w-[150px]">
                            {donation.donors.email}
                          </div>
                        )}
                      </td>
                      <td className="px-4 lg:px-6 py-4 font-medium text-gray-900">
                        £{donation.amount.toFixed(2)}
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-sm text-gray-500">
                        {donation.payment_method === "card" ? "Card" : donation.payment_method}
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        {donation.gift_aid_claimed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                            <Gift className="w-3 h-3" />
                            +£{(donation.amount * 0.25).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 lg:px-6 py-4">
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
