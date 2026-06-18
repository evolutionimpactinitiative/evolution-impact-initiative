"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import { volunteerRoleAssignedEmail } from "@/lib/email/festival-templates";
import type { FestivalVolunteer } from "@/lib/supabase/types";

type ActionResult = { ok: true } | { ok: false; error: string };

async function getReviewerId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  const { data: member } = await supabase
    .from("team_members")
    .select("id")
    .eq("email", user.email)
    .maybeSingle();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (member as any)?.id ?? null;
}

export async function assignVolunteerRole(
  volunteerId: string,
  role: string,
  shiftNote?: string,
): Promise<ActionResult> {
  if (!role.trim()) {
    return { ok: false, error: "Please enter a role" };
  }

  const reviewerId = await getReviewerId();
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updated, error: updateErr } = await (admin as any)
    .from("festival_volunteers")
    .update({
      status: "assigned",
      assigned_role: role.trim(),
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
      admin_notes: shiftNote?.trim() || null,
    })
    .eq("id", volunteerId)
    .select()
    .single();

  if (updateErr || !updated) {
    return { ok: false, error: updateErr?.message ?? "Volunteer not found" };
  }

  try {
    const resend = getResendClient();
    if (resend) {
      const { subject, html } = volunteerRoleAssignedEmail({
        volunteer: updated as FestivalVolunteer,
        assignedRole: role.trim(),
        shiftNote: shiftNote?.trim() || undefined,
      });
      await resend.emails.send({
        from: FROM_EMAIL,
        to: updated.email,
        replyTo: REPLY_TO_EMAIL,
        subject,
        html,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from("email_logs").insert({
        email_type: "volunteer_role_assigned",
        recipient_email: updated.email,
        subject,
        sent_at: new Date().toISOString(),
        status: "sent",
      });
    }
  } catch (err) {
    console.error("[assignVolunteerRole] email error:", err);
  }

  revalidatePath("/admin/festival/volunteers");
  return { ok: true };
}

export async function declineVolunteer(
  volunteerId: string,
  note?: string,
): Promise<ActionResult> {
  const reviewerId = await getReviewerId();
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateErr } = await (admin as any)
    .from("festival_volunteers")
    .update({
      status: "declined",
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
      admin_notes: note?.trim() || null,
    })
    .eq("id", volunteerId);

  if (updateErr) {
    return { ok: false, error: updateErr.message };
  }

  revalidatePath("/admin/festival/volunteers");
  return { ok: true };
}
