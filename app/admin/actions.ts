"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function checkInChild(childId: string, attended: boolean, eventId: string) {
  const supabase = createAdminClient();

  const { error, data } = await supabase
    .from("registration_children")
    .update({
      attended,
      check_in_time: attended ? new Date().toISOString() : null,
    })
    .eq("id", childId)
    .select();

  if (error) {
    console.error("Check-in error:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/admin/events/${eventId}/check-in`);
  return { success: true, data };
}

export async function checkInAllChildren(childIds: string[], eventId: string) {
  const supabase = createAdminClient();
  const checkInTime = new Date().toISOString();

  for (const childId of childIds) {
    const { error } = await supabase
      .from("registration_children")
      .update({
        attended: true,
        check_in_time: checkInTime,
      })
      .eq("id", childId);

    if (error) {
      console.error("Check-in error for child:", childId, error);
    }
  }

  revalidatePath(`/admin/events/${eventId}/check-in`);
  return { success: true };
}
