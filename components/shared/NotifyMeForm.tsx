"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Check, Mail } from "lucide-react";

interface NotifyMeFormProps {
  eventId: string;
  eventTitle: string;
}

export function NotifyMeForm({ eventId, eventTitle }: NotifyMeFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [subscribeToNewsletter, setSubscribeToNewsletter] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/notifications/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          email: email.trim().toLowerCase(),
          name: name.trim() || null,
          subscribeToNewsletter,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to sign up for notifications");
      }

      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-4" id="notify-form">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-green/10 rounded-full mb-3">
          <Check className="w-6 h-6 text-brand-green" />
        </div>
        <p className="font-heading font-bold text-brand-dark mb-1">You&apos;re on the list!</p>
        <p className="text-sm text-brand-dark/70">
          We&apos;ll email you at <strong>{email}</strong> when registration opens for {eventTitle}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" id="notify-form">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="notify-email" className="block text-sm font-medium text-brand-dark/80 mb-1">
          Email Address <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-dark/40" />
          <input
            type="email"
            id="notify-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            placeholder="your@email.com"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="notify-name" className="block text-sm font-medium text-brand-dark/80 mb-1">
          Your Name <span className="text-brand-dark/40">(optional)</span>
        </label>
        <input
          type="text"
          id="notify-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
          placeholder="Your name"
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={subscribeToNewsletter}
          onChange={(e) => setSubscribeToNewsletter(e.target.checked)}
          className="w-4 h-4 mt-0.5 text-brand-blue rounded focus:ring-brand-blue"
        />
        <span className="text-sm text-brand-dark/70">
          Also subscribe me to the Evolution Impact Initiative newsletter for updates on other events and activities
        </span>
      </label>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Signing up...
          </>
        ) : (
          "Notify Me When Registration Opens"
        )}
      </Button>
    </form>
  );
}
