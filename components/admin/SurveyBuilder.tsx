"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Trash2,
  GripVertical,
  Star,
  List,
  CheckSquare,
  AlignLeft,
  ToggleLeft,
} from "lucide-react";
import type { SurveyQuestion, SurveyQuestionType } from "@/lib/supabase/types";

interface SurveyBuilderProps {
  questions: SurveyQuestion[];
  onChange: (questions: SurveyQuestion[]) => void;
}

const questionTypeIcons: Record<SurveyQuestionType, typeof Star> = {
  rating: Star,
  multiple_choice: List,
  multi_select: CheckSquare,
  text: AlignLeft,
  yes_no: ToggleLeft,
};

const questionTypeLabels: Record<SurveyQuestionType, string> = {
  rating: "Rating (1-5)",
  multiple_choice: "Multiple Choice",
  multi_select: "Multi-Select",
  text: "Text Response",
  yes_no: "Yes/No",
};

export function SurveyBuilder({ questions, onChange }: SurveyBuilderProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const generateId = () => `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addQuestion = (type: SurveyQuestionType) => {
    const newQuestion: SurveyQuestion = {
      id: generateId(),
      type,
      text: "",
      required: false,
      options: type === "rating" ? { min: 1, max: 5 } : type === "yes_no" ? undefined : [],
    };
    onChange([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updates: Partial<SurveyQuestion>) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const removeQuestion = (index: number) => {
    onChange(questions.filter((_, i) => i !== index));
  };

  const moveQuestion = (fromIndex: number, toIndex: number) => {
    const updated = [...questions];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    onChange(updated);
  };

  const addOption = (questionIndex: number) => {
    const question = questions[questionIndex];
    if (Array.isArray(question.options)) {
      updateQuestion(questionIndex, {
        options: [...question.options, ""],
      });
    }
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const question = questions[questionIndex];
    if (Array.isArray(question.options)) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionIndex, { options: newOptions });
    }
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const question = questions[questionIndex];
    if (Array.isArray(question.options)) {
      updateQuestion(questionIndex, {
        options: question.options.filter((_, i) => i !== optionIndex),
      });
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      moveQuestion(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-6">
      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((question, index) => {
          const Icon = questionTypeIcons[question.type];
          return (
            <div
              key={question.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`bg-white border rounded-lg p-4 ${
                draggedIndex === index ? "opacity-50 border-brand-blue" : "border-gray-200"
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  className="cursor-grab p-1 text-gray-400 hover:text-gray-600 mt-1"
                  title="Drag to reorder"
                >
                  <GripVertical className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded text-sm text-gray-600">
                  <Icon className="w-4 h-4" />
                  <span>{questionTypeLabels[question.type]}</span>
                </div>

                <div className="flex-1">
                  <Input
                    value={question.text}
                    onChange={(e) => updateQuestion(index, { text: e.target.value })}
                    placeholder="Enter your question..."
                    className="font-medium"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={question.required}
                    onChange={(e) => updateQuestion(index, { required: e.target.checked })}
                    className="rounded text-brand-blue"
                  />
                  Required
                </label>

                <button
                  type="button"
                  onClick={() => removeQuestion(index)}
                  className="p-1 text-gray-400 hover:text-red-500"
                  title="Remove question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Question Options (for multiple choice and multi-select) */}
              {(question.type === "multiple_choice" || question.type === "multi_select") && (
                <div className="mt-4 ml-8 space-y-2">
                  {Array.isArray(question.options) &&
                    question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 flex-shrink-0 border border-gray-300 ${
                            question.type === "multiple_choice" ? "rounded-full" : "rounded"
                          }`}
                        />
                        <Input
                          value={option}
                          onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                          placeholder={`Option ${optionIndex + 1}`}
                          className="flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(index, optionIndex)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addOption(index)}
                    className="text-brand-blue"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Option
                  </Button>
                </div>
              )}

              {/* Rating Preview */}
              {question.type === "rating" && (
                <div className="mt-4 ml-8 flex items-center gap-2">
                  <span className="text-sm text-gray-500">Preview:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="w-6 h-6 text-gray-300 hover:text-yellow-400 cursor-pointer"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Yes/No Preview */}
              {question.type === "yes_no" && (
                <div className="mt-4 ml-8 flex items-center gap-4">
                  <span className="text-sm text-gray-500">Preview:</span>
                  <label className="flex items-center gap-2">
                    <input type="radio" name={`preview_${question.id}`} disabled />
                    <span className="text-sm">Yes</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name={`preview_${question.id}`} disabled />
                    <span className="text-sm">No</span>
                  </label>
                </div>
              )}

              {/* Text Preview */}
              {question.type === "text" && (
                <div className="mt-4 ml-8">
                  <span className="text-sm text-gray-500 block mb-2">Preview:</span>
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 text-gray-400 text-sm">
                    Respondent will enter text here...
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Question Buttons */}
      <div className="border-2 border-dashed border-gray-200 rounded-lg p-6">
        <p className="text-sm text-gray-500 text-center mb-4">Add a question</p>
        <div className="flex flex-wrap justify-center gap-2">
          {(Object.keys(questionTypeLabels) as SurveyQuestionType[]).map((type) => {
            const Icon = questionTypeIcons[type];
            return (
              <Button
                key={type}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addQuestion(type)}
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                {questionTypeLabels[type]}
              </Button>
            );
          })}
        </div>
      </div>

      {questions.length === 0 && (
        <p className="text-center text-gray-500 text-sm">
          No questions added yet. Click a button above to add your first question.
        </p>
      )}
    </div>
  );
}
