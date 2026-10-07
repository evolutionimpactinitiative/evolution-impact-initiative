import { createAdminClient } from "@/lib/supabase/admin";
import {
  getResendClient,
  FROM_EMAIL,
  REPLY_TO_EMAIL,
} from "@/lib/email/resend";
import { externalNoteEmail } from "@/lib/email/portal-templates";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://evolutionimpactinitiative.co.uk";

export type NoteTargetType = "family" | "child";
export type NoteVisibility = "internal" | "external";

// Resolves the family_id associated with a note target. For 'family'
// notes it's just target_id; for 'child' notes we join through children.
async function resolveFamilyId(
  targetType: NoteTargetType,
  targetId: string,
): Promise<string | null> {
  const admin = createAdminClient();
  if (targetType === "family") return targetId;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from("children")
    .select("family_id")
    .eq("id", targetId)
    .maybeSingle();
  return (data?.family_id as string) ?? null;
}

// Core writer for notes. Handles both creation and the
// internal→external flip. Fires parent-facing notification + email on
// any transition that newly exposes the note to the family.
export async function writeNote(params: {
  targetType: NoteTargetType;
  targetId: string;
  authorTeamId: string;
  authorName: string;
  body: string;
  visibility: NoteVisibility;
}): Promise<{ noteId: string }> {
  const admin = createAdminClient();
  const trimmed = params.body.trim();
  if (!trimmed) throw new Error("Note is empty");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inserted, error } = await (admin as any)
    .from("notes")
    .insert({
      target_type: params.targetType,
      target_id: params.targetId,
      author_team_id: params.authorTeamId,
      body: trimmed,
      visibility: params.visibility,
    })
    .select("id")
    .single();
  if (error) throw error;

  if (params.visibility === "external") {
    await notifyFamilyOfExternalNote({
      targetType: params.targetType,
      targetId: params.targetId,
      authorName: params.authorName,
      body: trimmed,
    });
  }
  return { noteId: inserted.id };
}

export async function setNoteVisibility(params: {
  noteId: string;
  visibility: NoteVisibility;
  actorName: string; // for notification "from" field if newly external
}): Promise<void> {
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: current } = await (admin as any)
    .from("notes")
    .select("id, target_type, target_id, body, visibility")
    .eq("id", params.noteId)
    .maybeSingle();
  if (!current) throw new Error("Note not found");

  if (current.visibility === params.visibility) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("notes")
    .update({ visibility: params.visibility })
    .eq("id", params.noteId);
  if (error) throw error;

  if (params.visibility === "external") {
    await notifyFamilyOfExternalNote({
      targetType: current.target_type,
      targetId: current.target_id,
      authorName: params.actorName,
      body: current.body,
    });
  }
}

export async function deleteNote(noteId: string): Promise<void> {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from("notes").delete().eq("id", noteId);
}

async function notifyFamilyOfExternalNote(params: {
  targetType: NoteTargetType;
  targetId: string;
  authorName: string;
  body: string;
}) {
  const admin = createAdminClient();
  const familyId = await resolveFamilyId(params.targetType, params.targetId);
  if (!familyId) return;

  // "about" line in the email: "your family" or "your child Jane".
  let about = "your family";
  if (params.targetType === "child") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: child } = await (admin as any)
      .from("children")
      .select("first_name")
      .eq("id", params.targetId)
      .maybeSingle();
    if (child?.first_name) about = `your child ${child.first_name}`;
  }

  // Carers of the family.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: carers } = await (admin as any)
    .from("parent_carers")
    .select("id, user_id, name, email")
    .eq("family_id", familyId);
  type Carer = {
    id: string;
    user_id: string | null;
    name: string;
    email: string;
  };
  const list = (carers as Carer[] | null) ?? [];
  if (list.length === 0) return;

  const viewUrl = `${BASE_URL}/portal/family`;
  const title = `New note from ${params.authorName} at EII`;

  // In-app notifications (one per carer with an auth account).
  const notifRows = list
    .filter((c) => c.user_id)
    .map((c) => ({
      user_id: c.user_id!,
      family_id: familyId,
      type: "external_note",
      title,
      body: params.body.length > 200
        ? params.body.slice(0, 199) + "…"
        : params.body,
      link_url: viewUrl,
      payload: { target_type: params.targetType, target_id: params.targetId },
      // Live-notified; don't let the digest cron pick this up too.
      digest_sent_at: new Date().toISOString(),
    }));
  if (notifRows.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from("notifications").insert(notifRows);
  }

  const resend = getResendClient();
  if (!resend) return;

  // Email every carer (one send with multiple recipients).
  const firstCarer = list[0];
  const parentName = firstCarer.name.split(/\s+/)[0] || firstCarer.name;
  const { subject, html } = externalNoteEmail({
    parentName,
    authorName: params.authorName,
    about,
    body: params.body,
    viewUrl,
  });

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: list.map((c) => c.email),
      replyTo: REPLY_TO_EMAIL,
      subject,
      html,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from("email_logs").insert({
      recipient_email: list.map((c) => c.email).join(","),
      email_type: "external_note",
      subject,
      status: "sent",
    });
  } catch (err) {
    console.error("notifyFamilyOfExternalNote: email failed", err);
  }
}
