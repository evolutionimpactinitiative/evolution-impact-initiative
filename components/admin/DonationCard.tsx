"use client";

import {
  DataCard,
  DataCardHeader,
  DataCardContent,
  DataCardRow,
  DataCardBadge,
} from "@/components/admin/DataCard";
import { Heart, Mail, Calendar, Gift, RefreshCw } from "lucide-react";

interface DonationCardProps {
  donation: {
    id: string;
    donor_name: string | null;
    donor_email: string;
    amount: number;
    type: "one_time" | "monthly";
    gift_aid: boolean;
    status: string;
    created_at: string;
  };
}

export function DonationCard({ donation }: DonationCardProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "pending":
        return "warning";
      case "failed":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <DataCard>
      <DataCardHeader>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <Heart className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">
              {donation.donor_name || "Anonymous"}
            </p>
            <p className="text-sm text-gray-500 truncate">
              {donation.donor_email}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg text-gray-900">
            £{(donation.amount / 100).toFixed(2)}
          </p>
          <DataCardBadge variant={getStatusVariant(donation.status)}>
            {donation.status}
          </DataCardBadge>
        </div>
      </DataCardHeader>

      <DataCardContent>
        <DataCardRow
          label="Type"
          value={
            <span className="flex items-center gap-1">
              {donation.type === "monthly" ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-purple-500" />
                  Monthly
                </>
              ) : (
                <>
                  <Heart className="w-3.5 h-3.5 text-red-500" />
                  One-time
                </>
              )}
            </span>
          }
        />
        <DataCardRow
          label="Gift Aid"
          value={
            donation.gift_aid ? (
              <span className="flex items-center gap-1 text-green-600">
                <Gift className="w-3.5 h-3.5" />
                Yes (+25%)
              </span>
            ) : (
              "No"
            )
          }
        />
        <DataCardRow
          label="Date"
          value={
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(donation.created_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          }
        />
      </DataCardContent>
    </DataCard>
  );
}

interface SubscriptionCardProps {
  subscription: {
    id: string;
    donor_name: string | null;
    donor_email: string;
    amount: number;
    gift_aid: boolean;
    status: string;
    current_period_start: string;
  };
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "cancelled":
        return "error";
      case "past_due":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <DataCard>
      <DataCardHeader>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <RefreshCw className="w-5 h-5 text-purple-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">
              {subscription.donor_name || "Anonymous"}
            </p>
            <p className="text-sm text-gray-500 truncate">
              {subscription.donor_email}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg text-gray-900">
            £{(subscription.amount / 100).toFixed(2)}/mo
          </p>
          <DataCardBadge variant={getStatusVariant(subscription.status)}>
            {subscription.status}
          </DataCardBadge>
        </div>
      </DataCardHeader>

      <DataCardContent>
        <DataCardRow
          label="Gift Aid"
          value={
            subscription.gift_aid ? (
              <span className="flex items-center gap-1 text-green-600">
                <Gift className="w-3.5 h-3.5" />
                Yes (+25%)
              </span>
            ) : (
              "No"
            )
          }
        />
        <DataCardRow
          label="Started"
          value={new Date(subscription.current_period_start).toLocaleDateString(
            "en-GB",
            {
              day: "numeric",
              month: "short",
              year: "numeric",
            }
          )}
        />
      </DataCardContent>
    </DataCard>
  );
}
