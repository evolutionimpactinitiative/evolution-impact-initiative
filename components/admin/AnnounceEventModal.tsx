"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Send, Loader2, CheckCircle, AlertCircle, Check } from "lucide-react";

interface PastEvent {
  id: string;
  title: string;
  date: string;
}

interface AnnounceEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  pastEvents: PastEvent[];
}

export function AnnounceEventModal({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  pastEvents,
}: AnnounceEventModalProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [recipientCount, setRecipientCount] = useState(0);
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; sent?: number; failed?: number } | null>(null);

  // Set default subject when modal opens
  useEffect(() => {
    if (isOpen && !subject) {
      setSubject(`New Event: ${eventTitle}`);
    }
  }, [isOpen, eventTitle, subject]);

  // Fetch recipient count when selection changes
  useEffect(() => {
    const fetchCount = async () => {
      if (selectedEventIds.size === 0) {
        setRecipientCount(0);
        return;
      }

      setIsLoadingCount(true);
      try {
        const ids = Array.from(selectedEventIds).join(",");
        const response = await fetch(
          `/api/email/send-announcement?eventId=${eventId}&sourceEventIds=${ids}`
        );
        const data = await response.json();
        setRecipientCount(data.count || 0);
      } catch {
        setRecipientCount(0);
      } finally {
        setIsLoadingCount(false);
      }
    };

    fetchCount();
  }, [selectedEventIds, eventId]);

  const toggleEvent = (id: string) => {
    setSelectedEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedEventIds(new Set(pastEvents.map((e) => e.id)));
  };

  const deselectAll = () => {
    setSelectedEventIds(new Set());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/email/send-announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          sourceEventIds: Array.from(selectedEventIds),
          subject,
          message,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, sent: data.sent, failed: data.failed });
      } else {
        setResult({ success: false });
      }
    } catch {
      setResult({ success: false });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSubject("");
    setMessage("");
    setSelectedEventIds(new Set());
    setResult(null);
    onClose();
  };

  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-heading font-bold text-lg text-gray-900">
            Announce to Past Attendees
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {result ? (
          /* Result Screen */
          <div className="p-6 text-center">
            {result.success ? (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Announcement Sent!</h3>
                <p className="text-gray-600 mb-4">
                  Successfully sent to {result.sent} {result.sent === 1 ? "family" : "families"}.
                  {result.failed ? ` (${result.failed} failed)` : ""}
                </p>
                <Button onClick={handleClose}>Done</Button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Failed to Send</h3>
                <p className="text-gray-600 mb-4">Something went wrong. Please try again.</p>
                <Button onClick={() => setResult(null)} variant="outline">
                  Try Again
                </Button>
              </>
            )}
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit}>
            <div className="p-4 space-y-4">
              {/* Event info */}
              <div className="bg-brand-pale/50 rounded-lg p-3">
                <p className="text-sm text-gray-500">Announcing:</p>
                <p className="font-medium text-gray-900">{eventTitle}</p>
              </div>

              {/* Past events selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Select past events to notify
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-xs text-brand-blue hover:underline"
                    >
                      Select all
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={deselectAll}
                      className="text-xs text-gray-500 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {pastEvents.length > 0 ? (
                  <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                    {pastEvents.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => toggleEvent(event.id)}
                        className={`w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                          selectedEventIds.has(event.id) ? "bg-brand-pale/30" : ""
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            selectedEventIds.has(event.id)
                              ? "bg-brand-blue border-brand-blue"
                              : "border-gray-300"
                          }`}
                        >
                          {selectedEventIds.has(event.id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{event.title}</p>
                          <p className="text-xs text-gray-500">{formatDate(event.date)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-4 text-center text-gray-500">
                    No past events found
                  </div>
                )}

                {/* Recipient count */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-gray-600">Recipients:</span>
                  {isLoadingCount ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  ) : (
                    <span className="text-sm font-semibold text-brand-blue">
                      {recipientCount} {recipientCount === 1 ? "family" : "families"}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">(deduplicated)</span>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., New Event: Easter Craft Workshop"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="We're excited to invite you to our upcoming event! Based on your previous attendance, we thought you'd love this..."
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent resize-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use <code className="bg-gray-100 px-1 rounded">{"{{name}}"}</code> to personalize.
                  Event details will be included automatically.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-500">
                {selectedEventIds.size} event{selectedEventIds.size !== 1 ? "s" : ""} selected
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || recipientCount === 0 || selectedEventIds.size === 0}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send to {recipientCount}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
