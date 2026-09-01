"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2, Plus, Pencil, Trash2, Save, X, Lock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Child, Family, ParentCarer } from "@/lib/supabase/types";
import { updateFamilyAction, addChildAction, updateChildAction, deleteChildAction } from "./actions";

interface Props {
  family: Family;
  carer: ParentCarer;
  children: Child[];
}

const FAMILY_SUPPORT_OPTIONS = [
  "💛 Parenting support",
  "🌱 Child development",
  "🗣 Speech & language",
  "🧘 Emotional wellbeing",
  "🥗 Nutrition",
  "🎒 School readiness",
  "🤝 Social connection",
  "💷 Financial wellbeing",
  "🏃 Physical activity",
  "🎨 Creative activities",
  "🌍 Cultural & community activities",
  "👩🏾‍⚕️ Professional advice",
  "🏡 Housing & benefits",
  "🕊 Bereavement or grief",
];

const INTEREST_OPTIONS = [
  "🎨 Art & drawing",
  "🎵 Music & singing",
  "💃 Dance & movement",
  "🌱 Nature & outdoors",
  "🐛 Animals & bugs",
  "📚 Stories & books",
  "🧩 Puzzles & building",
  "⚽ Running & sport",
  "🚂 Cars, trains & vehicles",
  "🦖 Dinosaurs",
  "🌊 Water play",
  "🧸 Pretend & role play",
  "🍳 Cooking & food",
  "🔢 Numbers & shapes",
  "🌟 Sensory play",
  "🎭 Dressing up",
];

const SUPPORT_OPTIONS = [
  "🗣 Communication & words",
  "👫 Making friends",
  "😊 Confidence",
  "🧘 Big feelings",
  "🎯 Focus & attention",
  "🤝 Sharing & turn-taking",
  "👋 Separation from grown-up",
  "💤 Sleep & routine",
  "🍽 Mealtimes",
  "🚽 Toileting",
  "✋ Fine motor (grip, cutting)",
  "🏃 Gross motor (balance, climbing)",
  "🌍 Cultural identity & belonging",
];

const LANGUAGE_PRESETS = [
  "English",
  "Yoruba",
  "Igbo",
  "Twi",
  "Ga",
  "Swahili",
  "Somali",
  "Arabic",
  "French",
  "Portuguese",
  "Spanish",
  "Patois / Jamaican Creole",
  "BSL",
];

const DIETARY_PRESETS = [
  "Vegetarian",
  "Vegan",
  "Halal",
  "Kosher",
  "No pork",
  "No beef",
  "Dairy-free",
  "Gluten-free",
  "Nut-free",
];

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

