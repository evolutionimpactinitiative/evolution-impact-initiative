"use client";

import { useState } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Recipient = {
  id: string;
  email: string;
  name: string | null;
};

interface ComposeEmailModalProps {
  recipient: Recipient;
  onClose: () => void;
}

const EMAIL_TEMPLATES = [
  { id: "custom", name: "Custom Message", subject: "", body: "" },
  {
    id: "welcome",
    name: "Welcome Message",
    subject: "Welcome to Evolution Impact Initiative",
    body: `Hi {name},

Thank you for being part of our community! We're excited to have you with us.

Stay tuned for updates on upcoming events and ways to get involved.

Best wishes,
The Evolution Impact Initiative Team`,
  },
  {
    id: "event_invite",
    name: "Event Invitation",
    subject: "You're Invited to Our Upcoming Event",
    body: `Hi {name},

We have an exciting event coming up and we'd love for you to join us!

[Event details here]

Register now to secure your spot.

Best wishes,
The Evolution Impact Initiative Team`,
  },
  {
    id: "thank_you",
    name: "Thank You",
    subject: "Thank You for Your Support",
    body: `Hi {name},

We wanted to take a moment to thank you for being part of our community.

Your support means the world to us and helps us continue our mission of making a positive impact in Medway.

With gratitude,
The Evolution Impact Initiative Team`,
  },
  {
    id: "newsletter",
    name: "Newsletter Update",
    subject: "Latest News from Evolution Impact Initiative",
    body: `Hi {name},

Here's what's been happening at Evolution Impact Initiative:

[Your update here]

Thank you for staying connected with us!

Best wishes,
The Evolution Impact Initiative Team`,
  },
];

export function ComposeEmailModal({ recipient, onClose }: ComposeEmailModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState("custom");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = EMAIL_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      // Replace {name} placeholder with actual name
      const personalizedBody = template.body.replace(
        /{name}/g,
        recipient.name || "there"
      );
      setBody(personalizedBody);
    }
  };

  const handleSend = async () => {
    if (!subject.trim()) {
      setError("Please enter a subject");
      return;
    }
    if (!body.trim()) {
      setError("Please enter a message");
      return;
    }

    setError("");
    setIsSending(true);

    try {
      const response = await fetch("/api/subscribers/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: recipient.email,
          recipientName: recipient.name,
          subject,
          body,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  if (sent) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Email Sent!</h3>
          <p className="text-gray-600 mb-6">
            Your email has been sent to {recipient.email}
          </p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Compose Email</h3>
            <p className="text-sm text-gray-500">
              To: {recipient.name || recipient.email} &lt;{recipient.email}&gt;
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template
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
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent resize-none"
              placeholder="Write your message here..."
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be formatted in our standard email template with branding.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
