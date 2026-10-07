import { createAdminClient } from "@/lib/supabase/admin";
import {
  getResendClient,
  FROM_EMAIL,
  REPLY_TO_EMAIL,
} from "@/lib/email/resend";
import { villagePostEmail } from "@/lib/email/portal-templates";

// Fan a newly-published Village post out to every parent carer:
//   - insert one `notifications` row per carer (powers the bell + list)
//   - for carers on `per_post`, send the email now and mark digest_sent_at
//   - carers on `daily_digest` get picked up later by the 17:00 cron
//   - carers on `never` get the in-app row but no email ever
//
// Idempotency: if a post is already "published" and gets re-saved, we
// don't want to re-notify. We check for existing notifications on
// (user_id, type='village_post', payload->>post_id = post.id) and skip
// users who already have one.

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://evolutionimpactinitiative.co.uk";

type VillagePost = {
  id: string;
  title: string;
  body: string | null;
  category: string;
  author_name: string | null;
  cover_image_url: string | null;
};

type Carer = {
  id: string;
  user_id: string;
  family_id: string;
  name: string;
  email: string;
  village_email_pref: "per_post" | "daily_digest" | "never";
};

export async function notifyParentsOfVillagePost(post: VillagePost): Promise<{
  carers_considered: number;
  notifications_inserted: number;
  emails_sent: number;
  emails_failed: number;
  skipped_already_notified: number;
}> {
  const admin = createAdminClient();

  const viewUrl = `${BASE_URL}/portal/our-village#post-${post.id}`;
  const prefsUrl = `${BASE_URL}/portal/family#notifications`;

  // All carers with a Supabase auth account (null user_id = pending signup).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: carersRaw, error: carersErr } = await (admin as any)
    .from("parent_carers")
    .select("id, user_id, family_id, name, email, village_email_pref")
    .not("user_id", "is", null);

  if (carersErr) throw carersErr;
  const carers = (carersRaw as Carer[] | null) ?? [];

  if (carers.length === 0) {
    return {
      carers_considered: 0,
      notifications_inserted: 0,
      emails_sent: 0,
      emails_failed: 0,
      skipped_already_notified: 0,
    };
  }

  // Which carers already got a notification for THIS post? (idempotency —
  // a re-save of an already-published post shouldn't re-notify.)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingRaw } = await (admin as any)
    .from("notifications")
    .select("user_id")
    .eq("type", "village_post")
    .eq("payload->>post_id", post.id);

  const alreadyNotified = new Set<string>(
    ((existingRaw as { user_id: string }[] | null) ?? []).map((r) => r.user_id),
  );

  const toNotify = carers.filter((c) => !alreadyNotified.has(c.user_id));

  if (toNotify.length === 0) {
    return {
      carers_considered: carers.length,
      notifications_inserted: 0,
      emails_sent: 0,
      emails_failed: 0,
      skipped_already_notified: alreadyNotified.size,
    };
  }

  // Build notification rows. Pre-stamp digest_sent_at for `never` carers
  // so the digest cron skips them. Per_post carers get stamped after send.
  const now = new Date().toISOString();
  const rows = toNotify.map((c) => ({
    user_id: c.user_id,
    family_id: c.family_id,
    type: "village_post",
    title: post.title,
    body: null,
    link_url: viewUrl,
    payload: {
      post_id: post.id,
      category: post.category,
      author_name: post.author_name,
    },
    digest_sent_at: c.village_email_pref === "never" ? now : null,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inserted, error: insertErr } = await (admin as any)
    .from("notifications")
    .insert(rows)
    .select("id, user_id");

  if (insertErr) throw insertErr;
  const insertedRows =
    (inserted as { id: string; user_id: string }[] | null) ?? [];
  const insertedByUser = new Map(insertedRows.map((r) => [r.user_id, r.id]));

  // Immediate email path for per_post carers.
  const resend = getResendClient();
  const perPostCarers = toNotify.filter(
    (c) => c.village_email_pref === "per_post",
  );
  let emails_sent = 0;
  let emails_failed = 0;

  for (const carer of perPostCarers) {
    const firstName = carer.name.split(/\s+/)[0] || carer.name;
    const { subject, html } = villagePostEmail({
      parentName: firstName,
      post,
      viewUrl,
      prefsUrl,
    });

    if (!resend) {
      // No Resend key configured (local dev) — still mark digest_sent_at
      // so this notification isn't picked up by the digest later.
      const nid = insertedByUser.get(carer.user_id);
      if (nid) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin as any)
          .from("notifications")
          .update({ digest_sent_at: new Date().toISOString() })
          .eq("id", nid);
      }
      emails_sent++;
      continue;
    }

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: carer.email,
        replyTo: REPLY_TO_EMAIL,
        subject,
        html,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from("email_logs").insert({
        recipient_email: carer.email,
        email_type: "village_post_immediate",
        subject,
        status: "sent",
      });
      const nid = insertedByUser.get(carer.user_id);
      if (nid) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin as any)
          .from("notifications")
          .update({ digest_sent_at: new Date().toISOString() })
          .eq("id", nid);
      }
      emails_sent++;
    } catch (err) {
      console.error("Village per-post email failed:", err);
      emails_failed++;
    }
  }

  return {
    carers_considered: carers.length,
    notifications_inserted: insertedRows.length,
    emails_sent,
    emails_failed,
    skipped_already_notified: alreadyNotified.size,
  };
}