function completeness(child: Child): number {
  const checks = [
    !!child.first_name,
    !!child.date_of_birth,
    (child.interests?.length ?? 0) > 0,
    (child.support_areas?.length ?? 0) > 0,
    !!child.nickname || !!child.pronouns,
    !!child.favourite_song || !!child.favourite_story || !!child.favourite_colour,
    (child.home_languages?.length ?? 0) > 0 || !!child.communication_notes,
    !!child.allergies || (child.dietary_preferences?.length ?? 0) > 0 || !!child.medical_notes,
    !!child.accessibility_requirements || !!child.sensory_sensitivities,
    !!child.comfort_item || !!child.soothing_strategies || !!child.typical_rest_window,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

export function FamilyEditor({ family, carer, children }: Props) {
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [addingChild, setAddingChild] = useState(children.length === 0);
  const [savingFamily, startSavingFamily] = useTransition();
  const [savingChild, startSavingChild] = useTransition();
  const [familySupport, setFamilySupport] = useState<string[]>(family?.support_areas ?? []);
  const [familySupportCustom, setFamilySupportCustom] = useState("");

  const addCustomSupport = () => {
    const v = familySupportCustom.trim();
    if (!v || familySupport.includes(v)) {
      setFamilySupportCustom("");
      return;
    }
    setFamilySupport([...familySupport, v]);
    setFamilySupportCustom("");
  };
  const familyExtras = familySupport.filter((v) => !FAMILY_SUPPORT_OPTIONS.includes(v));

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

          {/* Family support needs — shapes what we offer */}
          <div className="bg-brand-pale/30 rounded-xl border border-brand-blue/20 p-4 space-y-3">
            <div>
              <h3 className="font-heading font-bold text-brand-dark">
                What support would be useful for your family?
              </h3>
              <p className="text-xs text-brand-dark/60 mt-1 flex items-start gap-1.5">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                <span>
                  <span className="font-medium">Why we ask:</span> so we can plan future
                  sessions, workshops and partner referrals around what your community
                  actually needs. Tick as many as apply.
                </span>
              </p>
            </div>

            {familySupport.map((v) => (
              <input key={`fs-${v}`} type="hidden" name="family_support_areas" value={v} />
            ))}

            <div className="flex flex-wrap gap-2">
              {FAMILY_SUPPORT_OPTIONS.map((opt) => {
                const active = familySupport.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() =>
                      setFamilySupport(
                        active
                          ? familySupport.filter((v) => v !== opt)
                          : [...familySupport, opt],
                      )
                    }
                    className={`text-sm rounded-full px-3 py-1.5 border transition ${
                      active
                        ? "bg-brand-blue text-white border-brand-blue"
                        : "bg-white text-brand-dark border-brand-dark/20 hover:border-brand-blue"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
              {familyExtras.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setFamilySupport(familySupport.filter((v) => v !== e))}
                  className="text-sm rounded-full px-3 py-1.5 border bg-brand-blue text-white border-brand-blue"
                  title="Tap to remove"
                >
                  {e} <span className="opacity-75 ml-1">×</span>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={familySupportCustom}
                onChange={(e) => setFamilySupportCustom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomSupport();
                  }
                }}
                placeholder="Anything else? (e.g. legal advice, ESOL)"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addCustomSupport}
                disabled={!familySupportCustom.trim()}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>

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
        <div className="flex items-center justify-between mb-2">
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
        <p className="text-sm text-brand-dark/60 mb-5">
          The more we know, the better we can support each child from the moment they arrive. Only the basics are required — share the rest at your own pace.
        </p>

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
  const pct = completeness(child);
  const displayName = child.nickname ? `${child.first_name} (${child.nickname})` : child.first_name;

  return (
    <div className="border border-brand-dark/10 rounded-xl p-4 md:p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="font-heading font-bold text-lg text-brand-dark">{displayName}</p>
          <p className="text-sm text-brand-dark/70">
            {ageFromDob(child.date_of_birth)} old · born{" "}
            {new Date(child.date_of_birth).toLocaleDateString("en-GB")}
            {child.pronouns ? ` · ${child.pronouns}` : ""}
          </p>
        </div>
        <Button
          onClick={onEdit}
          size="sm"
          variant="outline"
          className="border-brand-dark/20 text-brand-dark hover:bg-brand-pale shrink-0"
        >
          <Pencil className="h-3.5 w-3.5 mr-1" />
          Edit
        </Button>
      </div>

      {/* Completeness bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-brand-dark/60 mb-1">
          <span>Profile {pct}% complete</span>
          {pct < 100 && <span className="italic">the more we know, the better we can help</span>}
        </div>
        <div className="h-1.5 bg-brand-dark/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-blue rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Interests preview */}
      {child.interests && child.interests.length > 0 && (
        <div className="mb-2">
          <div className="flex flex-wrap gap-1.5">
            {child.interests.slice(0, 6).map((i) => (
              <span
                key={i}
                className="text-xs bg-brand-pale/60 text-brand-dark rounded-full px-2 py-0.5"
              >
                {i}
              </span>
            ))}
            {child.interests.length > 6 && (
              <span className="text-xs text-brand-dark/50">+{child.interests.length - 6}</span>
            )}
          </div>
        </div>
      )}

      {/* Safety-critical snippets */}
      {(child.allergies || child.accessibility_requirements) && (
        <div className="mt-3 pt-3 border-t border-brand-dark/5 space-y-1">
          {child.allergies && (
            <p className="text-xs text-brand-dark/70">
              <span className="font-semibold">Allergies:</span> {child.allergies}
            </p>
          )}
          {child.accessibility_requirements && (
            <p className="text-xs text-brand-dark/70">
              <span className="font-semibold">Accessibility:</span>{" "}
              {child.accessibility_requirements}
            </p>
          )}
        </div>
      )}
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

  const [interests, setInterests] = useState<string[]>(child?.interests ?? []);
  const [supportAreas, setSupportAreas] = useState<string[]>(child?.support_areas ?? []);
  const [languages, setLanguages] = useState<string[]>(child?.home_languages ?? []);
  const [dietary, setDietary] = useState<string[]>(child?.dietary_preferences ?? []);

  const heading = useMemo(
    () => (mode === "add" ? "Tell us about your child" : `Editing ${child?.first_name}'s profile`),
    [mode, child?.first_name],
  );

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
      className="border border-brand-blue/40 rounded-xl p-4 md:p-6 space-y-6 bg-brand-pale/20"
    >
      <div>
        <h3 className="font-heading font-black text-lg text-brand-dark">{heading}</h3>
        <p className="text-sm text-brand-dark/60 mt-1">
          Only the first section is required. Fill the rest at your own pace — you can always come back and add more.
        </p>
      </div>

      {/* Hidden inputs so multi-chip arrays post correctly */}
      {interests.map((v) => (
        <input key={`i-${v}`} type="hidden" name="interests" value={v} />
      ))}
      {supportAreas.map((v) => (
        <input key={`s-${v}`} type="hidden" name="support_areas" value={v} />
      ))}
      {languages.map((v) => (
        <input key={`l-${v}`} type="hidden" name="home_languages" value={v} />
      ))}
      {dietary.map((v) => (
        <input key={`d-${v}`} type="hidden" name="dietary_preferences" value={v} />
      ))}

      {/* ── Section 1: The basics ───────────────────────── */}
      <Section
        title="The basics"
        why="So our team greets your child the way they know themselves at home."
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Nickname (what they like to be called)"
            name="nickname"
            defaultValue={child?.nickname ?? ""}
            placeholder="e.g. Ade, Bubba"
          />
          <SelectField
            label="Pronouns"
            name="pronouns"
            defaultValue={child?.pronouns ?? ""}
            options={[
              { value: "", label: "Prefer not to say" },
              { value: "she/her", label: "she / her" },
              { value: "he/him", label: "he / him" },
              { value: "they/them", label: "they / them" },
            ]}
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
      </Section>

      {/* ── Section 2: What they love ───────────────────── */}
      <Section
        title="What they love"
        why="So we can plan activities they'll light up for — and greet them with something familiar on day one."
      >
        <ChipPicker
          label="Interests"
          options={INTEREST_OPTIONS}
          selected={interests}
          onChange={setInterests}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field
            label="Favourite song"
            name="favourite_song"
            defaultValue={child?.favourite_song ?? ""}
            placeholder="e.g. Baby Shark"
          />
          <Field
            label="Favourite story or book"
            name="favourite_story"
            defaultValue={child?.favourite_story ?? ""}
            placeholder="e.g. The Gruffalo"
          />
          <Field
            label="Favourite colour"
            name="favourite_colour"
            defaultValue={child?.favourite_colour ?? ""}
            placeholder="e.g. yellow"
          />
        </div>
      </Section>

      {/* ── Section 3: Things they'd like support with ── */}
      <Section
        title="Things they'd like support with"
        why="So staff can gently weave these into play and celebrate the small wins with you."
      >
        <ChipPicker
          label="Support areas"
          options={SUPPORT_OPTIONS}
          selected={supportAreas}
          onChange={setSupportAreas}
        />
      </Section>

      {/* ── Section 4: Communication ────────────────────── */}
      <Section
        title="Communication"
        why="So every child feels understood — especially before they have the words."
      >
        <ChipMultiWithCustom
          label="Languages spoken at home"
          presets={LANGUAGE_PRESETS}
          selected={languages}
          onChange={setLanguages}
          addPlaceholder="Add another language"
        />
        <TextareaField
          label="How they communicate & what helps"
          name="communication_notes"
          defaultValue={child?.communication_notes ?? ""}
          placeholder="e.g. mostly signs and single words; says 'wa-wa' for water; taps my leg when overwhelmed."
        />
      </Section>

      {/* ── Section 5: Health & wellbeing ────────────────── */}
      <Section
        title="Health & wellbeing"
        why="Keeps your child safe at snack, craft and sensory play, and helps us avoid triggers."
        sensitive
      >
        <TextareaField
          label="Allergies"
          name="allergies"
          defaultValue={child?.allergies ?? ""}
          placeholder="Any food or environmental allergies we need to know about?"
        />
        <ChipMultiWithCustom
          label="Dietary preferences"
          presets={DIETARY_PRESETS}
          selected={dietary}
          onChange={setDietary}
          addPlaceholder="Add another preference"
        />
        <TextareaField
          label="Sensory sensitivities"
          name="sensory_sensitivities"
          defaultValue={child?.sensory_sensitivities ?? ""}
          placeholder="e.g. hand-dryers, loud claps, sticky textures, bright lights."
        />
        <TextareaField
          label="Medical notes or medications"
          name="medical_notes"
          defaultValue={child?.medical_notes ?? ""}
          placeholder="Anything a first-aider or session lead should know."
        />
      </Section>

      {/* ── Section 6: Accessibility ────────────────────── */}
      <Section
        title="Accessibility"
        why="So the room, the activities and our staff are ready before you arrive."
      >
        <TextareaField
          label="Accessibility requirements"
          name="accessibility_requirements"
          defaultValue={child?.accessibility_requirements ?? ""}
          placeholder="Mobility, sight, hearing, neurodivergence, EHCP — anything the space needs to accommodate."
        />
      </Section>

      {/* ── Section 7: Routines & comfort ───────────────── */}
      <Section
        title="Routines & comfort"
        why="So if your child needs a reset, we know what actually helps rather than guessing."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Comfort item"
            name="comfort_item"
            defaultValue={child?.comfort_item ?? ""}
            placeholder="e.g. dummy, teddy called 'Bear'"
          />
          <Field
            label="Typical nap or rest window"
            name="typical_rest_window"
            defaultValue={child?.typical_rest_window ?? ""}
            placeholder="e.g. 12:30–14:00"
          />
        </div>
        <TextareaField
          label="What helps when they're overwhelmed"
          name="soothing_strategies"
          defaultValue={child?.soothing_strategies ?? ""}
          placeholder="e.g. quiet corner, being carried, warm water, a song."
        />
        <TextareaField
          label="Anything they're afraid of"
          name="fears"
          defaultValue={child?.fears ?? ""}
          placeholder="e.g. dogs, dark rooms, sudden loud sounds."
        />
      </Section>

      {/* ── Section 8: Anything else ────────────────────── */}
      <Section
        title="Anything else"
        why="You're the expert on your child. Anything at all we should know."
      >
        <TextareaField
          label="Notes for our team"
          name="parent_notes"
          defaultValue={child?.parent_notes ?? ""}
          placeholder="Anything else you'd like us to understand."
        />
      </Section>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-brand-dark/10 pt-4">
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

function Section({
  title,
  why,
  sensitive,
  children,
}: {
  title: string;
  why: string;
  sensitive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/70 rounded-xl border border-brand-dark/10 p-4 md:p-5 space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <h4 className="font-heading font-bold text-brand-dark">{title}</h4>
          {sensitive && (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide bg-brand-blue/10 text-brand-blue rounded-full px-2 py-0.5">
              <Lock className="h-2.5 w-2.5" />
              Staff only
            </span>
          )}
        </div>
        <p className="text-xs text-brand-dark/60 mt-1 flex items-start gap-1.5">
          <Info className="h-3 w-3 mt-0.5 shrink-0" />
          <span>
            <span className="font-medium">Why we ask:</span> {why}
          </span>
        </p>
      </div>
      {children}
    </div>
  );
}

function ChipPicker({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const set = new Set(selected);
  return (
    <div>
      <label className="block text-sm font-medium text-brand-dark mb-2">
        {label} <span className="text-brand-dark/50 font-normal">— tap to add</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = set.has(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() =>
                onChange(active ? selected.filter((v) => v !== opt) : [...selected, opt])
              }
              className={`text-sm rounded-full px-3 py-1.5 border transition ${
                active
                  ? "bg-brand-blue text-white border-brand-blue"
                  : "bg-white text-brand-dark border-brand-dark/20 hover:border-brand-blue"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChipMultiWithCustom({
  label,
  presets,
  selected,
  onChange,
  addPlaceholder,
}: {
  label: string;
  presets: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  addPlaceholder: string;
}) {
  const [draft, setDraft] = useState("");
  const set = new Set(selected);

  const addDraft = () => {
    const v = draft.trim();
    if (!v || set.has(v)) {
      setDraft("");
      return;
    }
    onChange([...selected, v]);
    setDraft("");
  };

  const extras = selected.filter((v) => !presets.includes(v));

  return (
    <div>
      <label className="block text-sm font-medium text-brand-dark mb-2">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {presets.map((p) => {
          const active = set.has(p);
          return (
            <button
              key={p}
              type="button"
              onClick={() =>
                onChange(active ? selected.filter((v) => v !== p) : [...selected, p])
              }
              className={`text-sm rounded-full px-3 py-1.5 border transition ${
                active
                  ? "bg-brand-blue text-white border-brand-blue"
                  : "bg-white text-brand-dark border-brand-dark/20 hover:border-brand-blue"
              }`}
            >
              {p}
            </button>
          );
        })}
        {extras.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onChange(selected.filter((v) => v !== e))}
            className="text-sm rounded-full px-3 py-1.5 border bg-brand-blue text-white border-brand-blue"
            title="Tap to remove"
          >
            {e} <span className="opacity-75 ml-1">×</span>
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addDraft();
            }
          }}
          placeholder={addPlaceholder}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addDraft}
          disabled={!draft.trim()}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
    </div>
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
