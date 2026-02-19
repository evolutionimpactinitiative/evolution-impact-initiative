"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Loader2, CheckCircle, Calendar, Clock, Users } from "lucide-react";
import type { Event } from "@/lib/supabase/types";

interface UpcomingEventsRemindersProps {
  events: Event[];
}

export function UpcomingEventsReminders({ events }: UpcomingEventsRemindersProps) {
  const [sendingFor, setSendingFor] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { sent: number; failed: number } | null>>({});

  const handleSendReminder = async (eventId: string) => {
    setSendingFor(eventId);
    setResults((prev) => ({ ...prev, [eventId]: null }));

    try {
      const response = await fetch("/api/email/send-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });

      const data = await response.json();

      if (response.ok) {
        setResults((prev) => ({
          ...prev,
          [eventId]: { sent: data.sent, failed: data.failed },
        }));
      } else {
        setResults((prev) => ({
          ...prev,
          [eventId]: { sent: 0, failed: -1 },
        }));
      }
    } catch {
      setResults((prev) => ({
        ...prev,
        [eventId]: { sent: 0, failed: -1 },
      }));
    } finally {
      setSendingFor(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const getDaysUntil = (dateStr: string) => {
    const eventDate = new Date(dateStr);
    const now = new Date();
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="divide-y divide-gray-200">
      {events.map((event) => {
        const daysUntil = getDaysUntil(event.date);
        const result = results[event.id];
        const isSending = sendingFor === event.id;

        return (
          <div key={event.id} className="p-4 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">{event.title}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(event.date)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {event.start_time}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {event.total_slots} slots
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  daysUntil === 0
                    ? "bg-red-100 text-red-700"
                    : daysUntil === 1
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {daysUntil === 0
                  ? "Today"
                  : daysUntil === 1
                  ? "Tomorrow"
                  : `In ${daysUntil} days`}
              </span>

              {result ? (
                result.failed === -1 ? (
                  <span className="text-sm text-red-600">Failed to send</span>
                ) : (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    Sent {result.sent} reminder{result.sent !== 1 ? "s" : ""}
                  </span>
                )
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendReminder(event.id)}
                  disabled={isSending}
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4 mr-1" />
                      Send Reminder
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
