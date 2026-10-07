"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Pref = "per_post" | "daily_digest" | "never";

export async function updateVillageEmailPref(pref: Pref) {
  if (!["per_post", "daily_digest", "never"].includes(pref)) {
    throw new Error("Invalid preference");
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("parent_carers")
    .update({ village_email_pref: pref })
    .eq("user_id", user.id);
  if (error) throw error;

  revalidatePath("/portal/family");
}
