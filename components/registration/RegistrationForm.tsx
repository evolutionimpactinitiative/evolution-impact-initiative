"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { Event } from "@/lib/supabase/types";
import { Loader2, Plus, Trash2, AlertCircle } from "lucide-react";
import { DynamicField } from "./DynamicField";

interface RegistrationFormProps {
  event: Event;
  willBeWaitlisted: boolean;
  maxChildren: number;
  maxAttendees: number;
}

interface ChildData {
  name: string;
  age: string;
}

interface AttendeeData {
  name: string;
  email: string;
  phone: string;
}

export function RegistrationForm({ event, willBeWaitlisted, maxChildren, maxAttendees }: RegistrationFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine form mode based on event type
  const isChildrenEvent = event.event_type === "children";
  const isAdultsEvent = event.event_type === "adults";
  const isMixedEvent = event.event_type === "mixed";

  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [accessibilityRequirements, setAccessibilityRequirements] = useState("");
  const [howHeardAboutUs, setHowHeardAboutUs] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);

  // Custom field responses
  const [customResponses, setCustomResponses] = useState<Record<string, string | boolean | number>>(() => {
    // Initialize with default values based on field types
    const initial: Record<string, string | boolean | number> = {};
    (event.custom_fields || []).forEach((field) => {
      if (field.type === "checkbox") {
        initial[field.id] = false;
      } else if (field.type === "number") {
        initial[field.id] = 0;
      } else {
        initial[field.id] = "";
      }
    });
    return initial;
  });

  const updateCustomResponse = (fieldId: string, value: string | boolean | number) => {
    setCustomResponses((prev) => ({ ...prev, [fieldId]: value }));
  };

  // Children state (for children and mixed events)
  const [children, setChildren] = useState<ChildData[]>(
    isChildrenEvent || isMixedEvent ? [{ name: "", age: "" }] : []
  );

  // Attendees state (for adult and mixed events)
  const [attendees, setAttendees] = useState<AttendeeData[]>(
    isAdultsEvent ? [{ name: "", email: "", phone: "" }] : []
  );

  // Children handlers
  const addChild = () => {
    if (children.length < maxChildren) {
      setChildren([...children, { name: "", age: "" }]);
    }
  };

  const removeChild = (index: number) => {
    if (children.length > 1) {
      setChildren(children.filter((_, i) => i !== index));
    } else if (isMixedEvent) {
      // For mixed events, allow removing all children
      setChildren([]);
    }
  };

  const updateChild = (index: number, field: keyof ChildData, value: string) => {
    const updated = [...children];
    updated[index][field] = value;
    setChildren(updated);
  };

  // Attendees handlers
  const addAttendee = () => {
    if (attendees.length < maxAttendees) {
      setAttendees([...attendees, { name: "", email: "", phone: "" }]);
    }
  };

  const removeAttendee = (index: number) => {
    if (attendees.length > 1) {
      setAttendees(attendees.filter((_, i) => i !== index));
    } else if (isMixedEvent) {
      // For mixed events, allow removing all attendees
      setAttendees([]);
    }
  };

  const updateAttendee = (index: number, field: keyof AttendeeData, value: string) => {
    const updated = [...attendees];
    updated[index][field] = value;
    setAttendees(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Validate consent
    if (!consentChecked) {
      setError("Please accept the terms and consent to continue");
      setIsLoading(false);
      return;
    }

    // Validate children/attendees based on event type
    const validChildren = children.filter((c) => c.name.trim() && c.age.trim());
    const validAttendees = attendees.filter((a) => a.name.trim());

    if (isChildrenEvent && validChildren.length === 0) {
      setError("Please add at least one child");
      setIsLoading(false);
      return;
    }

    if (isAdultsEvent && validAttendees.length === 0) {
      setError("Please add at least one attendee");
      setIsLoading(false);
      return;
    }

    if (isMixedEvent && validChildren.length === 0 && validAttendees.length === 0) {
      setError("Please add at least one child or attendee");
      setIsLoading(false);
      return;
    }

    // Validate required custom fields
    const requiredCustomFields = (event.custom_fields || []).filter((f) => f.required);
    for (const field of requiredCustomFields) {
      const value = customResponses[field.id];
      if (field.type === "checkbox" && value !== true) {
        setError(`Please check the required field: ${field.label}`);
        setIsLoading(false);
        return;
      } else if (field.type !== "checkbox" && !value) {
        setError(`Please fill in the required field: ${field.label}`);
        setIsLoading(false);
        return;
      }
    }

    try {
      // First check availability again
      const { data: currentRegistrations } = await supabase
        .from("registrations")
        .select("status")
        .eq("event_id", event.id);

      type RegStatus = { status: string };
      const regs = (currentRegistrations as RegStatus[] | null) || [];
      const confirmedCount = regs.filter((r) => r.status === "confirmed").length;
      const waitlistedCount = regs.filter((r) => r.status === "waitlisted").length;

      const spotsRemaining = event.total_slots - confirmedCount;
      const waitlistRemaining = event.waitlist_slots - waitlistedCount;

      let status: "confirmed" | "waitlisted";
      if (spotsRemaining > 0) {
        status = "confirmed";
      } else if (waitlistRemaining > 0) {
        status = "waitlisted";
      } else {
        setError("Sorry, this event is now fully booked. Please check other events.");
        setIsLoading(false);
        return;
      }

      // Create registration
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: registration, error: regError } = await (supabase as any)
        .from("registrations")
        .insert({
          event_id: event.id,
          parent_name: parentName.trim(),
          parent_email: parentEmail.trim().toLowerCase(),
          parent_phone: parentPhone.trim(),
          accessibility_requirements: accessibilityRequirements.trim() || null,
          how_heard_about_us: howHeardAboutUs.trim() || null,
          photo_video_consent: consentChecked,
          terms_accepted_at: new Date().toISOString(),
          status,
          custom_responses: Object.keys(customResponses).length > 0 ? customResponses : null,
        })
        .select()
        .single();

      if (regError) throw regError;

      // Add children (for children and mixed events)
      if (validChildren.length > 0) {
        const childrenToInsert = validChildren.map((child, index) => ({
          registration_id: registration.id,
          child_name: child.name.trim(),
          child_age: parseInt(child.age),
          display_order: index,
        }));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: childError } = await (supabase as any)
          .from("registration_children")
          .insert(childrenToInsert);

        if (childError) throw childError;
      }

      // Add attendees (for adult and mixed events)
      if (validAttendees.length > 0) {
        const attendeesToInsert = validAttendees.map((attendee, index) => ({
          registration_id: registration.id,
          attendee_name: attendee.name.trim(),
          attendee_email: attendee.email.trim() || null,
          attendee_phone: attendee.phone.trim() || null,
          display_order: index,
        }));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: attendeeError } = await (supabase as any)
          .from("registration_attendees")
          .insert(attendeesToInsert);

        if (attendeeError) throw attendeeError;
      }

      // Send confirmation email (fire and forget)
      fetch("/api/email/send-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: registration.id }),
      }).catch(console.error);

      // Redirect to confirmation page
      router.push(`/events/${event.slug}/register/confirmation?status=${status}&id=${registration.id}`);
    } catch (err) {
      console.error("Registration error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Waitlist notice */}
      {willBeWaitlisted && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">You will be added to the waitlist</p>
            <p className="text-sm text-yellow-700 mt-1">
              This event is currently full. By registering, you&apos;ll be added to our waitlist and
              notified if a spot becomes available.
            </p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Contact Details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-heading font-bold text-lg text-gray-900 mb-4">
          {isAdultsEvent ? "Your Details" : "Parent/Guardian Details"}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                placeholder="07xxx xxx xxx"
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* Children Details (for children and mixed events) */}
      {(isChildrenEvent || isMixedEvent) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-lg text-gray-900">
              Children Attending
              {event.age_group && (
                <span className="text-sm font-normal text-gray-500 ml-2">({event.age_group})</span>
              )}
            </h3>
            {children.length < maxChildren && (
              <Button type="button" variant="outline" size="sm" onClick={addChild}>
                <Plus className="w-4 h-4 mr-1" />
                Add Child
              </Button>
            )}
          </div>

          {children.length === 0 && isMixedEvent ? (
            <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500 mb-3">No children added</p>
              <Button type="button" variant="outline" size="sm" onClick={addChild}>
                <Plus className="w-4 h-4 mr-1" />
                Add a Child
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {children.map((child, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-700">Child {index + 1}</span>
                    {(children.length > 1 || isMixedEvent) && (
                      <button
                        type="button"
                        onClick={() => removeChild(index)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Child&apos;s Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={child.name}
                        onChange={(e) => updateChild(index, "name", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                        required={isChildrenEvent}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Age <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="18"
                        value={child.age}
                        onChange={(e) => updateChild(index, "age", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                        required={isChildrenEvent}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-sm text-gray-500 mt-3">
            Maximum {maxChildren} {maxChildren === 1 ? "child" : "children"} per registration
          </p>
        </div>
      )}

      {/* Adult Attendees (for adult and mixed events) */}
      {(isAdultsEvent || isMixedEvent) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-lg text-gray-900">
              {isAdultsEvent ? "Attendees" : "Adult Attendees"}
            </h3>
            {attendees.length < maxAttendees && (
              <Button type="button" variant="outline" size="sm" onClick={addAttendee}>
                <Plus className="w-4 h-4 mr-1" />
                Add Attendee
              </Button>
            )}
          </div>

          {attendees.length === 0 && isMixedEvent ? (
            <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500 mb-3">No adult attendees added</p>
              <Button type="button" variant="outline" size="sm" onClick={addAttendee}>
                <Plus className="w-4 h-4 mr-1" />
                Add an Attendee
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {attendees.map((attendee, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-700">
                      {isAdultsEvent ? `Attendee ${index + 1}` : `Adult ${index + 1}`}
                    </span>
                    {(attendees.length > 1 || isMixedEvent) && (
                      <button
                        type="button"
                        onClick={() => removeAttendee(index)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={attendee.name}
                        onChange={(e) => updateAttendee(index, "name", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                        required={isAdultsEvent}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={attendee.email}
                          onChange={(e) => updateAttendee(index, "email", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                          placeholder="Optional"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={attendee.phone}
                          onChange={(e) => updateAttendee(index, "phone", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-sm text-gray-500 mt-3">
            Maximum {maxAttendees} {maxAttendees === 1 ? "person" : "people"} per registration
          </p>
        </div>
      )}

      {/* Additional Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-heading font-bold text-lg text-gray-900 mb-4">Additional Information</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Accessibility Requirements
            </label>
            <textarea
              value={accessibilityRequirements}
              onChange={(e) => setAccessibilityRequirements(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent resize-none"
              placeholder="Let us know if you have any accessibility needs..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              How did you hear about us?
            </label>
            <select
              value={howHeardAboutUs}
              onChange={(e) => setHowHeardAboutUs(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            >
              <option value="">Select an option</option>
              <option value="social_media">Social Media</option>
              <option value="friend_family">Friend or Family</option>
              <option value="school">School</option>
              <option value="community_centre">Community Centre</option>
              <option value="flyer_poster">Flyer / Poster</option>
              <option value="google">Google Search</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Custom Fields (if any) */}
      {event.custom_fields && event.custom_fields.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-heading font-bold text-lg text-gray-900 mb-4">Additional Questions</h3>
          <div className="space-y-4">
            {event.custom_fields.map((field) => (
              <DynamicField
                key={field.id}
                field={field}
                value={customResponses[field.id]}
                onChange={(value) => updateCustomResponse(field.id, value)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Terms & Consent */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-heading font-bold text-lg text-gray-900 mb-4">Terms & Consent</h3>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consentChecked}
            onChange={(e) => setConsentChecked(e.target.checked)}
            className="w-5 h-5 mt-0.5 text-brand-blue rounded focus:ring-brand-blue border-gray-300"
            required
          />
          <span className="text-sm text-gray-700 leading-relaxed">
            I agree to the{" "}
            <a href="/terms" target="_blank" className="text-brand-blue underline hover:text-brand-dark">
              Terms & Conditions
            </a>{" "}
            and give Evolution Impact Initiative consent to photograph and video record{" "}
            {event.event_type === "adults" ? "myself" : "my child(ren)"} during this event.
            These images may be used for promotional purposes on our website and social media.
            <span className="text-red-500 ml-1">*</span>
          </span>
        </label>

        <div className="mt-6">
          <Button type="submit" className="w-full" size="lg" disabled={isLoading || !consentChecked}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Registering...
              </>
            ) : willBeWaitlisted ? (
              "Join Waitlist"
            ) : (
              "Complete Registration"
            )}
          </Button>

          {!consentChecked && (
            <p className="text-xs text-gray-500 text-center mt-2">
              Please accept the terms and consent to continue
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
