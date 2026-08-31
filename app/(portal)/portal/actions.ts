"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function cancelRegistrationAction(registrationId: string, reason?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: carer } = await (supabase as any)
    .from("parent_carers")
    .select("family_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!carer) throw new Error("No family found");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reg } = await (supabase as any)
    .from("registrations")
    .select("id, family_id, status")
    .eq("id", registrationId)
    .maybeSingle();
  if (!reg) throw new Error("Registration not found");
  if (reg.family_id !== carer.family_id) throw new Error("Not your family's registration");
  if (reg.status === "cancelled") return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("registrations")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason?.trim() || "Cancelled by parent",
    })
    .eq("id", registrationId);
  if (error) throw error;

  revalidatePath("/portal");
  revalidatePath(`/portal/registrations/${registrationId}`);
}
