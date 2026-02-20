"use client";

import { useState } from "react";
import { ClipboardList, Download, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Survey, SurveyResponse, SurveyQuestion } from "@/lib/supabase/types";

interface SurveyResponsesViewProps {
  survey: Survey;
  questions: SurveyQuestion[];
  responses: SurveyResponse[];
}

export function SurveyResponsesView({
  survey,
  questions,
  responses,
}: SurveyResponsesViewProps) {
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);

  // Calculate analytics
  const getQuestionStats = (question: SurveyQuestion) => {
    const answers = responses
      .map((r) => {
        const ans = r.answers as Record<string, unknown>;
        return ans[question.id];
      })
      .filter((a) => a !== undefined && a !== null && a !== "");

    if (question.type === "rating") {
      const numericAnswers = answers.map(Number).filter((n) => !isNaN(n));
      const avg = numericAnswers.length
        ? numericAnswers.reduce((a, b) => a + b, 0) / numericAnswers.length
        : 0;
      const distribution = [1, 2, 3, 4, 5].map(
        (n) => numericAnswers.filter((a) => a === n).length
      );
      return { avg, distribution, total: numericAnswers.length };
    }

    if (question.type === "multiple_choice" || question.type === "multi_select") {
      const optionCounts: Record<string, number> = {};
      answers.forEach((a) => {
        if (Array.isArray(a)) {
          a.forEach((opt) => {
            optionCounts[opt] = (optionCounts[opt] || 0) + 1;
          });
        } else if (typeof a === "string") {
          optionCounts[a] = (optionCounts[a] || 0) + 1;
        }
      });
      return { optionCounts, total: answers.length };
    }

    if (question.type === "yes_no") {
      const yes = answers.filter((a) => a === "yes" || a === true).length;
      const no = answers.filter((a) => a === "no" || a === false).length;
      return { yes, no, total: answers.length };
    }

    return { textAnswers: answers as string[], total: answers.length };
  };

  const handleExportCSV = () => {
    const headers = ["Respondent", "Email", "Submitted", ...questions.map((q) => q.text)];
    const rows = responses.map((r) => {
      const answers = r.answers as Record<string, unknown>;
      return [
        r.respondent_name || "Anonymous",
        r.respondent_email,
        new Date(r.submitted_at).toLocaleString("en-GB"),
        ...questions.map((q) => {
          const answer = answers[q.id];
          if (Array.isArray(answer)) return answer.join(", ");
          return String(answer || "");
        }),
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${survey.title.replace(/\s+/g, "-")}-responses.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {responses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">No responses yet</h3>
          <p className="text-gray-500">
            Share the survey link to start collecting responses
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Analytics Panel */}
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-lg text-gray-900">
              Response Summary
            </h3>

            {questions.map((question) => {
              const stats = getQuestionStats(question);

              return (
                <div
                  key={question.id}
                  className="bg-white rounded-xl border border-gray-200 p-4"
                >
                  <p className="font-medium text-gray-900 mb-3">{question.text}</p>

                  {question.type === "rating" && "avg" in stats && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-5 h-5 ${
                                star <= Math.round(stats.avg ?? 0)
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-bold text-lg">{(stats.avg ?? 0).toFixed(1)}</span>
                        <span className="text-sm text-gray-500">
                          ({stats.total} responses)
                        </span>
                      </div>
                      <div className="space-y-1">
                        {(stats.distribution ?? []).map((count, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className="w-4 text-right">{i + 1}</span>
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-yellow-400 rounded-full"
                                style={{
                                  width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%`,
                                }}
                              />
                            </div>
                            <span className="w-8 text-gray-500">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(question.type === "multiple_choice" ||
                    question.type === "multi_select") &&
                    "optionCounts" in stats && (
                      <div className="space-y-2">
                        {Array.isArray(question.options) &&
                          question.options.map((option) => {
                            const count = (stats.optionCounts ?? {})[option] || 0;
                            const pct =
                              stats.total > 0 ? (count / stats.total) * 100 : 0;
                            return (
                              <div key={option} className="flex items-center gap-2">
                                <div className="flex-1">
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>{option}</span>
                                    <span className="text-gray-500">
                                      {count} ({pct.toFixed(0)}%)
                                    </span>
                                  </div>
                                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-brand-blue rounded-full"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}

                  {question.type === "yes_no" && "yes" in stats && (
                    <div className="flex gap-4">
                      <div className="flex-1 text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{stats.yes}</p>
                        <p className="text-sm text-green-700">Yes</p>
                      </div>
                      <div className="flex-1 text-center p-3 bg-red-50 rounded-lg">
                        <p className="text-2xl font-bold text-red-600">{stats.no}</p>
                        <p className="text-sm text-red-700">No</p>
                      </div>
                    </div>
                  )}

                  {question.type === "text" && "textAnswers" in stats && (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {(stats.textAnswers ?? []).slice(0, 5).map((answer, i) => (
                        <p
                          key={i}
                          className="text-sm text-gray-600 bg-gray-50 p-2 rounded"
                        >
                          "{answer}"
                        </p>
                      ))}
                      {(stats.textAnswers ?? []).length > 5 && (
                        <p className="text-sm text-gray-400">
                          +{(stats.textAnswers ?? []).length - 5} more responses
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Individual Responses */}
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-lg text-gray-900">
              Individual Responses
            </h3>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {responses.map((response) => (
                <button
                  key={response.id}
                  onClick={() =>
                    setSelectedResponse(
                      selectedResponse?.id === response.id ? null : response
                    )
                  }
                  className={`w-full text-left bg-white rounded-lg border p-4 transition-colors ${
                    selectedResponse?.id === response.id
                      ? "border-brand-blue"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        {response.respondent_name || "Anonymous"}
                      </p>
                      <p className="text-sm text-gray-500">{response.respondent_email}</p>
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(response.submitted_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {selectedResponse?.id === response.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                      {questions.map((q) => {
                        const answers = response.answers as Record<string, unknown>;
                        const answer = answers[q.id];
                        return (
                          <div key={q.id}>
                            <p className="text-xs font-medium text-gray-500 mb-1">
                              {q.text}
                            </p>
                            <p className="text-sm text-gray-900">
                              {Array.isArray(answer)
                                ? answer.join(", ")
                                : q.type === "rating"
                                ? `${answer}/5`
                                : String(answer || "—")}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
