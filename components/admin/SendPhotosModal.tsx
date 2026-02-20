"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, X, CheckCircle, AlertCircle } from "lucide-react";
import type { Event } from "@/lib/supabase/types";

interface SendPhotosModalProps {
  event: Event;
  attendeeCount: number;
  isOpen: boolean;
  onClose: () => void;
}

export function SendPhotosModal({
  event,
  attendeeCount,
  isOpen,
  onClose,
}: SendPhotosModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    sent?: number;
    failed?: number;
  } | null>(null);

  const handleSend = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/email/send-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send photos email");
      }

      setResult({
        success: true,
        message: data.message,
        sent: data.sent,
        failed: data.failed,
      });
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-brand-green/10">
            <Camera className="h-6 w-6 text-brand-green" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-lg text-gray-900">
              Send Event Photos
            </h2>
            <p className="text-sm text-gray-500">{event.title}</p>
          </div>
        </div>

        {/* Content */}
        {result ? (
          <div className="py-4">
            <div className={`flex items-start gap-3 p-4 rounded-lg ${
              result.success ? "bg-green-50" : "bg-red-50"
            }`}>
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`font-medium ${
                  result.success ? "text-green-800" : "text-red-800"
                }`}>
                  {result.success ? "Emails Sent!" : "Failed to Send"}
                </p>
                <p className={`text-sm mt-1 ${
                  result.success ? "text-green-700" : "text-red-700"
                }`}>
                  {result.message}
                </p>
                {result.failed && result.failed > 0 && (
                  <p className="text-sm text-orange-600 mt-1">
                    {result.failed} email(s) failed to send
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="py-4">
              <p className="text-gray-600 mb-4">
                This will send an email with the photo album link to all attendees
                of this event.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Recipients:</span>
                  <span className="font-medium text-gray-900">{attendeeCount} attendees</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Photo URL:</span>
                  <span className="font-medium text-gray-900 truncate max-w-[200px]">
                    {event.photo_album_url ? "Set" : "Not set"}
                  </span>
                </div>
              </div>

              {!event.photo_album_url && (
                <p className="text-sm text-amber-600 mt-3">
                  Please add a photo album URL to the event before sending.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={isLoading || !event.photo_album_url || attendeeCount === 0}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Send Photos Email
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
