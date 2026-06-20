"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { submitOutcomeResponse } from "@/lib/outcomes/actions";
import type { OutcomeInstrument } from "@/lib/outcomes/types";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface Props {
  token: string;
  instrument: OutcomeInstrument;
  knownParticipantName: string | null;
  knownParticipantEmail: string | null;
}

export function OutcomeSurveyForm({
  token,
  instrument,
  knownParticipantName,
  knownParticipantEmail,
}: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [name, setName] = useState(knownParticipantName ?? "");
  const [email, setEmail] = useState(knownParticipantEmail ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function scaleValuesFor(scale: string): number[] {
    // e.g. "0-10" → [0..10], "1-5" → [1..5]
    const m = scale.match(/^(\d+)-(\d+)$/);
    if (!m) return [];
    const lo = Number(m[1]);
    const hi = Number(m[2]);
    return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate every item answered
    for (const item of instrument.items) {
      if (answers[item.id] == null) {
        setError("Please answer all questions");
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await submitOutcomeResponse({
        token,
        answers,
        participant_name: name.trim() || undefined,
        participant_email: email.trim() || undefined,
      });
      if (!res.ok) setError(res.error);
      else setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h2 className="font-heading font-bold text-lg text-gray-900">
          Thank you
        </h2>
        <p className="text-sm text-gray-600 mt-2">
          Your response has been recorded. We really appreciate you taking
          the time.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Optional self-identify (only shown if participant not pre-set) */}
      {!knownParticipantName && !knownParticipantEmail && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Optional — helps us track change over time
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
        </div>
      )}

      {/* Questions */}
      {instrument.items.map((item, i) => {
        const values = scaleValuesFor(item.scale);
        const labels = item.scale_labels ?? {};
        const min = values[0];
        const max = values[values.length - 1];
        return (
          <div
            key={item.id}
            className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5"
          >
            <p className="font-medium text-gray-900 mb-3">
              <span className="text-gray-400 mr-1.5">{i + 1}.</span>
              {item.text}
            </p>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(2.5rem,1fr))] gap-1.5">
              {values.map((v) => (
                <label
                  key={v}
                  className={`relative flex flex-col items-center cursor-pointer rounded-lg border py-2 transition-colors ${
                    answers[item.id] === v
                      ? "bg-brand-blue text-white border-brand-blue"
                      : "bg-white text-gray-700 border-gray-200 hover:border-brand-blue"
                  }`}
                >
                  <input
                    type="radio"
                    name={item.id}
                    value={v}
                    checked={answers[item.id] === v}
                    onChange={() =>
                      setAnswers({ ...answers, [item.id]: v })
                    }
                    className="sr-only"
                  />
                  <span className="text-sm font-semibold">{v}</span>
                </label>
              ))}
            </div>
            {/* Scale anchor labels */}
            <div className="flex justify-between mt-2 text-[10px] uppercase tracking-wide text-gray-400">
              <span>{labels[String(min)] ?? ""}</span>
              <span>{labels[String(max)] ?? ""}</span>
            </div>
          </div>
        );
      })}

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button type="submit" disabled={submitting} size="lg" className="w-full">
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Submitting…
          </>
        ) : (
          <>Submit</>
        )}
      </Button>
    </form>
  );
}
