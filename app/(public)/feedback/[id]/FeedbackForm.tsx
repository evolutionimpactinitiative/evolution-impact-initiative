"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle, Star } from "lucide-react";
import type { SurveyQuestion } from "@/lib/supabase/types";

interface FeedbackFormProps {
  surveyId: string;
  questions: SurveyQuestion[];
  eventId?: string;
}

export function FeedbackForm({ surveyId, questions, eventId }: FeedbackFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const updateAnswer = (questionId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate required fields
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    // Validate required questions
    for (const q of questions) {
      if (q.required && !answers[q.id]) {
        setError(`Please answer: "${q.text}"`);
        return;
      }
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/surveys/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surveyId,
          eventId,
          respondentEmail: email,
          respondentName: name || null,
          answers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit response");
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand-green/10 mb-6">
          <CheckCircle className="h-10 w-10 text-brand-green" />
        </div>
        <h2 className="font-heading font-bold text-2xl text-brand-dark mb-4">
          Thank You!
        </h2>
        <p className="text-brand-dark/70 max-w-md mx-auto">
          Your feedback has been submitted successfully. We really appreciate you taking
          the time to share your thoughts with us.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Contact Info */}
      <div className="bg-brand-pale/30 rounded-xl p-6">
        <h3 className="font-heading font-bold text-lg text-brand-dark mb-4">
          Your Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-gray-400">(optional)</span>
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((question, index) => (
          <div
            key={question.id}
            className="bg-white border border-gray-200 rounded-xl p-6"
          >
            <p className="font-medium text-brand-dark mb-4">
              {index + 1}. {question.text}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </p>

            {/* Rating */}
            {question.type === "rating" && (
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => updateAnswer(question.id, star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        (answers[question.id] as number) >= star
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Multiple Choice */}
            {question.type === "multiple_choice" &&
              Array.isArray(question.options) && (
                <div className="space-y-2">
                  {question.options.map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={() => updateAnswer(question.id, option)}
                        className="w-4 h-4 text-brand-blue"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}

            {/* Multi-Select */}
            {question.type === "multi_select" &&
              Array.isArray(question.options) && (
                <div className="space-y-2">
                  {question.options.map((option) => {
                    const selected = Array.isArray(answers[question.id])
                      ? (answers[question.id] as string[]).includes(option)
                      : false;
                    return (
                      <label
                        key={option}
                        className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => {
                            const current = Array.isArray(answers[question.id])
                              ? (answers[question.id] as string[])
                              : [];
                            if (e.target.checked) {
                              updateAnswer(question.id, [...current, option]);
                            } else {
                              updateAnswer(
                                question.id,
                                current.filter((o) => o !== option)
                              );
                            }
                          }}
                          className="w-4 h-4 rounded text-brand-blue"
                        />
                        <span>{option}</span>
                      </label>
                    );
                  })}
                </div>
              )}

            {/* Yes/No */}
            {question.type === "yes_no" && (
              <div className="flex gap-4">
                <label className="flex-1">
                  <input
                    type="radio"
                    name={question.id}
                    value="yes"
                    checked={answers[question.id] === "yes"}
                    onChange={() => updateAnswer(question.id, "yes")}
                    className="sr-only peer"
                  />
                  <div className="p-4 text-center border-2 rounded-lg cursor-pointer transition-colors peer-checked:border-brand-green peer-checked:bg-brand-green/10 hover:bg-gray-50">
                    Yes
                  </div>
                </label>
                <label className="flex-1">
                  <input
                    type="radio"
                    name={question.id}
                    value="no"
                    checked={answers[question.id] === "no"}
                    onChange={() => updateAnswer(question.id, "no")}
                    className="sr-only peer"
                  />
                  <div className="p-4 text-center border-2 rounded-lg cursor-pointer transition-colors peer-checked:border-red-500 peer-checked:bg-red-50 hover:bg-gray-50">
                    No
                  </div>
                </label>
              </div>
            )}

            {/* Text */}
            {question.type === "text" && (
              <textarea
                value={(answers[question.id] as string) || ""}
                onChange={(e) => updateAnswer(question.id, e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                placeholder="Your answer..."
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-center">
        <Button type="submit" size="lg" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Feedback"
          )}
        </Button>
      </div>
    </form>
  );
}
