import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getResendClient,
  FROM_EMAIL,
  REPLY_TO_EMAIL,
} from "@/lib/email/resend";
import { villageDigestEmail } from "@/lib/email/portal-templates";

// Daily 17:00 cron. For each carer on `daily_digest`, bundle their
// still-unsent `village_post` notifications from the last 24h into one
// email, send it, mark digest_sent_at on all included rows. Carers on
// `per_post` or `never` are skipped (per-post sent inline at publish;
// never gets stamped at insert time so it's filtered naturally).
//
// Auth: Bearer $CRON_SECRET in production, matches other GT crons.

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://evolutionimpactinitiative.co.uk";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (process.env.NODE_ENV === "production" && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();

  // Pending notifications: village_post type, not yet digested, created
  // in the last 24h. The 24h cap keeps a stuck/missed cron from firing
  // a mega-digest when it recovers.
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pendingRaw, error: pendingErr } = await (admin as any)
    .from("notifications")
    .select("id, user_id, title, payload, created_at")
    .eq("type", "village_post")
    .is("digest_sent_at", null)
    .gte("created_at", cutoff.toISOString())
    .order("created_at", { ascending: true });

  if (pendingErr) {
    console.error("village-digest: fetch pending failed", pendingErr);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }

  type Pending = {
    id: string;
    user_id: string;
    title: string;
    payload: { post_id: string; category: string; author_name: string | null };
    created_at: string;
  };
  const pending = (pendingRaw as Pending[] | null) ?? [];

  if (pending.length === 0) {
    return NextResponse.json({ ok: true, carers_emailed: 0, posts_included: 0 });
  }

  // Fetch carers with daily_digest preference. Only these get the email.
  const userIds = [...new Set(pending.map((p) => p.user_id))];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: carersRaw } = await (admin as any)
    .from("parent_carers")
    .select("user_id, name, email, village_email_pref")
    .in("user_id", userIds)
    .eq("village_email_pref", "daily_digest");

  type Carer = {
    user_id: string;
    name: string;
    email: string;
    village_email_pref: string;
  };
  const digestCarers = (carersRaw as Carer[] | null) ?? [];
  const digestUserIds = new Set(digestCarers.map((c) => c.user_id));

  // Fetch post bodies for the preview text in the digest.
  const postIds = [...new Set(pending.map((p) => p.payload.post_id))];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: postsRaw } = await (admin as any)
    .from("village_posts")
    .select("id, title, body, category, status")
    .in("id", postIds);

  type Post = {
    id: string;
    title: string;
    body: string | null;
    category: string;
    status: string;
  };
  const posts = (postsRaw as Post[] | null) ?? [];
  const postById = new Map(posts.map((p) => [p.id, p]));

  const resend = getResendClient();
  const viewUrl = `${BASE_URL}/portal/our-village`;
  const prefsUrl = `${BASE_URL}/portal/family#notifications`;

  let carers_emailed = 0;
  let emails_failed = 0;
  let posts_included = 0;

  for (const carer of digestCarers) {
    const myPendings = pending.filter((p) => p.user_id === carer.user_id);
    // Dedupe by post_id (defensive) and only include posts that are
    // still published (an archived/deleted post shouldn't appear).
    const seen = new Set<string>();
    const postsForEmail: Array<{
      id: string;
      title: string;
      body: string | null;
      category: string;
    }> = [];
    const includedNotifIds: string[] = [];

    for (const p of myPendings) {
      if (seen.has(p.payload.post_id)) {
        includedNotifIds.push(p.id);
        continue;
      }
      seen.add(p.payload.post_id);
      const post = postById.get(p.payload.post_id);
      if (!post || post.status !== "published") {
        // Stamp it so we don't retry a now-unpublished post forever.
        includedNotifIds.push(p.id);
        continue;
      }
      postsForEmail.push({
        id: post.id,
        title: post.title,
        body: post.body,
        category: post.category,
      });
      includedNotifIds.push(p.id);
    }

    if (postsForEmail.length === 0) {
      // Nothing live to send — still stamp so we don't re-check next run.
      if (includedNotifIds.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin as any)
          .from("notifications")
          .update({ digest_sent_at: new Date().toISOString() })
          .in("id", includedNotifIds);
      }
      continue;
    }

    const firstName = carer.name.split(/\s+/)[0] || carer.name;
    const { subject, html } = villageDigestEmail({
      parentName: firstName,
      posts: postsForEmail,
      viewUrl,
      prefsUrl,
    });

    if (!resend) {
      // Local dev / no API key — mark delivered so we don't spin.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any)
        .from("notifications")
        .update({ digest_sent_at: new Date().toISOString() })
        .in("id", includedNotifIds);
      carers_emailed++;
      posts_included += postsForEmail.length;
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
        email_type: "village_daily_digest",
        subject,
        status: "sent",
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any)
        .from("notifications")
        .update({ digest_sent_at: new Date().toISOString() })
        .in("id", includedNotifIds);
      carers_emailed++;
      posts_included += postsForEmail.length;
    } catch (err) {
      console.error("village-digest email failed:", err);
      emails_failed++;
    }
  }

  // Also stamp notifications for users NOT on daily_digest (e.g. they
  // flipped to `never` after the row was inserted). Prevents the pending
  // query from growing forever.
  const neverStamp = pending.filter((p) => !digestUserIds.has(p.user_id));
  if (neverStamp.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from("notifications")
      .update({ digest_sent_at: new Date().toISOString() })
      .in(
        "id",
        neverStamp.map((n) => n.id),
      );
  }

  return NextResponse.json({
    ok: true,
    pending_considered: pending.length,
    carers_emailed,
    emails_failed,
    posts_included,
  });
}
