"use client";

import { CheckCircle, Clock, XCircle, AlertCircle, Mail } from "lucide-react";

interface EmailCardProps {
  email: {
    id: string;
    type: string;
    recipient_email: string;
    subject: string;
    status: string;
    sent_at: string | null;
    created_at: string;
    error_message?: string | null;
  };
}

export function EmailCard({ email }: EmailCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "failed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatEmailType = (type: string) => {
    const typeMap: Record<string, string> = {
      registration_confirmation: "Registration",
      waitlist_confirmation: "Waitlist",
      waitlist_promotion: "Promotion",
      event_reminder: "Reminder",
      event_update: "Update",
      attendance_confirmation: "Attendance Confirmation",
    };
    return typeMap[type] || type.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "registration_confirmation":
        return "bg-green-100 text-green-700";
      case "waitlist_confirmation":
        return "bg-yellow-100 text-yellow-700";
      case "waitlist_promotion":
        return "bg-blue-100 text-blue-700";
      case "event_reminder":
        return "bg-purple-100 text-purple-700";
      case "event_update":
        return "bg-brand-blue/10 text-brand-blue";
      case "attendance_confirmation":
        return "bg-teal-100 text-teal-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      {/* Header row with icon, subject and status */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          {getStatusIcon(email.status)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-gray-900 truncate text-sm">
              {email.subject}
            </p>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${getStatusBadge(email.status)}`}>
              {email.status}
            </span>
          </div>
          <p className="text-sm text-gray-500 truncate mt-0.5">
            To: {email.recipient_email}
          </p>
        </div>
      </div>

      {/* Footer with type and date */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeColor(email.type)}`}>
          <Mail className="w-3 h-3" />
          {formatEmailType(email.type)}
        </span>
        <span className="text-xs text-gray-500">
          {new Date(email.sent_at || email.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {/* Error message if any */}
      {email.error_message && (
        <div className="mt-3 p-2 bg-red-50 rounded-lg">
          <p className="text-xs text-red-600">{email.error_message}</p>
        </div>
      )}
    </div>
  );
}
