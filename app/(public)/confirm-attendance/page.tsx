"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Calendar, MapPin, Clock, Loader2, AlertTriangle } from "lucide-react";

type RegistrationData = {
  id: string;
  status: string;
  parent_name: string;
  parent_email: string;
  attendance_confirmed: boolean | null;
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

function ConfirmAttendanceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const registrationId = searchParams.get("id");
  const attendingParam = searchParams.get("attending");

  const [registration, setRegistration] = useState<RegistrationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<"confirmed" | "cancelled" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!registrationId) {
      setError("No registration ID provided");
      setLoading(false);
      return;
    }

    fetch(`/api/registrations/confirm-attendance?id=${registrationId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setRegistration(data.registration);

          // If attending param is provided, auto-process
          if (attendingParam === "yes" || attendingParam === "no") {
            handleConfirmation(attendingParam as "yes" | "no", data.registration);
          }
        }
      })
      .catch(() => setError("Failed to load registration"))
      .finally(() => setLoading(false));
  }, [registrationId, attendingParam]);

  const handleConfirmation = async (attending: "yes" | "no", reg?: RegistrationData) => {
    const currentReg = reg || registration;
    if (!registrationId || !currentReg) return;

    // Check if already cancelled
    if (currentReg.status === "cancelled") {
      setError("This registration has already been cancelled");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/registrations/confirm-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, attending }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(attending === "yes" ? "confirmed" : "cancelled");
      } else {
        setError(data.error || "Failed to process confirmation");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading || processing) {
    return (
      <div className="container mx-auto px-4 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue mx-auto mb-4" />
          <p className="text-gray-600">
            {processing ? "Processing your response..." : "Loading..."}
          </p>
        </div>
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

  if (result === "confirmed") {
    return (
      <div className="container mx-auto px-4 max-w-md">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="font-heading font-bold text-xl text-gray-900 mb-2">
            See You There!
          </h1>
          <p className="text-gray-600 mb-6">
            Thanks for confirming your attendance for <strong>{registration?.events.title}</strong>. We're looking forward to seeing you!
          </p>
          <p className="text-sm text-gray-500 mb-6">
            We'll send you a final reminder the day before the event.
          </p>
          <Button asChild>
            <Link href="/events">Browse Other Events</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (result === "cancelled") {
    return (
      <div className="container mx-auto px-4 max-w-md">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-gray-600" />
          </div>
          <h1 className="font-heading font-bold text-xl text-gray-900 mb-2">
            Registration Cancelled
          </h1>
          <p className="text-gray-600 mb-6">
            Your registration for <strong>{registration?.events.title}</strong> has been cancelled. If someone was on the waitlist, they will be notified.
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

  // Already confirmed attendance
  if (registration?.attendance_confirmed) {
    return (
      <div className="container mx-auto px-4 max-w-md">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="font-heading font-bold text-xl text-gray-900 mb-2">
            Already Confirmed
          </h1>
          <p className="text-gray-600 mb-6">
            You've already confirmed your attendance for <strong>{registration?.events.title}</strong>. See you there!
          </p>
          <Button asChild>
            <Link href="/events">Browse Other Events</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Already cancelled
  if (registration?.status === "cancelled") {
    return (
      <div className="container mx-auto px-4 max-w-md">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-gray-600" />
          </div>
          <h1 className="font-heading font-bold text-xl text-gray-900 mb-2">
            Registration Cancelled
          </h1>
          <p className="text-gray-600 mb-6">
            This registration for <strong>{registration?.events.title}</strong> has already been cancelled.
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

  // Show confirmation options
  return (
    <div className="container mx-auto px-4 max-w-lg">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-brand-blue p-6 text-center">
          <div className="w-14 h-14 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-brand-blue" />
          </div>
          <h1 className="font-heading font-bold text-xl text-white">
            Confirm Your Attendance
          </h1>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6 text-center">
            Hi <strong>{registration?.parent_name}</strong>, the event is coming up in 3 days! Please confirm if you're still attending.
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

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => handleConfirmation("yes")}
              disabled={processing}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Yes, I'm Coming
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleConfirmation("no")}
              disabled={processing}
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
            >
              <XCircle className="w-4 h-4 mr-2" />
              No, Cancel
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            If you can't make it, cancelling frees up a spot for families on our waiting list.
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

export default function ConfirmAttendancePage() {
  return (
    <main className="min-h-screen bg-brand-pale pt-24 pb-16">
      <Suspense fallback={<LoadingFallback />}>
        <ConfirmAttendanceContent />
      </Suspense>
    </main>
  );
}
