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

export async function addChildAction(formData: FormData) {
  const { supabase, user } = await requireUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: carer } = await (supabase as any)
    .from("parent_carers")
    .select("family_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!carer) throw new Error("No family found for this account");

  const first_name = (formData.get("first_name") as string | null)?.trim();
  const date_of_birth = (formData.get("date_of_birth") as string | null)?.trim();

  if (!first_name || !date_of_birth) {
    throw new Error("Name and date of birth are required.");
  }

  const sex_at_birth = (formData.get("sex_at_birth") as string | null) || null;
  const allergies = (formData.get("allergies") as string | null)?.trim() || null;
  const accessibility_requirements = (formData.get("accessibility_requirements") as string | null)?.trim() || null;
  const parent_notes = (formData.get("parent_notes") as string | null)?.trim() || null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("children").insert({
    family_id: carer.family_id,
    first_name,
    date_of_birth,
    sex_at_birth,
    allergies,
    accessibility_requirements,
    parent_notes,
  });
  if (error) throw error;

  revalidatePath("/portal/family");
}

export async function updateChildAction(formData: FormData) {
  const { supabase } = await requireUser();
  const id = formData.get("id") as string | null;
  if (!id) throw new Error("Missing child id");

  const first_name = (formData.get("first_name") as string | null)?.trim();
  const date_of_birth = (formData.get("date_of_birth") as string | null)?.trim();

  if (!first_name || !date_of_birth) {
    throw new Error("Name and date of birth are required.");
  }

  const sex_at_birth = (formData.get("sex_at_birth") as string | null) || null;
  const allergies = (formData.get("allergies") as string | null)?.trim() || null;
  const accessibility_requirements = (formData.get("accessibility_requirements") as string | null)?.trim() || null;
  const parent_notes = (formData.get("parent_notes") as string | null)?.trim() || null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("children")
    .update({
      first_name,
      date_of_birth,
      sex_at_birth,
      allergies,
      accessibility_requirements,
      parent_notes,
    })
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
