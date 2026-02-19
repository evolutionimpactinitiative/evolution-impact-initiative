"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Send, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  confirmedCount: number;
  waitlistedCount: number;
}

export function SendEmailModal({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  confirmedCount,
  waitlistedCount,
}: SendEmailModalProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [recipientFilter, setRecipientFilter] = useState<"all" | "confirmed" | "waitlisted">("confirmed");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; sent?: number; failed?: number } | null>(null);

  const getRecipientCount = () => {
    if (recipientFilter === "confirmed") return confirmedCount;
    if (recipientFilter === "waitlisted") return waitlistedCount;
    return confirmedCount + waitlistedCount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/email/send-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          subject,
          message,
          recipientFilter,
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
    setRecipientFilter("confirmed");
    setResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-heading font-bold text-lg text-gray-900">Send Email Update</h2>
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
                <h3 className="font-semibold text-gray-900 mb-2">Emails Sent!</h3>
                <p className="text-gray-600 mb-4">
                  Successfully sent {result.sent} email{result.sent !== 1 ? "s" : ""}.
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
                <p className="text-gray-600 mb-4">
                  Something went wrong. Please try again.
                </p>
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
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-500">Sending update for:</p>
                <p className="font-medium text-gray-900">{eventTitle}</p>
              </div>

              {/* Recipients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Send to
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRecipientFilter("confirmed")}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                      recipientFilter === "confirmed"
                        ? "bg-brand-blue text-white border-brand-blue"
                        : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    Confirmed ({confirmedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipientFilter("waitlisted")}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                      recipientFilter === "waitlisted"
                        ? "bg-brand-blue text-white border-brand-blue"
                        : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    Waitlisted ({waitlistedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipientFilter("all")}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                      recipientFilter === "all"
                        ? "bg-brand-blue text-white border-brand-blue"
                        : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    All ({confirmedCount + waitlistedCount})
                  </button>
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
                  placeholder="e.g., Important Update About Tomorrow's Event"
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
                  placeholder="Write your message here..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent resize-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  The email will include the event details automatically.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-500">
                Sending to {getRecipientCount()} recipient{getRecipientCount() !== 1 ? "s" : ""}
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || getRecipientCount() === 0}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Email
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
