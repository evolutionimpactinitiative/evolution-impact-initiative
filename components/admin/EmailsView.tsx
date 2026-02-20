"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { ViewToggle } from "@/components/admin/ViewToggle";
import { EmailCard } from "@/components/admin/EmailCard";

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

interface EmailsViewProps {
  emails: EmailLog[];
}

function getEmailTypeBadge(type: string) {
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
    case "individual":
      return (
        <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
          Individual
        </span>
      );
    case "bulk":
      return (
        <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
          Bulk
        </span>
      );
    case "welcome":
      return (
        <span className="px-2 py-1 text-xs font-medium bg-teal-100 text-teal-700 rounded-full">
          Welcome
        </span>
      );
    default:
      return (
        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
          {type}
        </span>
      );
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "sent":
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
          Sent
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
          Failed
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
          Pending
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
          {status}
        </span>
      );
  }
}

export function EmailsView({ emails }: EmailsViewProps) {
  const isMobile = useIsMobile();
  const [view, setView] = useState<"cards" | "table">(isMobile ? "cards" : "table");

  if (emails.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="font-medium text-gray-900 mb-1">No emails sent yet</p>
        <p className="text-sm text-gray-500">
          Email logs will appear here when registration confirmations and reminders are sent
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex justify-end">
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {/* Card View */}
      {view === "cards" && (
        <div className="space-y-3">
          {emails.map((email) => (
            <EmailCard
              key={email.id}
              email={{
                id: email.id,
                type: email.email_type,
                recipient_email: email.recipient_email,
                subject: email.subject,
                status: email.status,
                sent_at: email.sent_at,
                created_at: email.sent_at,
                error_message: email.error_message,
              }}
            />
          ))}
        </div>
      )}

      {/* Table View */}
      {view === "table" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent At
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {emails.map((email) => (
                  <tr key={email.id} className="hover:bg-gray-50">
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      {getEmailTypeBadge(email.email_type)}
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <span className="text-sm text-gray-900 truncate block max-w-[150px]">
                        {email.recipient_email}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <span className="text-sm text-gray-700 truncate block max-w-[200px]">
                        {email.subject}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(email.status)}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(email.sent_at).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
