"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CustomField, CustomFieldType } from "@/lib/supabase/types";
import { FieldTemplates } from "./FieldTemplates";

interface CustomFieldsBuilderProps {
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
}

const fieldTypeOptions: { value: CustomFieldType; label: string }[] = [
  { value: "text", label: "Text Input" },
  { value: "textarea", label: "Text Area" },
  { value: "select", label: "Dropdown Select" },
  { value: "checkbox", label: "Checkbox" },
  { value: "number", label: "Number" },
];

export function CustomFieldsBuilder({ fields, onChange }: CustomFieldsBuilderProps) {
  const [expandedField, setExpandedField] = useState<string | null>(null);

  const generateId = () => `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addField = (template?: Omit<CustomField, "id">) => {
    const newField: CustomField = template
      ? { ...template, id: generateId() }
      : {
          id: generateId(),
          type: "text",
          label: "",
          required: false,
          placeholder: "",
        };
    onChange([...fields, newField]);
    setExpandedField(newField.id);
  };

  const updateField = (id: string, updates: Partial<CustomField>) => {
    onChange(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const removeField = (id: string) => {
    onChange(fields.filter((f) => f.id !== id));
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= fields.length) return;
    const newFields = [...fields];
    const [removed] = newFields.splice(fromIndex, 1);
    newFields.splice(toIndex, 0, removed);
    onChange(newFields);
  };

  const updateOptions = (id: string, optionsText: string) => {
    const options = optionsText
      .split("\n")
      .map((o) => o.trim())
      .filter((o) => o.length > 0);
    updateField(id, { options });
  };

  return (
    <div className="space-y-6">
      <FieldTemplates onAddTemplate={(template) => addField(template)} />

      {/* Fields list */}
      <div className="space-y-3">
        {fields.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500 mb-3">No custom fields added yet</p>
            <Button type="button" variant="outline" size="sm" onClick={() => addField()}>
              <Plus className="w-4 h-4 mr-1" />
              Add Custom Field
            </Button>
          </div>
        ) : (
          fields.map((field, index) => (
            <div
              key={field.id}
              className="border border-gray-200 rounded-lg bg-white overflow-hidden"
            >
              {/* Field header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
                <button
                  type="button"
                  className="cursor-grab text-gray-400 hover:text-gray-600"
                  title="Drag to reorder"
                >
                  <GripVertical className="w-4 h-4" />
                </button>

                <div className="flex-1">
                  <span className="font-medium text-gray-700">
                    {field.label || "(Untitled field)"}
                  </span>
                  <span className="text-xs text-gray-400 ml-2 capitalize">
                    {fieldTypeOptions.find((t) => t.value === field.type)?.label || field.type}
                  </span>
                  {field.required && (
                    <span className="text-xs text-red-500 ml-2">Required</span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => moveField(index, index - 1)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  )}
                  {index < fields.length - 1 && (
                    <button
                      type="button"
                      onClick={() => moveField(index, index + 1)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedField(expandedField === field.id ? null : field.id)
                    }
                    className="p-1 text-brand-blue hover:text-brand-dark"
                  >
                    {expandedField === field.id ? "Collapse" : "Edit"}
                  </button>

                  <button
                    type="button"
                    onClick={() => removeField(field.id)}
                    className="p-1 text-gray-400 hover:text-red-500"
                    title="Delete field"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Field editor (expanded) */}
              {expandedField === field.id && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Field Label <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent text-sm"
                        placeholder="e.g., Emergency Contact Phone"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Field Type
                      </label>
                      <select
                        value={field.type}
                        onChange={(e) =>
                          updateField(field.id, {
                            type: e.target.value as CustomFieldType,
                            options: e.target.value === "select" ? ["Option 1", "Option 2"] : undefined,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent text-sm"
                      >
                        {fieldTypeOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {field.type !== "checkbox" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Placeholder Text
                      </label>
                      <input
                        type="text"
                        value={field.placeholder || ""}
                        onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent text-sm"
                        placeholder="Hint text shown in the field"
                      />
                    </div>
                  )}

                  {field.type === "select" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Options (one per line)
                      </label>
                      <textarea
                        value={(field.options || []).join("\n")}
                        onChange={(e) => updateOptions(field.id, e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent text-sm"
                        placeholder="Option 1&#10;Option 2&#10;Option 3"
                      />
                    </div>
                  )}

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(field.id, { required: e.target.checked })}
                        className="w-4 h-4 text-brand-blue rounded focus:ring-brand-blue"
                      />
                      <span className="text-sm text-gray-700">This field is required</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add field button */}
      {fields.length > 0 && (
        <Button type="button" variant="outline" onClick={() => addField()}>
          <Plus className="w-4 h-4 mr-1" />
          Add Custom Field
        </Button>
      )}
    </div>
  );
}
