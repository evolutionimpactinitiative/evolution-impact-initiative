"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Trash2, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Event } from "@/lib/supabase/types";

interface Props {
  event: Event;
}

interface ChildField {
  firstName: string;
  dateOfBirth: string;
}

function ageAtDate(dob: string, date: Date): number {
  const b = new Date(dob);
  if (Number.isNaN(b.getTime())) return -1;
  let years = date.getFullYear() - b.getFullYear();
  if (
    date.getMonth() < b.getMonth() ||
    (date.getMonth() === b.getMonth() && date.getDate() < b.getDate())
  ) {
    years -= 1;
  }
  return years;
}

export function PublicGTRegisterForm({ event }: Props) {
  const sessionDate = useMemo(() => new Date(event.date), [event.date]);

  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [postcode, setPostcode] = useState("");
  const [relationship, setRelationship] = useState("");
  const [howHeard, setHowHeard] = useState("");
  const [children, setChildren] = useState<ChildField[]>([
    { firstName: "", dateOfBirth: "" },
  ]);
  const [accessibilityNote, setAccessibilityNote] = useState("");
  const [photoConsent, setPhotoConsent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    status: "confirmed" | "waitlisted";
    claimToken: string;
  } | null>(null);

  const updateChild = (i: number, patch: Partial<ChildField>) => {
    setChildren((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  };
  const addChild = () =>
    setChildren((prev) => [...prev, { firstName: "", dateOfBirth: "" }]);
  const removeChild = (i: number) =>
    setChildren((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleaned = children
      .map((c) => ({
        firstName: c.firstName.trim(),
        dateOfBirth: c.dateOfBirth,
      }))
      .filter((c) => c.firstName && c.dateOfBirth);

    if (cleaned.length === 0) {
      setError("Please add at least one child.");
      return;
    }

    const anyTooOld = cleaned.find(
      (c) => ageAtDate(c.dateOfBirth, sessionDate) > 5,
    );
    if (anyTooOld) {
      setError(
        `Growing Together is for children aged 0–5. ${anyTooOld.firstName} would be older than 5 on the session date.`,
      );
      return;
    }

    setLoading(true);
    const res = await fetch("/api/public/gt-register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: event.id,
        parentName,
        parentEmail,
        parentPhone: parentPhone || undefined,
        postcode: postcode || undefined,
        relationshipToChild: relationship || undefined,
        howHeardAboutGt: howHeard || undefined,
        children: cleaned,
        accessibilityNote: accessibilityNote || undefined,
        photoVideoConsent: photoConsent,
        termsAccepted,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong. Please try again.");
      return;
    }

    setSuccess({ status: data.status, claimToken: data.claimToken });
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl border border-brand-green/40 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-brand-green/20 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-brand-green" />
          </div>
          <div>
            <h2 className="font-heading font-black text-xl text-brand-dark">
              {success.status === "waitlisted"
                ? "You're on the waitlist"
                : "You're in!"}
            </h2>
            <p className="text-sm text-brand-dark/70">
              We&rsquo;ve sent a confirmation to <strong>{parentEmail}</strong>.
            </p>
          </div>
        </div>

        <p className="text-brand-dark/80 mb-6">
          {success.status === "waitlisted"
            ? "The session is full right now — we'll email you if a space opens up."
            : "Please arrive 15 minutes early for check-in. Looking forward to seeing you."}
        </p>

        <div className="rounded-xl bg-brand-pale/60 border border-brand-blue/20 p-5">
          <div className="flex items-start gap-3 mb-3">
            <Sparkles className="h-5 w-5 text-brand-blue mt-0.5 shrink-0" />
            <div>
              <h3 className="font-heading font-bold text-brand-dark text-base mb-1">
                Make the next one one tap
              </h3>
              <p className="text-sm text-brand-dark/70">
                Create a free account to see upcoming sessions, book in two taps,
                cancel easily, and track your child&rsquo;s journey with us. Your
                details are already saved — you just need a password.
              </p>
            </div>
          </div>
          <Button
            asChild
            className="w-full bg-brand-blue hover:bg-brand-dark text-white font-heading font-bold"
          >
            <Link href={`/portal/claim?token=${success.claimToken}`}>
              Create my account
            </Link>
          </Button>
        </div>

        <p className="text-xs text-brand-dark/50 text-center mt-5">
          Not now? No worries — the link is in your confirmation email too.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-brand-dark/10 p-6 md:p-8 space-y-6"
    >
      <div>
        <h2 className="font-heading font-black text-xl text-brand-dark mb-1">
          Register your family
        </h2>
        <p className="text-sm text-brand-dark/70">
          No account needed — we&rsquo;ll save your spot in under a minute.
        </p>
      </div>

      {/* Parent */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-brand-dark mb-1">
            Your name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">
              Postcode
            </label>
            <input
              type="text"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              placeholder="e.g. ME1 1YD"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">
              Your relationship to your child
            </label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent bg-white"
            >
              <option value="">Prefer not to say</option>
              <option value="mother">Mother</option>
              <option value="father">Father</option>
              <option value="carer">Carer</option>
              <option value="grandparent">Grandparent</option>
              <option value="guardian">Guardian</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Children */}
      <div>
        <h3 className="font-heading font-bold text-brand-dark mb-1">
          Your child/children
        </h3>
        <p className="text-xs text-brand-dark/60 mb-3">
          Growing Together is for children aged 0–5.
        </p>
        <div className="space-y-3">
          {children.map((child, i) => {
            const age =
              child.dateOfBirth && ageAtDate(child.dateOfBirth, sessionDate);
            const showAge = typeof age === "number" && age >= 0;
            const tooOld = typeof age === "number" && age > 5;
            return (
              <div
                key={i}
                className="rounded-xl border border-gray-200 p-4 space-y-3"
              >
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-brand-dark mb-1">
                      First name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={child.firstName}
                      onChange={(e) => updateChild(i, { firstName: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-brand-dark mb-1">
                      Date of birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={child.dateOfBirth}
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={(e) =>
                        updateChild(i, { dateOfBirth: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    />
                  </div>
                  {children.length > 1 && (
                    <button
                      type="button"
                      aria-label="Remove child"
                      onClick={() => removeChild(i)}
                      className="h-10 w-10 flex items-center justify-center rounded-lg border border-gray-200 text-brand-dark/60 hover:text-red-600 hover:border-red-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {showAge && !tooOld && (
                  <p className="text-xs text-brand-dark/60">
                    Would be {age} on the session date.
                  </p>
                )}
                {tooOld && (
                  <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md p-2">
                    Too old for Growing Together — this one is 0–5 only.
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={addChild}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue hover:text-brand-dark"
        >
          <Plus className="h-4 w-4" />
          Add another child
        </button>
      </div>

      {/* Extras */}
      <div>
        <label className="block text-sm font-medium text-brand-dark mb-1">
          Anything we should know? (optional)
        </label>
        <textarea
          value={accessibilityNote}
          onChange={(e) => setAccessibilityNote(e.target.value)}
          rows={2}
          placeholder="Accessibility needs, first-time nerves, anything else that would help us welcome your family."
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-dark mb-1">
          How did you hear about Growing Together?
        </label>
        <select
          value={howHeard}
          onChange={(e) => setHowHeard(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent bg-white"
        >
          <option value="">Prefer not to say</option>
          <option value="friend_or_family">A friend or family</option>
          <option value="instagram">Instagram</option>
          <option value="facebook">Facebook</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="family_hub">Family Hub</option>
          <option value="nursery">Nursery or childminder</option>
          <option value="school">School</option>
          <option value="health_visitor">Health visitor</option>
          <option value="library">Library</option>
          <option value="community_centre">Community centre</option>
          <option value="google_search">Google search</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Consent */}
      <div className="space-y-3 rounded-xl bg-brand-pale/40 border border-brand-dark/10 p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={photoConsent}
            onChange={(e) => setPhotoConsent(e.target.checked)}
            className="mt-1"
          />
          <span className="text-sm text-brand-dark/80">
            I&rsquo;m happy for photos/videos taken at the session to be used by
            Evolution Impact Initiative (website, socials, reporting). Optional —
            we won&rsquo;t photograph your family if you leave this unticked.
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            required
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1"
          />
          <span className="text-sm text-brand-dark/80">
            I agree to EII&rsquo;s{" "}
            <Link
              href="/privacy-policy"
              target="_blank"
              className="text-brand-blue underline"
            >
              privacy notice
            </Link>{" "}
            and{" "}
            <Link
              href="/safeguarding"
              target="_blank"
              className="text-brand-blue underline"
            >
              safeguarding policy
            </Link>
            . <span className="text-red-500">*</span>
          </span>
        </label>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={loading}
        className="w-full bg-brand-blue hover:bg-brand-dark text-white font-heading font-bold"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Registering&hellip;
          </>
        ) : (
          "Confirm registration"
        )}
      </Button>

      <p className="text-xs text-brand-dark/60 text-center">
        Already have an account?{" "}
        <Link
          href={`/portal/login?next=/events/${event.slug}/register-portal`}
          className="text-brand-blue underline font-medium"
        >
          Log in to register faster
        </Link>
      </p>
    </form>
  );
}
