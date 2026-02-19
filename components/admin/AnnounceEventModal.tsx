"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Send, Loader2, CheckCircle, AlertCircle, Check, ChevronDown, ChevronUp, Users } from "lucide-react";

interface PastEvent {
  id: string;
  title: string;
  date: string;
}

interface Recipient {
  name: string;
  email: string;
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
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [excludedEmails, setExcludedEmails] = useState<Set<string>>(new Set());
  const [showRecipients, setShowRecipients] = useState(false);
  const [isLoadingCount, setIsLoadingCount] = useState(false);

  // Filter out excluded recipients
  const activeRecipients = recipients.filter(
    (r) => !excludedEmails.has(r.email.toLowerCase())
  );
  const activeCount = activeRecipients.length;
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; sent?: number; failed?: number } | null>(null);

  // Set default subject when modal opens
  useEffect(() => {
    if (isOpen && !subject) {
      setSubject(`New Event: ${eventTitle}`);
    }
  }, [isOpen, eventTitle, subject]);

  // Fetch recipients when selection changes
  useEffect(() => {
    const fetchRecipients = async () => {
      if (selectedEventIds.size === 0) {
        setRecipientCount(0);
        setRecipients([]);
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
        setRecipients(data.recipients || []);
      } catch {
        setRecipientCount(0);
        setRecipients([]);
      } finally {
        setIsLoadingCount(false);
      }
    };

    fetchRecipients();
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
          excludedEmails: Array.from(excludedEmails),
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
    setRecipients([]);
    setExcludedEmails(new Set());
    setShowRecipients(false);
    setResult(null);
    onClose();
  };

  const removeRecipient = (email: string) => {
    setExcludedEmails((prev) => new Set([...prev, email.toLowerCase()]));
  };

  const restoreAllRecipients = () => {
    setExcludedEmails(new Set());
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

                {/* Recipients section */}
                <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowRecipients(!showRecipients)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Recipients:</span>
                      {isLoadingCount ? (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      ) : (
                        <span className="text-sm font-semibold text-brand-blue">
                          {activeCount} {activeCount === 1 ? "family" : "families"}
                        </span>
                      )}
                      {excludedEmails.size > 0 && (
                        <span className="text-xs text-orange-600">
                          ({excludedEmails.size} removed)
                        </span>
                      )}
                    </div>
                    {recipientCount > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <span>{showRecipients ? "Hide" : "View"}</span>
                        {showRecipients ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    )}
                  </button>

                  {/* Recipients list */}
                  {showRecipients && recipients.length > 0 && (
                    <div className="border-t border-gray-200">
                      {excludedEmails.size > 0 && (
                        <div className="flex items-center justify-between px-3 py-2 bg-orange-50 border-b border-orange-100">
                          <span className="text-xs text-orange-700">
                            {excludedEmails.size} recipient{excludedEmails.size !== 1 ? "s" : ""} removed
                          </span>
                          <button
                            type="button"
                            onClick={restoreAllRecipients}
                            className="text-xs text-orange-600 hover:text-orange-800 font-medium"
                          >
                            Restore all
                          </button>
                        </div>
                      )}
                      <div className="max-h-48 overflow-y-auto">
                        {activeRecipients.map((recipient, index) => (
                          <div
                            key={recipient.email}
                            className={`flex items-center justify-between px-3 py-2 text-sm group ${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }`}
                          >
                            <div className="flex-1 min-w-0 mr-2">
                              <span className="font-medium text-gray-900 truncate block">
                                {recipient.name}
                              </span>
                              <span className="text-gray-500 text-xs truncate block">
                                {recipient.email}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeRecipient(recipient.email)}
                              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                              title="Remove from list"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                  disabled={isLoading || activeCount === 0 || selectedEventIds.size === 0}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send to {activeCount}
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
