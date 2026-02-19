import { createClient } from "@/lib/supabase/server";
import { Mail, CheckCircle, XCircle, Clock, Bell } from "lucide-react";
import { UpcomingEventsReminders } from "@/components/admin/UpcomingEventsReminders";
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

  const getEmailTypeBadge = (type: string) => {
    switch (type) {
      case "registration_confirmation":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            Registration
          </span>
        );
      case "waitlist_confirmation":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
            Waitlist
          </span>
        );
      case "waitlist_promotion":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
            Promotion
          </span>
        );
      case "event_reminder":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
            Reminder
          </span>
        );
      case "event_update":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-brand-blue/10 text-brand-blue rounded-full">
            Update
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
            {type}
          </span>
        );
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading font-black text-2xl md:text-3xl text-gray-900">Email Log</h1>
        <p className="text-gray-600 mt-1">Track all emails sent from the system</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-brand-blue/10 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-brand-blue" />
            </div>
            <span className="text-sm text-gray-500">Total Emails</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{emails.length}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Sent</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{totalSent}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <span className="text-sm text-gray-500">Pending</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{totalPending}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-sm text-gray-500">Failed</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{totalFailed}</p>
        </div>
      </div>

      {/* Upcoming Event Reminders */}
      {upcomingEvents.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-600" />
            <h2 className="font-semibold text-gray-900">Upcoming Events - Send Reminders</h2>
          </div>
          <UpcomingEventsReminders events={upcomingEvents} />
        </div>
      )}

      {/* Email Log Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sent At
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {emails.length > 0 ? (
                emails.map((email) => (
                  <tr key={email.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(email.status)}
                        <span className="text-sm capitalize">{email.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getEmailTypeBadge(email.email_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{email.recipient_email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700 truncate block max-w-xs">
                        {email.subject}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(email.sent_at).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="font-medium text-gray-900 mb-1">No emails sent yet</p>
                    <p className="text-sm">
                      Email logs will appear here when registration confirmations and reminders are
                      sent
                    </p>
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
