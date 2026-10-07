import { createAdminClient } from "@/lib/supabase/admin";
import {
  getResendClient,
  FROM_EMAIL,
  REPLY_TO_EMAIL,
} from "@/lib/email/resend";
import {
  chatTeamReplyEmail,
  chatNewFamilyMessageEmail,
} from "@/lib/email/portal-templates";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://evolutionimpactinitiative.co.uk";

// Core send path for family ↔ team chat. Called by:
//   - /portal/messages server action (family → team)
//   - /admin/messages server action (team → family)
//
// Does:
//   1. ensure the family has an open thread (reopens if resolved)
//   2. insert the chat_messages row (text + optional attachments wired separately)
//   3. bump chat_threads.last_message_* for inbox sorting
//   4. insert notification rows for the OTHER side
//   5. send email(s) to the other side via Resend
//
// Returns { threadId, messageId } so the caller can attach files or
// redirect.

type SenderFamily = {
  kind: "family";
  familyId: string;
  carerId: string;
  carerName: string;
};

type SenderTeam = {
  kind: "team";
  teamMemberId: string;
  teamMemberName: string;
  familyId: string; // target family of the reply
};

export type ChatSender = SenderFamily | SenderTeam;

export async function sendChatMessage(params: {
  sender: ChatSender;
  body: string;
}): Promise<{ threadId: string; messageId: string }> {
  const { sender, body } = params;
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Message is empty.");

  const admin = createAdminClient();
  const familyId = sender.familyId;
  const now = new Date().toISOString();
  const senderLabel = sender.kind;

  // 1. Resolve/reopen thread for this family.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin as any)
    .from("chat_threads")
    .select("id, status")
    .eq("family_id", familyId)
    .maybeSingle();

  let threadId: string;
  if (existing) {
    threadId = existing.id;
    if (existing.status === "resolved") {
      // Reopen on new message.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any)
        .from("chat_threads")
        .update({ status: "open" })
        .eq("id", threadId);
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: created, error: createErr } = await (admin as any)
      .from("chat_threads")
      .insert({
        family_id: familyId,
        status: "open",
      })
      .select("id")
      .single();
    if (createErr) throw createErr;
    threadId = created.id;
  }

  // 2. Insert the message.
  const messageRow =
    sender.kind === "family"
      ? {
          thread_id: threadId,
          sender_type: "family",
          sender_carer_id: sender.carerId,
          body: trimmed,
        }
      : {
          thread_id: threadId,
          sender_type: "team",
          sender_team_id: sender.teamMemberId,
          // Mark team-read instantly — the sender has obviously read it.
          read_by_team_at: now,
          body: trimmed,
        };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inserted, error: insertErr } = await (admin as any)
    .from("chat_messages")
    .insert(messageRow)
    .select("id")
    .single();
  if (insertErr) throw insertErr;
  const messageId = inserted.id;

  // 3. Bump the thread's last-message fields for inbox sorting.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from("chat_threads")
    .update({
      last_message_at: now,
      last_message_by: senderLabel,
    })
    .eq("id", threadId);

  // 4. Notifications + 5. Emails — fire async-ish but awaited so the
  // caller can surface failures. These are per-direction.
  if (sender.kind === "family") {
    await notifyTeamOfFamilyMessage({
      threadId,
      body: trimmed,
      familyId,
      senderName: sender.carerName,
    });
  } else {
    await notifyFamilyOfTeamReply({
      threadId,
      body: trimmed,
      familyId,
      senderName: sender.teamMemberName,
    });
  }

  return { threadId, messageId };
}


// ---- Family → Team: email every team_member, no in-app bell for admins ----
async function notifyTeamOfFamilyMessage(params: {
  threadId: string;
  body: string;
  familyId: string;
  senderName: string;
}) {
  const admin = createAdminClient();
  const resend = getResendClient();

  // All team members with an email get notified.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: team } = await (admin as any)
    .from("team_members")
    .select("email, name")
    .not("email", "is", null);
  const teamList: { email: string; name: string | null }[] = team ?? [];
  if (teamList.length === 0 || !resend) return;

  const adminUrl = `${BASE_URL}/admin/messages/${params.threadId}`;
  const { subject, html } = chatNewFamilyMessageEmail({
    familyName: params.senderName,
    body: params.body,
    adminUrl,
  });

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: teamList.map((t) => t.email),
      replyTo: REPLY_TO_EMAIL,
      subject,
      html,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from("email_logs").insert({
      recipient_email: teamList.map((t) => t.email).join(","),
      email_type: "chat_family_message",
      subject,
      status: "sent",
    });
  } catch (err) {
    console.error("notifyTeamOfFamilyMessage: email failed", err);
  }
}


// ---- Team → Family: in-app notification for each carer + email ----
async function notifyFamilyOfTeamReply(params: {
  threadId: string;
  body: string;
  familyId: string;
  senderName: string;
}) {
  const admin = createAdminClient();
  const resend = getResendClient();

  // All carers in the family with an auth account get the bell. All
  // carers (auth or not) get the email.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: carersRaw } = await (admin as any)
    .from("parent_carers")
    .select("id, user_id, name, email")
    .eq("family_id", params.familyId);
  type Carer = {
    id: string;
    user_id: string | null;
    name: string;
    email: string;
  };
  const carers = (carersRaw as Carer[] | null) ?? [];
  if (carers.length === 0) return;

  const viewUrl = `${BASE_URL}/portal/messages`;
  const title = `New message from ${params.senderName} at EII`;

  // In-app notifications (one per carer with an auth account).
  const notifRows = carers
    .filter((c) => c.user_id)
    .map((c) => ({
      user_id: c.user_id!,
      family_id: params.familyId,
      type: "chat_message",
      title,
      body: params.body.length > 200 ? params.body.slice(0, 199) + "…" : params.body,
      link_url: viewUrl,
      payload: { thread_id: params.threadId },
      // Chat is always "live-notified" by email; the Village digest cron
      // shouldn't repackage these.
      digest_sent_at: new Date().toISOString(),
    }));

  if (notifRows.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from("notifications").insert(notifRows);
  }

  // Email every carer in the family.
  if (!resend) return;
  const { subject, html } = chatTeamReplyEmail({
    senderName: params.senderName,
    body: params.body,
    viewUrl,
  });

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: carers.map((c) => c.email),
      replyTo: REPLY_TO_EMAIL,
      subject,
      html,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from("email_logs").insert({
      recipient_email: carers.map((c) => c.email).join(","),
      email_type: "chat_team_reply",
      subject,
      status: "sent",
    });
  } catch (err) {
    console.error("notifyFamilyOfTeamReply: email failed", err);
  }
}
