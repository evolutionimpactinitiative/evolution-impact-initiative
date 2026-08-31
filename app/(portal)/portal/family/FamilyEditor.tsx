"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Child, Family, ParentCarer } from "@/lib/supabase/types";
import { updateFamilyAction, addChildAction, updateChildAction, deleteChildAction } from "./actions";

interface Props {
  family: Family;
  carer: ParentCarer;
  children: Child[];
}

function ageFromDob(dob: string): string {
  const d = new Date(dob);
  const now = new Date();
  const months =
    (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth()) -
    (now.getDate() < d.getDate() ? 1 : 0);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"}`;
}

export function FamilyEditor({ family, carer, children }: Props) {
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [addingChild, setAddingChild] = useState(children.length === 0);
  const [savingFamily, startSavingFamily] = useTransition();
  const [savingChild, startSavingChild] = useTransition();

  return (
    <div className="space-y-8">
      {/* Parent + Family */}
      <section className="bg-white rounded-2xl shadow-sm border border-brand-dark/10 p-6 md:p-8">
        <h2 className="font-heading font-black text-xl text-brand-dark mb-4">
          You &amp; your family
        </h2>
        <form
          action={(fd) => startSavingFamily(() => updateFamilyAction(fd))}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Your name"
              name="name"
              defaultValue={carer.name}
              required
            />
            <Field label="Phone" name="phone" defaultValue={carer.phone ?? ""} type="tel" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Your relationship to your child"
              name="relationship_to_child"
              defaultValue={carer.relationship_to_child ?? ""}
              options={[
                { value: "", label: "Prefer not to say" },
                { value: "mother", label: "Mother" },
                { value: "father", label: "Father" },
                { value: "carer", label: "Carer" },
                { value: "grandparent", label: "Grandparent" },
                { value: "guardian", label: "Guardian" },
                { value: "other", label: "Other" },
              ]}
            />
            <Field
              label="Postcode"
              name="postcode"
              defaultValue={family?.postcode ?? ""}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Preferred contact method"
              name="preferred_contact_method"
              defaultValue={family?.preferred_contact_method ?? "email"}
              options={[
                { value: "email", label: "Email" },
                { value: "phone", label: "Phone call" },
                { value: "sms", label: "SMS" },
                { value: "whatsapp", label: "WhatsApp" },
              ]}
            />
            <Field
              label="Preferred language"
              name="preferred_language"
              defaultValue={family?.preferred_language ?? ""}
              placeholder="e.g. English"
            />
          </div>

          <TextareaField
            label="Accessibility requirements"
            name="accessibility_requirements"
            defaultValue={family?.accessibility_requirements ?? ""}
            placeholder="Anything we should know to make sessions accessible for your family?"
          />

          <label className="flex items-start gap-2 text-sm text-brand-dark cursor-pointer">
            <input
              type="checkbox"
              name="photo_video_consent"
              defaultChecked={family?.photo_video_consent ?? false}
              className="mt-1"
            />
            <span>
              I&rsquo;m happy for photos or short videos of my family at Growing Together sessions to
              be used by Evolution Impact Initiative for programme reporting and communications. You can override this per session at registration.
            </span>
          </label>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={savingFamily}
              className="bg-brand-blue hover:bg-brand-dark text-white font-heading font-bold"
            >
              {savingFamily ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save my details
                </>
              )}
            </Button>
          </div>
        </form>
      </section>

      {/* Children */}
      <section className="bg-white rounded-2xl shadow-sm border border-brand-dark/10 p-6 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-black text-xl text-brand-dark">Your children</h2>
          {!addingChild && (
            <Button
              onClick={() => setAddingChild(true)}
              size="sm"
              variant="outline"
              className="border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add a child
            </Button>
          )}
        </div>

        {children.length === 0 && !addingChild && (
          <p className="text-sm text-brand-dark/70">
            No children yet. Add your first child to get started.
          </p>
        )}

        <div className="space-y-4">
          {children.map((child) =>
            editingChildId === child.id ? (
              <ChildForm
                key={child.id}
                mode="edit"
                child={child}
                onCancel={() => setEditingChildId(null)}
                onSaved={() => setEditingChildId(null)}
                onDelete={() =>
                  startSavingChild(async () => {
                    await deleteChildAction(child.id);
                    setEditingChildId(null);
                  })
                }
                deleting={savingChild}
              />
            ) : (
              <ChildCard
                key={child.id}
                child={child}
                onEdit={() => setEditingChildId(child.id)}
              />
            ),
          )}

          {addingChild && (
            <ChildForm
              mode="add"
              onCancel={() => setAddingChild(false)}
              onSaved={() => setAddingChild(false)}
            />
          )}
        </div>
      </section>
    </div>
  );
}

