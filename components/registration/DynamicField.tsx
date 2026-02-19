"use client";

import type { CustomField } from "@/lib/supabase/types";

interface DynamicFieldProps {
  field: CustomField;
  value: string | boolean | number;
  onChange: (value: string | boolean | number) => void;
}

export function DynamicField({ field, value, onChange }: DynamicFieldProps) {
  const inputClassName =
    "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent";

  switch (field.type) {
    case "text":
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={inputClassName}
            required={field.required}
          />
        </div>
      );

    case "textarea":
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <textarea
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className={`${inputClassName} resize-none`}
            required={field.required}
          />
        </div>
      );

    case "select":
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <select
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            className={inputClassName}
            required={field.required}
          >
            <option value="">Select an option</option>
            {(field.options || []).map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );

    case "checkbox":
      return (
        <div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={value as boolean}
              onChange={(e) => onChange(e.target.checked)}
              className="w-5 h-5 mt-0.5 text-brand-blue rounded focus:ring-brand-blue border-gray-300"
              required={field.required}
            />
            <span className="text-sm text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </span>
          </label>
        </div>
      );

    case "number":
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="number"
            value={value as number}
            onChange={(e) => onChange(parseInt(e.target.value) || 0)}
            placeholder={field.placeholder}
            className={inputClassName}
            required={field.required}
          />
        </div>
      );

    default:
      return null;
  }
}
