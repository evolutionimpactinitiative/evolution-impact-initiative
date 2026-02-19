"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SendEmailModal } from "./SendEmailModal";
import { AnnounceEventModal } from "./AnnounceEventModal";
import { createClient } from "@/lib/supabase/client";
import { ClipboardCheck, Mail, Download, Bell, Loader2, UserCheck, Megaphone } from "lucide-react";

interface RegistrationActionsProps {
  eventId: string;
  eventTitle: string;
  confirmedCount: number;
  waitlistedCount: number;
}

interface PastEvent {
  id: string;
  title: string;
  date: string;
}

export function RegistrationActions({
  eventId,
  eventTitle,
  confirmedCount,
  waitlistedCount,
}: RegistrationActionsProps) {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [pastEvents, setPastEvents] = useState<PastEvent[]>([]);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderResult, setReminderResult] = useState<string | null>(null);
  const [sendingConfirmation, setSendingConfirmation] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<string | null>(null);

  // Fetch past events for the announce modal
  useEffect(() => {
    const fetchPastEvents = async () => {
      const supabase = createClient();
      const today = new Date().toISOString().split("T")[0];

      const { data } = await supabase
        .from("events")
        .select("id, title, date")
        .eq("status", "published")
        .lt("date", today)
        .neq("id", eventId)
        .order("date", { ascending: false });

      setPastEvents((data as PastEvent[]) || []);
    };

    fetchPastEvents();
  }, [eventId]);

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
        setReminderResult(`Sent ${data.sent}`);
      } else {
        setReminderResult("Failed");
      }
    } catch {
      setReminderResult("Failed");
    } finally {
      setSendingReminder(false);
      setTimeout(() => setReminderResult(null), 3000);
    }
  };

  const handleExportCSV = () => {
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
        setConfirmationResult(`Sent ${data.sent}`);
      } else {
        setConfirmationResult("Failed");
      }
    } catch {
      setConfirmationResult("Failed");
    } finally {
      setSendingConfirmation(false);
      setTimeout(() => setConfirmationResult(null), 4000);
    }
  };

  return (
    <>
      {/* Mobile: Vertical stack */}
      <div className="lg:hidden flex flex-col gap-2 w-full mt-4">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/events/${eventId}/check-in`}>
              <ClipboardCheck className="w-4 h-4 mr-1" />
              Check-in
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowEmailModal(true)}>
            <Mail className="w-4 h-4 mr-1" />
            Email
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendReminder}
            disabled={sendingReminder || confirmedCount === 0}
          >
            {sendingReminder ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : reminderResult ? (
              reminderResult
            ) : (
              <>
                <Bell className="w-4 h-4 mr-1" />
                Reminder
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendAttendanceConfirmation}
            disabled={sendingConfirmation || confirmedCount === 0}
          >
            {sendingConfirmation ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Sending...
              </>
            ) : confirmationResult ? (
              confirmationResult
            ) : (
              <>
                <UserCheck className="w-4 h-4 mr-1" />
                Confirm
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAnnounceModal(true)}
            disabled={pastEvents.length === 0}
          >
            <Megaphone className="w-4 h-4 mr-1" />
            Announce
          </Button>
        </div>
      </div>

      {/* Desktop: Horizontal row with wrap */}
      <div className="hidden lg:flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/events/${eventId}/check-in`}>
            <ClipboardCheck className="w-4 h-4 mr-1" />
            Check-in
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowEmailModal(true)}>
          <Mail className="w-4 h-4 mr-1" />
          Update
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSendReminder}
          disabled={sendingReminder || confirmedCount === 0}
        >
          {sendingReminder ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : reminderResult ? (
            reminderResult
          ) : (
            <>
              <Bell className="w-4 h-4 mr-1" />
              Reminder
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSendAttendanceConfirmation}
          disabled={sendingConfirmation || confirmedCount === 0}
          title="Send 72-hour attendance confirmation emails"
        >
          {sendingConfirmation ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : confirmationResult ? (
            confirmationResult
          ) : (
            <>
              <UserCheck className="w-4 h-4 mr-1" />
              Confirm
            </>
          )}
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-1" />
          Export
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAnnounceModal(true)}
          disabled={pastEvents.length === 0}
          title="Announce this event to past attendees"
        >
          <Megaphone className="w-4 h-4 mr-1" />
          Announce
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

      <AnnounceEventModal
        isOpen={showAnnounceModal}
        onClose={() => setShowAnnounceModal(false)}
        eventId={eventId}
        eventTitle={eventTitle}
        pastEvents={pastEvents}
      />
    </>
  );
}
