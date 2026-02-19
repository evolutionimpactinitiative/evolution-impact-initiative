import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/admin/StatCard";
import { EmailsView } from "@/components/admin/EmailsView";
import { UpcomingEventsReminders } from "@/components/admin/UpcomingEventsReminders";
import { Bell } from "lucide-react";
import type { Event } from "@/lib/supabase/types";

type EmailLog = {
  id: string;
  registration_id: string | null;
  email_type: string;
  recipient_email: string;
  subject: string;
  sent_at: string;
  status: string;
  resend_id: string | null;
  error_message?: string | null;
};

export default async function EmailsPage() {
  const supabase = await createClient();

  // Get email logs
  const { data: emailsData } = await supabase
    .from("email_logs")
    .select("*")
    .order("sent_at", { ascending: false })
    .limit(100);

  const emails = (emailsData as EmailLog[] | null) || [];

  // Get upcoming events (next 7 days) for reminder management
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const { data: upcomingEventsData } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .gte("date", now.toISOString().split("T")[0])
    .lte("date", in7Days.toISOString().split("T")[0])
    .order("date", { ascending: true });

  const upcomingEvents = (upcomingEventsData as Event[] | null) || [];

  // Calculate stats
  const totalSent = emails.filter((e) => e.status === "sent").length;
  const totalFailed = emails.filter((e) => e.status === "failed").length;
  const totalPending = emails.filter((e) => e.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading font-black text-xl lg:text-2xl text-gray-900">
          Email Log
        </h1>
        <p className="text-gray-600 text-sm lg:text-base mt-1">
          Track all emails sent from the system
        </p>
      </div>

      {/* Stats - 2x2 grid on mobile, 4 cols on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          title="Total"
          value={emails.length}
          icon="Mail"
          iconColor="text-brand-blue"
          iconBgColor="bg-brand-blue/10"
        />
        <StatCard
          title="Sent"
          value={totalSent}
          icon="CheckCircle"
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <StatCard
          title="Pending"
          value={totalPending}
          icon="Clock"
          iconColor="text-yellow-600"
          iconBgColor="bg-yellow-100"
        />
        <StatCard
          title="Failed"
          value={totalFailed}
          icon="XCircle"
          iconColor="text-red-600"
          iconBgColor="bg-red-100"
        />
      </div>

      {/* Upcoming Event Reminders */}
      {upcomingEvents.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-600" />
            <h2 className="font-semibold text-gray-900 text-sm lg:text-base">
              Upcoming Events - Send Reminders
            </h2>
          </div>
          <UpcomingEventsReminders events={upcomingEvents} />
        </div>
      )}

      {/* Email Log */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-4">Recent Emails</h2>
        <EmailsView emails={emails} />
      </div>
    </div>
  );
}
