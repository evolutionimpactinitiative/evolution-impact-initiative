"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SurveyBuilder } from "./SurveyBuilder";
import { Loader2 } from "lucide-react";
import type { Survey, SurveyQuestion, Event } from "@/lib/supabase/types";

interface SurveyFormProps {
  survey?: Survey;
  events: Pick<Event, "id" | "title" | "date">[];
}

type SurveyType = "event_feedback" | "activity_interest" | "general";

export function SurveyForm({ survey, events }: SurveyFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const isEditing = !!survey;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: survey?.title || "",
    description: survey?.description || "",
    survey_type: (survey?.survey_type || "event_feedback") as SurveyType,
    event_id: survey?.event_id || "",
    is_active: survey?.is_active ?? true,
  });

  const [questions, setQuestions] = useState<SurveyQuestion[]>(
    (survey?.questions as SurveyQuestion[]) || []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!formData.title.trim()) {
        throw new Error("Survey title is required");
      }

      if (questions.length === 0) {
        throw new Error("Please add at least one question");
      }

      // Validate questions
      for (const q of questions) {
        if (!q.text.trim()) {
          throw new Error("All questions must have text");
        }
        if (
          (q.type === "multiple_choice" || q.type === "multi_select") &&
          Array.isArray(q.options) &&
          q.options.filter((o) => o.trim()).length < 2
        ) {
          throw new Error("Multiple choice questions need at least 2 options");
        }
      }

      const surveyData = {
        title: formData.title,
        description: formData.description || null,
        survey_type: formData.survey_type,
        event_id: formData.event_id || null,
        is_active: formData.is_active,
        questions: questions,
      };

      if (isEditing) {
        const { error: updateError } = await supabase
          .from("surveys" as "profiles")
          .update(surveyData as never)
          .eq("id", survey.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("surveys" as "profiles")
          .insert(surveyData as never);

        if (insertError) throw insertError;
      }

      router.push("/admin/surveys");
      router.refresh();
    } catch (err) {
      console.error("Error saving survey:", err);
      setError(err instanceof Error ? err.message : "Failed to save survey");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Basic Details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="font-heading font-bold text-lg text-gray-900 mb-4">
          Survey Details
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Survey Title <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Event Feedback Survey"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              placeholder="Brief description of what this survey is about..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Survey Type
              </label>
              <select
                value={formData.survey_type}
                onChange={(e) =>
                  setFormData({ ...formData, survey_type: e.target.value as SurveyType })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              >
                <option value="event_feedback">Event Feedback</option>
                <option value="activity_interest">Activity Interest</option>
                <option value="general">General Survey</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link to Event (Optional)
              </label>
              <select
                value={formData.event_id}
                onChange={(e) => setFormData({ ...formData, event_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              >
                <option value="">No linked event</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title} (
                    {new Date(event.date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                    )
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5 text-brand-blue rounded focus:ring-brand-blue"
              />
              <span className="text-sm text-gray-700">Survey is active and accepting responses</span>
            </label>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="font-heading font-bold text-lg text-gray-900 mb-2">
          Questions
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Add questions to your survey. Drag to reorder.
        </p>

        <SurveyBuilder questions={questions} onChange={setQuestions} />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          {isEditing ? "Update Survey" : "Create Survey"}
        </Button>
      </div>
    </form>
  );
}
