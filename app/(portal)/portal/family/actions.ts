"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

export async function updateFamilyAction(formData: FormData) {
  const { supabase, user } = await requireUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: carer } = await (supabase as any)
    .from("parent_carers")
    .select("id, family_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!carer) throw new Error("No family found for this account");

  const postcode = (formData.get("postcode") as string | null)?.trim() || null;
  const preferred_contact_method = (formData.get("preferred_contact_method") as string | null) || null;
  const preferred_language = (formData.get("preferred_language") as string | null)?.trim() || null;
  const accessibility_requirements = (formData.get("accessibility_requirements") as string | null)?.trim() || null;
  const photo_video_consent = formData.get("photo_video_consent") === "on";
  const support_areas = formData
    .getAll("family_support_areas")
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);

  const name = (formData.get("name") as string | null)?.trim();
  const phone = (formData.get("phone") as string | null)?.trim() || null;
  const relationship_to_child = (formData.get("relationship_to_child") as string | null) || null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: familyErr } = await (supabase as any)
    .from("families")
    .update({
      postcode,
      preferred_contact_method,
      preferred_language,
      accessibility_requirements,
      photo_video_consent,
      support_areas,
    })
    .eq("id", carer.family_id);
  if (familyErr) throw familyErr;

  if (name) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: carerErr } = await (supabase as any)
      .from("parent_carers")
      .update({ name, phone, relationship_to_child })
      .eq("id", carer.id);
    if (carerErr) throw carerErr;
  }

  revalidatePath("/portal/family");
}

function text(formData: FormData, name: string): string | null {
  const v = (formData.get(name) as string | null)?.trim();
  return v ? v : null;
}

function multi(formData: FormData, name: string): string[] {
  return formData
    .getAll(name)
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);
}

function buildChildPayload(formData: FormData) {
  const first_name = text(formData, "first_name");
  const date_of_birth = text(formData, "date_of_birth");
  if (!first_name || !date_of_birth) {
    throw new Error("Name and date of birth are required.");
  }

  return {
    first_name,
    date_of_birth,
    sex_at_birth: text(formData, "sex_at_birth"),
    nickname: text(formData, "nickname"),
    pronouns: text(formData, "pronouns"),
    favourite_song: text(formData, "favourite_song"),
    favourite_story: text(formData, "favourite_story"),
    favourite_colour: text(formData, "favourite_colour"),
    interests: multi(formData, "interests"),
    support_areas: multi(formData, "support_areas"),
    home_languages: multi(formData, "home_languages"),
    dietary_preferences: multi(formData, "dietary_preferences"),
    communication_notes: text(formData, "communication_notes"),
    allergies: text(formData, "allergies"),
    sensory_sensitivities: text(formData, "sensory_sensitivities"),
    medical_notes: text(formData, "medical_notes"),
    accessibility_requirements: text(formData, "accessibility_requirements"),
    comfort_item: text(formData, "comfort_item"),
    soothing_strategies: text(formData, "soothing_strategies"),
    fears: text(formData, "fears"),
    typical_rest_window: text(formData, "typical_rest_window"),
    parent_notes: text(formData, "parent_notes"),
  };
}

export async function addChildAction(formData: FormData) {
  const { supabase, user } = await requireUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: carer } = await (supabase as any)
    .from("parent_carers")
    .select("family_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!carer) throw new Error("No family found for this account");

  const payload = buildChildPayload(formData);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("children").insert({
    family_id: carer.family_id,
    ...payload,
  });
  if (error) throw error;

  revalidatePath("/portal/family");
}

export async function updateChildAction(formData: FormData) {
  const { supabase } = await requireUser();
  const id = formData.get("id") as string | null;
  if (!id) throw new Error("Missing child id");

  const payload = buildChildPayload(formData);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("children")
    .update(payload)
    .eq("id", id);
  if (error) throw error;

  revalidatePath("/portal/family");
}

export async function deleteChildAction(id: string) {
  const { supabase } = await requireUser();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("children").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/portal/family");
}
