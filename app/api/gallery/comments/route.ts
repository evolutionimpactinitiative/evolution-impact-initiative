import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/gallery/comments — public comment submission.
//
// Anti-spam:
//   * Honeypot field `website` — if bots fill it, silently accept + drop
//   * Rate limit 3 per IP per 10 minutes (checked via ip_address column)
//   * Length caps: name ≤ 60, body ≤ 1000, email ≤ 200
//   * All comments start with status='pending' (RLS on the table forces
//     this too — belt-and-braces)

interface Body {
  imageId?: string;
  parentCommentId?: string | null;
  authorName?: string;
  authorEmail?: string | null;
  body?: string;
  website?: string;             // honeypot — should be empty
}

const RATE_LIMIT_COUNT = 3;
const RATE_LIMIT_WINDOW_MINUTES = 10;

function isNonEmpty(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function clientIp(request: NextRequest): string | null {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Body;

    // Honeypot check — silent accept if a bot filled it. Real users don't
    // see the field so this should always be empty.
    if (isNonEmpty(body.website)) {
      return NextResponse.json({ success: true, quiet: true });
    }

    if (!isNonEmpty(body.imageId)) {
      return NextResponse.json({ error: "Image missing" }, { status: 400 });
    }
    if (!isNonEmpty(body.authorName)) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }
    if (!isNonEmpty(body.body)) {
      return NextResponse.json({ error: "Comment required" }, { status: 400 });
    }
    const name = body.authorName.trim().slice(0, 60);
    const commentBody = body.body.trim().slice(0, 1000);
    const email = isNonEmpty(body.authorEmail)
      ? body.authorEmail.trim().toLowerCase().slice(0, 200)
      : null;
    const parentId = isNonEmpty(body.parentCommentId)
      ? body.parentCommentId
      : null;

    const admin = createAdminClient();

    // Rate limit — count how many comments from this IP in the window.
    const ip = clientIp(request);
    if (ip) {
      const since = new Date(
        Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60_000,
      ).toISOString();
      const { count } = await admin
        .from("gallery_comments")
        .select("id", { count: "exact", head: true })
        .eq("ip_address", ip)
        .gt("created_at", since);
      if ((count ?? 0) >= RATE_LIMIT_COUNT) {
        return NextResponse.json(
          {
            error:
              "You've submitted a lot recently — please wait a few minutes before commenting again.",
          },
          { status: 429 },
        );
      }
    }

    // Verify the image exists and is published — no comments on drafts.
    const { data: img } = await admin
      .from("gallery_images")
      .select("id, status")
      .eq("id", body.imageId)
      .maybeSingle();
    if (!img || (img as { status: string }).status !== "published") {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // If a parent is set, verify it belongs to the same image and is approved.
    if (parentId) {
      const { data: parent } = await admin
        .from("gallery_comments")
        .select("id, image_id, status")
        .eq("id", parentId)
        .maybeSingle();
      const p = parent as {
        id: string;
        image_id: string;
        status: string;
      } | null;
      if (!p || p.image_id !== body.imageId || p.status !== "approved") {
        return NextResponse.json(
          { error: "Can't reply to that comment" },
          { status: 400 },
        );
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertErr } = await (admin as any)
      .from("gallery_comments")
      .insert({
        image_id: body.imageId,
        parent_comment_id: parentId,
        author_name: name,
        author_email: email,
        body: commentBody,
        status: "pending",
        ip_address: ip,
      });

    if (insertErr) {
      console.error("[gallery-comments] insert err:", insertErr);
      return NextResponse.json(
        { error: "Couldn't submit — try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[gallery-comments] handler err:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
