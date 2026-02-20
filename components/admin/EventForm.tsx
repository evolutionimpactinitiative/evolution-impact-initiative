"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { Event, EventInsert, CustomField } from "@/lib/supabase/types";
import { Loader2, Upload, X } from "lucide-react";
import { RichTextEditor } from "./RichTextEditor";
import { CustomFieldsBuilder } from "./CustomFieldsBuilder";

interface EventFormProps {
  event?: Event;
}

const categories = [
  { value: "creative", label: "Creative & Wellbeing" },
  { value: "sport", label: "Sport & Youth" },
  { value: "support", label: "Support & Outreach" },
  { value: "community", label: "Community Events" },
  { value: "workshop", label: "Workshop" },
  { value: "social", label: "Social" },
  { value: "training", label: "Training" },
  { value: "family", label: "Family" },
] as const;

type CategoryType = "creative" | "sport" | "support" | "community" | "workshop" | "social" | "training" | "family";
type EventType = "children" | "adults" | "mixed";
type RegistrationStatusType = "open" | "closed" | "auto";

export function EventForm({ event }: EventFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const isEditing = !!event;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: event?.title || "",
    short_description: event?.short_description || "",
    full_description: event?.full_description || "",
    category: event?.category || "creative",
    event_type: event?.event_type || "children",
    date: event?.date || "",
    arrival_time: event?.arrival_time || "",
    start_time: event?.start_time || "",
    end_time: event?.end_time || "",
    venue_name: event?.venue_name || "",
    venue_address: event?.venue_address || "",
    age_group: event?.age_group || "",
    cost: event?.cost || "FREE",
    what_to_bring: event?.what_to_bring || "",
    accessibility_info: event?.accessibility_info || "",
    total_slots: event?.total_slots || 20,
    waitlist_slots: event?.waitlist_slots || 10,
    max_children_per_registration: event?.max_children_per_registration || 2,
    max_attendees_per_registration: event?.max_attendees_per_registration || 2,
    registration_status: event?.registration_status || "auto",
    status: event?.status || "draft",
    send_reminder_24h: event?.send_reminder_24h ?? true,
    send_reminder_1h: event?.send_reminder_1h ?? true,
    card_image_url: event?.card_image_url || "",
    hero_image_url: event?.hero_image_url || "",
    custom_fields: event?.custom_fields || [],
    photo_album_url: event?.photo_album_url || "",
  });

  const [customFields, setCustomFields] = useState<CustomField[]>(event?.custom_fields || []);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .concat("-", new Date().getFullYear().toString());
  };

  const handleSubmit = async (e: React.FormEvent, saveAs: "draft" | "published") => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const slug = isEditing ? event.slug : generateSlug(formData.title);

      const eventData: EventInsert = {
        ...formData,
        slug,
        status: saveAs,
        category: formData.category as CategoryType,
        event_type: formData.event_type as EventType,
        registration_status: formData.registration_status as "open" | "closed" | "auto",
        arrival_time: formData.arrival_time || null,
        custom_fields: customFields.length > 0 ? customFields : null,
      };

      if (isEditing) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase as any)
          .from("events")
          .update(eventData)
          .eq("id", event.id);

        if (updateError) throw updateError;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertError } = await (supabase as any).from("events").insert(eventData);

        if (insertError) throw insertError;
      }

      router.push("/admin/events");
      router.refresh();
    } catch (err) {
      console.error("Error saving event:", err);
      setError(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "card" | "hero") => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${type}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from("event-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("event-images").getPublicUrl(fileName);

      setFormData((prev) => ({
        ...prev,
        [type === "card" ? "card_image_url" : "hero_image_url"]: publicUrl,
      }));
    } catch (err) {
      console.error("Error uploading image:", err);
      setError("Failed to upload image");
    }
  };

  return (
    <form className="space-y-8">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
      )}

      {/* Basic Details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="font-heading font-bold text-lg text-gray-900 mb-4">Basic Details</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              placeholder="e.g., Kids' Jewellery Making Workshop"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Short Description <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal ml-1">(max 150 characters)</span>
            </label>
            <input
              type="text"
              value={formData.short_description}
              onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
              maxLength={150}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              placeholder="Brief description for event cards"
              required
            />
            <p className="text-xs text-gray-400 mt-1">{formData.short_description.length}/150</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
            <RichTextEditor
              content={formData.full_description || ""}
              onChange={(content) => setFormData({ ...formData, full_description: content })}
              placeholder="Detailed description for the event page..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as CategoryType })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Date & Location */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="font-heading font-bold text-lg text-gray-900 mb-4">Date & Location</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Arrival/Doors Open Time
            </label>
            <input
              type="time"
              value={formData.arrival_time || ""}
              onChange={(e) => setFormData({ ...formData, arrival_time: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              placeholder="e.g., 09:30"
            />
            <p className="text-xs text-gray-400 mt-1">When attendees should arrive</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
            <input
              type="time"
              value={formData.end_time || ""}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Venue Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.venue_name}
              onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              placeholder="e.g., Gillingham Children & Family Hub"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.venue_address}
              onChange={(e) => setFormData({ ...formData, venue_address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              placeholder="Full address including postcode"
              required
            />
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="font-heading font-bold text-lg text-gray-900 mb-4">Images</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Image <span className="text-gray-400 font-normal">(800x600px, 4:3 ratio)</span>
            </label>
            {formData.card_image_url ? (
              <div className="relative">
                <img
                  src={formData.card_image_url}
                  alt="Card preview"
                  className="w-full aspect-[4/3] object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, card_image_url: "" })}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full aspect-[4/3] border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-blue hover:bg-gray-50 transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Click to upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "card")}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hero Image <span className="text-gray-400 font-normal">(1200x900px, 4:3 ratio)</span>
            </label>
            {formData.hero_image_url ? (
              <div className="relative">
                <img
                  src={formData.hero_image_url}
                  alt="Hero preview"
                  className="w-full aspect-[4/3] object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, hero_image_url: "" })}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full aspect-[4/3] border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-blue hover:bg-gray-50 transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Click to upload (optional)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "hero")}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Capacity & Registration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="font-heading font-bold text-lg text-gray-900 mb-4">Capacity & Registration</h2>

        {/* Event Type */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="event_type"
                value="children"
                checked={formData.event_type === "children"}
                onChange={(e) => setFormData({ ...formData, event_type: e.target.value as EventType })}
                className="text-brand-blue focus:ring-brand-blue"
              />
              <span className="text-sm">Children's Event</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="event_type"
                value="adults"
                checked={formData.event_type === "adults"}
                onChange={(e) => setFormData({ ...formData, event_type: e.target.value as EventType })}
                className="text-brand-blue focus:ring-brand-blue"
              />
              <span className="text-sm">Adults Only</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="event_type"
                value="mixed"
                checked={formData.event_type === "mixed"}
                onChange={(e) => setFormData({ ...formData, event_type: e.target.value as EventType })}
                className="text-brand-blue focus:ring-brand-blue"
              />
              <span className="text-sm">Mixed (Adults & Children)</span>
            </label>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {formData.event_type === "children" && "Parent/guardian registers children"}
            {formData.event_type === "adults" && "Adults register themselves"}
            {formData.event_type === "mixed" && "Can register adults and/or children"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Slots <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={formData.total_slots}
              onChange={(e) => setFormData({ ...formData, total_slots: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Waitlist Slots
            </label>
            <input
              type="number"
              min="0"
              value={formData.waitlist_slots}
              onChange={(e) => setFormData({ ...formData, waitlist_slots: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">Set to 0 for no waitlist</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formData.event_type === "children" ? "Max Children per Registration" : "Max Attendees per Registration"}
            </label>
            <select
              value={formData.event_type === "children" ? formData.max_children_per_registration : formData.max_attendees_per_registration}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (formData.event_type === "children") {
                  setFormData({ ...formData, max_children_per_registration: value });
                } else {
                  setFormData({ ...formData, max_attendees_per_registration: value });
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            >
              <option value="1">1 {formData.event_type === "children" ? "child" : "person"}</option>
              <option value="2">2 {formData.event_type === "children" ? "children" : "people"}</option>
              <option value="3">3 {formData.event_type === "children" ? "children" : "people"}</option>
              <option value="4">4 {formData.event_type === "children" ? "children" : "people"}</option>
              {formData.event_type !== "children" && <option value="5">5 people</option>}
              {formData.event_type !== "children" && <option value="6">6 people</option>}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Registration Status</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="registration_status"
                value="open"
                checked={formData.registration_status === "open"}
                onChange={(e) => setFormData({ ...formData, registration_status: e.target.value as RegistrationStatusType })}
                className="text-brand-blue focus:ring-brand-blue"
              />
              <span className="text-sm">Open</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="registration_status"
                value="closed"
                checked={formData.registration_status === "closed"}
                onChange={(e) => setFormData({ ...formData, registration_status: e.target.value as RegistrationStatusType })}
                className="text-brand-blue focus:ring-brand-blue"
              />
              <span className="text-sm">Closed</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="registration_status"
                value="auto"
                checked={formData.registration_status === "auto"}
                onChange={(e) => setFormData({ ...formData, registration_status: e.target.value as RegistrationStatusType })}
                className="text-brand-blue focus:ring-brand-blue"
              />
              <span className="text-sm">Auto-close on event day</span>
            </label>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="font-heading font-bold text-lg text-gray-900 mb-4">Additional Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age Group</label>
            <input
              type="text"
              value={formData.age_group || ""}
              onChange={(e) => setFormData({ ...formData, age_group: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              placeholder="e.g., Children aged 5-11"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cost</label>
            <input
              type="text"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              placeholder="e.g., FREE or £5 per child"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">What to Bring</label>
          <RichTextEditor
            content={formData.what_to_bring || ""}
            onChange={(content) => setFormData({ ...formData, what_to_bring: content })}
            placeholder="List items attendees should bring..."
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Accessibility Information</label>
          <textarea
            value={formData.accessibility_info || ""}
            onChange={(e) => setFormData({ ...formData, accessibility_info: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            placeholder="Information about venue accessibility..."
          />
        </div>
      </div>

      {/* Custom Registration Fields */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="font-heading font-bold text-lg text-gray-900 mb-2">Custom Registration Fields</h2>
        <p className="text-sm text-gray-500 mb-4">
          Add custom questions to your registration form. These will appear after the standard fields.
        </p>
        <CustomFieldsBuilder fields={customFields} onChange={setCustomFields} />
      </div>

      {/* Email Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="font-heading font-bold text-lg text-gray-900 mb-4">Email Reminders</h2>

        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.send_reminder_24h}
              onChange={(e) => setFormData({ ...formData, send_reminder_24h: e.target.checked })}
              className="w-5 h-5 text-brand-blue rounded focus:ring-brand-blue"
            />
            <span className="text-sm text-gray-700">Send reminder 24 hours before event</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.send_reminder_1h}
              onChange={(e) => setFormData({ ...formData, send_reminder_1h: e.target.checked })}
              className="w-5 h-5 text-brand-blue rounded focus:ring-brand-blue"
            />
            <span className="text-sm text-gray-700">Send reminder 1 hour before event</span>
          </label>
        </div>
      </div>

      {/* Post-Event */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="font-heading font-bold text-lg text-gray-900 mb-2">Post-Event</h2>
        <p className="text-sm text-gray-500 mb-4">
          Add a link to event photos that can be shared with attendees after the event.
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Photo Album URL
          </label>
          <input
            type="url"
            value={formData.photo_album_url || ""}
            onChange={(e) => setFormData({ ...formData, photo_album_url: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            placeholder="e.g., https://drive.google.com/drive/folders/..."
          />
          <p className="text-xs text-gray-400 mt-1">
            Paste a link to Google Drive, Dropbox, or any photo hosting service
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={(e) => handleSubmit(e, "draft")}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Save as Draft
        </Button>
        <Button type="button" onClick={(e) => handleSubmit(e, "published")} disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          {isEditing ? "Update & Publish" : "Create & Publish"}
        </Button>
      </div>
    </form>
  );
}
