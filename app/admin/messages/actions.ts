"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendChatMessage } from "@/lib/chat/send-message";

async function requireTeamMember() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tm } = await (admin as any)
    .from("team_members")
    .select("id, name, email")
    .eq("email", user.email || "")
    .maybeSingle();
  if (!tm) throw new Error("Team members only");
  return tm as { id: string; name: string; email: string };
}

export async function adminReply(threadId: string, formData: FormData) {
  const body = (formData.get("body") as string | null)?.trim();
  if (!body) return;

  const tm = await requireTeamMember();
  const admin = createAdminClient();

  // Resolve the family for this thread.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: thread } = await (admin as any)
    .from("chat_threads")
    .select("id, family_id, assigned_admin_id")
    .eq("id", threadId)
    .maybeSingle();
  if (!thread) throw new Error("Thread not found");

  // Auto-assign on first reply if unassigned ("first to reply gets it").
  if (!thread.assigned_admin_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from("chat_threads")
      .update({ assigned_admin_id: tm.id })
      .eq("id", threadId);
  }

  await sendChatMessage({
    sender: {
      kind: "team",
      teamMemberId: tm.id,
      teamMemberName: tm.name,
      familyId: thread.family_id,
    },
    body,
  });

  revalidatePath("/admin/messages");
  revalidatePath(`/admin/messages/${threadId}`);
}

export async function adminAssignToMe(threadId: string) {
  const tm = await requireTeamMember();
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from("chat_threads")
    .update({ assigned_admin_id: tm.id })
    .eq("id", threadId);
  revalidatePath("/admin/messages");
  revalidatePath(`/admin/messages/${threadId}`);
}

export async function adminUnassign(threadId: string) {
  await requireTeamMember();
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from("chat_threads")
    .update({ assigned_admin_id: null })
    .eq("id", threadId);
  revalidatePath("/admin/messages");
  revalidatePath(`/admin/messages/${threadId}`);
}

export async function adminSetStatus(
  threadId: string,
  status: "open" | "resolved",
) {
  await requireTeamMember();
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from("chat_threads")
    .update({ status })
    .eq("id", threadId);
  revalidatePath("/admin/messages");
  revalidatePath(`/admin/messages/${threadId}`);
}
