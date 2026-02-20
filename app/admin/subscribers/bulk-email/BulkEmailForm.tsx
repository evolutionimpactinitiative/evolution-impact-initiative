"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, AlertTriangle, CheckCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BulkEmailFormProps {
  subscriberCount: number;
}

const EMAIL_TEMPLATES = [
  { id: "custom", name: "Custom Message", subject: "", body: "" },
  {
    id: "newsletter",
    name: "Newsletter",
    subject: "Latest News from Evolution Impact Initiative",
    body: `Hi there,

Here's what's been happening at Evolution Impact Initiative:

[Your update here]

Thank you for being part of our community!

Best wishes,
The Evolution Impact Initiative Team`,
  },
  {
    id: "event_announcement",
    name: "Event Announcement",
    subject: "Exciting Event Coming Up!",
    body: `Hi there,

We're thrilled to announce an upcoming event that we'd love for you to attend!

[Event details here]

Spaces are limited, so register early to secure your spot.

Best wishes,
The Evolution Impact Initiative Team`,
  },
  {
    id: "community_update",
    name: "Community Update",
    subject: "Community Update - Evolution Impact Initiative",
    body: `Hi there,

We wanted to share some exciting updates from our community:

[Your update here]

Thank you for your continued support. Together, we're making a difference in Medway.

Best wishes,
The Evolution Impact Initiative Team`,
  },
  {
    id: "volunteer_call",
    name: "Volunteer Call",
    subject: "We Need Your Help!",
    body: `Hi there,

We have some exciting volunteering opportunities coming up and we'd love your help!

[Details here]

No experience necessary - just bring your enthusiasm and willingness to make a difference.

If you're interested, please reply to this email or visit our website.

Best wishes,
The Evolution Impact Initiative Team`,
  },
];

export function BulkEmailForm({ subscriberCount }: BulkEmailFormProps) {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState("custom");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    sent?: number;
    failed?: number;
    message?: string;
  } | null>(null);
  const [error, setError] = useState("");

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = EMAIL_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
    }
  };

  const handlePreSend = () => {
    if (!subject.trim()) {
      setError("Please enter a subject");
      return;
    }
    if (!body.trim()) {
      setError("Please enter a message");
      return;
    }
    setError("");
    setShowConfirm(true);
  };

  const handleSend = async () => {
    setShowConfirm(false);
    setIsSending(true);
    setError("");

    try {
      const response = await fetch("/api/subscribers/send-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send emails");
      }

      setResult({
        success: true,
        sent: data.sent,
        failed: data.failed,
        message: data.message,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send emails");
    } finally {
      setIsSending(false);
    }
  };

  if (result?.success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Emails Sent!</h2>
          <p className="text-gray-600 mb-6">{result.message}</p>
          <div className="flex justify-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{result.sent}</p>
              <p className="text-sm text-gray-500">Sent</p>
            </div>
            {(result.failed ?? 0) > 0 && (
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{result.failed}</p>
                <p className="text-sm text-gray-500">Failed</p>
              </div>
            )}
          </div>
          <Button onClick={() => router.push("/admin/subscribers")} className="mt-6">
            Back to Subscribers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Recipient Info */}
        <div className="flex items-center gap-3 p-4 bg-brand-pale/30 rounded-lg">
          <Users className="h-5 w-5 text-brand-blue" />
          <div>
            <p className="font-medium text-gray-900">
              Sending to {subscriberCount} active subscriber{subscriberCount !== 1 ? "s" : ""}
            </p>
            <p className="text-sm text-gray-500">
              All subscribers with "active" status will receive this email
            </p>
          </div>
        </div>

        {/* Template Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Template
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
          >
            {EMAIL_TEMPLATES.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject <span className="text-red-500">*</span>
          </label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter email subject..."
          />
        </div>

        {/* Body */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={14}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent resize-none"
            placeholder="Write your message here..."
          />
          <p className="text-xs text-gray-500 mt-1">
            This will be formatted in our standard email template with branding and unsubscribe link.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/subscribers")}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button onClick={handlePreSend} disabled={isSending || subscriberCount === 0}>
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send to All Subscribers
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Confirm Bulk Email
                </h3>
                <p className="text-gray-600 mb-4">
                  You are about to send an email to <strong>{subscriberCount} subscribers</strong>.
                  This action cannot be undone.
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Subject: <strong>{subject}</strong>
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <Button variant="outline" onClick={() => setShowConfirm(false)}>
                Cancel
              </Button>
              <Button onClick={handleSend}>
                Yes, Send Emails
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
