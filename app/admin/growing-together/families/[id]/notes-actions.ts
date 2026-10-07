"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  writeNote,
  setNoteVisibility,
  deleteNote,
  type NoteTargetType,
  type NoteVisibility,
} from "@/lib/notes/create-note";

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

export async function addNoteAction(params: {
  familyId: string;
  targetType: NoteTargetType;
  targetId: string;
  body: string;
  visibility: NoteVisibility;
}) {
  const tm = await requireTeamMember();
  await writeNote({
    targetType: params.targetType,
    targetId: params.targetId,
    authorTeamId: tm.id,
    authorName: tm.name,
    body: params.body,
    visibility: params.visibility,
  });
  revalidatePath(`/admin/growing-together/families/${params.familyId}`);
}

export async function flipNoteVisibilityAction(params: {
  familyId: string;
  noteId: string;
  nextVisibility: NoteVisibility;
}) {
  const tm = await requireTeamMember();
  await setNoteVisibility({
    noteId: params.noteId,
    visibility: params.nextVisibility,
    actorName: tm.name,
  });
  revalidatePath(`/admin/growing-together/families/${params.familyId}`);
}

export async function deleteNoteAction(params: {
  familyId: string;
  noteId: string;
}) {
  await requireTeamMember();
  await deleteNote(params.noteId);
  revalidatePath(`/admin/growing-together/families/${params.familyId}`);
}
