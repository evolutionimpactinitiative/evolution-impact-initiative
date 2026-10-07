"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendChatMessage } from "@/lib/chat/send-message";

async function requireCarer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: carer } = await (admin as any)
    .from("parent_carers")
    .select("id, name, family_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!carer) throw new Error("No family record for this account");
  return { user, carer };
}

export async function familySendMessage(formData: FormData) {
  const body = (formData.get("body") as string | null)?.trim();
  if (!body) return;

  const { carer } = await requireCarer();

  await sendChatMessage({
    sender: {
      kind: "family",
      familyId: carer.family_id,
      carerId: carer.id,
      carerName: carer.name,
    },
    body,
  });

  revalidatePath("/portal/messages");
  revalidatePath("/portal");
}

export async function familyMarkThreadRead() {
  const { user, carer } = await requireCarer();
  const admin = createAdminClient();

  // 1. Find the thread.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: thread } = await (admin as any)
    .from("chat_threads")
    .select("id")
    .eq("family_id", carer.family_id)
    .maybeSingle();
  if (!thread) return;

  const now = new Date().toISOString();

  // 2. Stamp read_by_family_at on every team message in that thread
  //    that isn't already read.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from("chat_messages")
    .update({ read_by_family_at: now })
    .eq("thread_id", thread.id)
    .eq("sender_type", "team")
    .is("read_by_family_at", null);

  // 3. Mark the viewer's chat notifications as read.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from("notifications")
    .update({ read_at: now })
    .eq("user_id", user.id)
    .eq("type", "chat_message")
    .is("read_at", null);

  revalidatePath("/portal");
  revalidatePath("/portal/messages");
}
