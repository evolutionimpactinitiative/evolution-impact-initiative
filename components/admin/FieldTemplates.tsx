"use client";

import type { CustomField } from "@/lib/supabase/types";

// Predefined field templates for common registration form fields
export const fieldTemplates: Omit<CustomField, "id">[] = [
  {
    type: "text",
    label: "Emergency Contact Name",
    required: true,
    placeholder: "Name of emergency contact",
  },
  {
    type: "text",
    label: "Emergency Contact Phone",
    required: true,
    placeholder: "Phone number for emergencies",
  },
  {
    type: "select",
    label: "Dietary Requirements",
    required: false,
    options: ["None", "Vegetarian", "Vegan", "Halal", "Gluten-free", "Dairy-free", "Other"],
  },
  {
    type: "textarea",
    label: "Medical Conditions / Allergies",
    required: false,
    placeholder: "Please list any medical conditions or allergies we should be aware of...",
  },
  {
    type: "select",
    label: "T-Shirt Size",
    required: false,
    options: ["XS", "S", "M", "L", "XL", "XXL"],
  },
  {
    type: "text",
    label: "School / Organization",
    required: false,
    placeholder: "Name of school or organization",
  },
  {
    type: "checkbox",
    label: "Swimming Ability Confirmed",
    required: true,
  },
  {
    type: "select",
    label: "Experience Level",
    required: false,
    options: ["Beginner", "Intermediate", "Advanced"],
  },
  {
    type: "textarea",
    label: "Additional Notes",
    required: false,
    placeholder: "Any additional information you'd like to share...",
  },
];

interface FieldTemplatesProps {
  onAddTemplate: (template: Omit<CustomField, "id">) => void;
}

export function FieldTemplates({ onAddTemplate }: FieldTemplatesProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Quick Add Templates</label>
      <div className="flex flex-wrap gap-2">
        {fieldTemplates.map((template, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onAddTemplate(template)}
            className="text-xs px-3 py-1.5 bg-brand-pale text-brand-blue rounded-full hover:bg-brand-blue hover:text-white transition-colors"
          >
            + {template.label}
          </button>
        ))}
      </div>
    </div>
  );
}