function ChildCard({ child, onEdit }: { child: Child; onEdit: () => void }) {
  return (
    <div className="border border-brand-dark/10 rounded-xl p-4 flex items-start justify-between gap-4">
      <div>
        <p className="font-heading font-bold text-lg text-brand-dark">{child.first_name}</p>
        <p className="text-sm text-brand-dark/70">
          {ageFromDob(child.date_of_birth)} old · born{" "}
          {new Date(child.date_of_birth).toLocaleDateString("en-GB")}
        </p>
        {child.allergies && (
          <p className="text-xs text-brand-dark/60 mt-2">
            <span className="font-semibold">Allergies:</span> {child.allergies}
          </p>
        )}
        {child.accessibility_requirements && (
          <p className="text-xs text-brand-dark/60 mt-1">
            <span className="font-semibold">Accessibility:</span>{" "}
            {child.accessibility_requirements}
          </p>
        )}
      </div>
      <Button
        onClick={onEdit}
        size="sm"
        variant="outline"
        className="border-brand-dark/20 text-brand-dark hover:bg-brand-pale"
      >
        <Pencil className="h-3.5 w-3.5 mr-1" />
        Edit
      </Button>
    </div>
  );
}

interface ChildFormProps {
  mode: "add" | "edit";
  child?: Child;
  onCancel: () => void;
  onSaved: () => void;
  onDelete?: () => void;
  deleting?: boolean;
}

function ChildForm({ mode, child, onCancel, onSaved, onDelete, deleting }: ChildFormProps) {
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(fd) => {
        setError(null);
        startSaving(async () => {
          try {
            if (mode === "add") {
              await addChildAction(fd);
            } else {
              fd.set("id", child!.id);
              await updateChildAction(fd);
            }
            onSaved();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not save.");
          }
        });
      }}
      className="border border-brand-blue/40 rounded-xl p-4 md:p-5 space-y-4 bg-brand-pale/20"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field
          label="First name"
          name="first_name"
          defaultValue={child?.first_name ?? ""}
          required
        />
        <Field
          label="Date of birth"
          name="date_of_birth"
          defaultValue={child?.date_of_birth ?? ""}
          type="date"
          required
        />
      </div>

      <SelectField
        label="Sex at birth (optional)"
        name="sex_at_birth"
        defaultValue={child?.sex_at_birth ?? ""}
        options={[
          { value: "", label: "Prefer not to say" },
          { value: "female", label: "Female" },
          { value: "male", label: "Male" },
          { value: "other", label: "Other" },
        ]}
      />

      <TextareaField
        label="Allergies"
        name="allergies"
        defaultValue={child?.allergies ?? ""}
        placeholder="Any food or environmental allergies we should know about?"
      />

      <TextareaField
        label="Accessibility requirements"
        name="accessibility_requirements"
        defaultValue={child?.accessibility_requirements ?? ""}
        placeholder="Anything that helps us make sessions accessible for this child."
      />

      <TextareaField
        label="Parent notes (optional)"
        name="parent_notes"
        defaultValue={child?.parent_notes ?? ""}
        placeholder="Anything else you'd like us to know."
      />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        {mode === "edit" && onDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm("Remove this child from your family? This cannot be undone.")) {
                onDelete();
              }
            }}
            disabled={deleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Remove
          </Button>
        ) : (
          <span />
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={saving}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={saving}
            className="bg-brand-blue hover:bg-brand-dark text-white font-heading font-bold"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" />
                {mode === "add" ? "Add child" : "Save changes"}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-brand-dark mb-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
      />
    </div>
  );
}

function TextareaField({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-brand-dark mb-1">{label}</label>
      <textarea
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={2}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-brand-dark mb-1">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
