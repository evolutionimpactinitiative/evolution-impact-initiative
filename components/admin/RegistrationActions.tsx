"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SendEmailModal } from "./SendEmailModal";
import { ClipboardCheck, Mail, Download, Bell, Loader2, UserCheck } from "lucide-react";

interface RegistrationActionsProps {
  eventId: string;
  eventTitle: string;
  confirmedCount: number;
  waitlistedCount: number;
}

export function RegistrationActions({
  eventId,
  eventTitle,
  confirmedCount,
  waitlistedCount,
}: RegistrationActionsProps) {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderResult, setReminderResult] = useState<string | null>(null);
  const [sendingConfirmation, setSendingConfirmation] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<string | null>(null);

  const handleSendReminder = async () => {
    setSendingReminder(true);
    setReminderResult(null);

    try {
      const response = await fetch("/api/email/send-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });

      const data = await response.json();

      if (response.ok) {
        setReminderResult(`Sent ${data.sent} reminder${data.sent !== 1 ? "s" : ""}`);
      } else {
        setReminderResult("Failed to send");
      }
    } catch {
      setReminderResult("Failed to send");
    } finally {
      setSendingReminder(false);
      setTimeout(() => setReminderResult(null), 3000);
    }
  };

  const handleExportCSV = () => {
    // Create CSV download link
    window.open(`/api/registrations/export?eventId=${eventId}`, "_blank");
  };

  const handleSendAttendanceConfirmation = async () => {
    setSendingConfirmation(true);
    setConfirmationResult(null);

    try {
      const response = await fetch("/api/email/send-attendance-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });

      const data = await response.json();

      if (response.ok) {
        const msg = `Sent ${data.sent}${data.skipped > 0 ? `, ${data.skipped} already confirmed` : ""}`;
        setConfirmationResult(msg);
      } else {
        setConfirmationResult("Failed to send");
      }
    } catch {
      setConfirmationResult("Failed to send");
    } finally {
      setSendingConfirmation(false);
      setTimeout(() => setConfirmationResult(null), 4000);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <Button variant="outline" asChild>
          <Link href={`/admin/events/${eventId}/check-in`}>
            <ClipboardCheck className="w-4 h-4 mr-2" />
            Check-in Mode
          </Link>
        </Button>
        <Button variant="outline" onClick={() => setShowEmailModal(true)}>
          <Mail className="w-4 h-4 mr-2" />
          Send Update
        </Button>
        <Button
          variant="outline"
          onClick={handleSendReminder}
          disabled={sendingReminder || confirmedCount === 0}
        >
          {sendingReminder ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : reminderResult ? (
            reminderResult
          ) : (
            <>
              <Bell className="w-4 h-4 mr-2" />
              Send Reminder
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={handleSendAttendanceConfirmation}
          disabled={sendingConfirmation || confirmedCount === 0}
          title="Send 72-hour attendance confirmation emails"
        >
          {sendingConfirmation ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : confirmationResult ? (
            confirmationResult
          ) : (
            <>
              <UserCheck className="w-4 h-4 mr-2" />
              Confirm Attendance
            </>
          )}
        </Button>
        <Button variant="outline" onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <SendEmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        eventId={eventId}
        eventTitle={eventTitle}
        confirmedCount={confirmedCount}
        waitlistedCount={waitlistedCount}
      />
    </>
  );
}
