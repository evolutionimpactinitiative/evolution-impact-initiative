"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Calendar, MapPin, Clock, Loader2, XCircle } from "lucide-react";

type RegistrationData = {
  id: string;
  status: string;
  parent_name: string;
  parent_email: string;
  events: {
    id: string;
    title: string;
    date: string;
    start_time: string;
    venue_name: string;
  };
  registration_children: {
    child_name: string;
    child_age: number;
  }[];
};

function CancelRegistrationContent() {
  const searchParams = useSearchParams();
  const registrationId = searchParams.get("id");

  const [registration, setRegistration] = useState<RegistrationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!registrationId) {
      setError("No registration ID provided");
      setLoading(false);
      return;
    }

    fetch(`/api/registrations/cancel?id=${registrationId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setRegistration(data.registration);
          if (data.registration.status === "cancelled") {
            setCancelled(true);
          }
        }
      })
      .catch(() => setError("Failed to load registration"))
      .finally(() => setLoading(false));
  }, [registrationId]);

  const handleCancel = async () => {
    if (!registrationId) return;

    setCancelling(true);
    setError(null);

    try {
      const response = await fetch("/api/registrations/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, reason }),
      });

      const data = await response.json();

      if (response.ok) {
        setCancelled(true);
      } else {
        setError(data.error || "Failed to cancel registration");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (error && !registration) {
    return (
      <div className="container mx-auto px-4 max-w-md">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="font-heading font-bold text-xl text-gray-900 mb-2">
            Registration Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            This registration may have already been cancelled, or the link has expired.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            If you believe this is an error, please contact us at{" "}
            <a href="mailto:info@evolutionimpactinitiative.co.uk" className="text-brand-blue hover:underline">
              info@evolutionimpactinitiative.co.uk
            </a>
          </p>
          <div className="flex flex-col gap-3">
            <Button asChild>
              <Link href="/events">Browse Events</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (cancelled) {
    return (
      <div className="container mx-auto px-4 max-w-md">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="font-heading font-bold text-xl text-gray-900 mb-2">
            Registration Cancelled
          </h1>
          <p className="text-gray-600 mb-6">
            Your registration for <strong>{registration?.events.title}</strong> has been cancelled.
            If someone was on the waitlist, they will be notified that a spot has opened up.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Thank you for letting us know. We hope to see you at a future event!
          </p>
          <Button asChild>
            <Link href="/events">Browse Other Events</Link>
          </Button>
        </div>
      </div>
    );
  }

  const eventDate = registration?.events.date
    ? new Date(registration.events.date).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div className="container mx-auto px-4 max-w-lg">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-brand-dark p-6 text-center">
          <div className="w-14 h-14 bg-yellow-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-heading font-bold text-xl text-white">
            Cancel Registration
          </h1>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6 text-center">
            Are you sure you want to cancel your registration for the following event?
          </p>

          {/* Event Details */}
          <div className="bg-brand-pale rounded-lg p-4 mb-6">
            <h2 className="font-heading font-bold text-lg text-brand-dark mb-3">
              {registration?.events.title}
            </h2>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-blue" />
                <span>{eventDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-blue" />
                <span>{registration?.events.start_time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-blue" />
                <span>{registration?.events.venue_name}</span>
              </div>
            </div>
          </div>

          {/* Registered Children */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Registered attendees:</h3>
            <ul className="text-sm text-gray-600">
              {registration?.registration_children.map((child, i) => (
                <li key={i}>• {child.child_name} ({child.child_age} years old)</li>
              ))}
            </ul>
          </div>

          {/* Reason (optional) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for cancellation (optional)
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            >
              <option value="">Select a reason...</option>
              <option value="schedule_conflict">Schedule conflict</option>
              <option value="illness">Illness</option>
              <option value="travel">Travel/transportation issues</option>
              <option value="changed_mind">Changed my mind</option>
              <option value="other">Other</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
            >
              {cancelling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Yes, Cancel My Registration"
              )}
            </Button>
            <Button asChild className="w-full">
              <Link href="/events">No, Keep My Registration</Link>
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            By cancelling, you free up a spot for families on our waiting list.
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="container mx-auto px-4 flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
    </div>
  );
}

export default function CancelRegistrationPage() {
  return (
    <main className="min-h-screen bg-brand-pale pt-24 pb-16">
      <Suspense fallback={<LoadingFallback />}>
        <CancelRegistrationContent />
      </Suspense>
    </main>
  );
}
