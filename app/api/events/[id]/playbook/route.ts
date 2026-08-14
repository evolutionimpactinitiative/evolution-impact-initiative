import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlaybookState } from "@/lib/supabase/types";
import { SOCIAL_PLATFORMS, type SocialPlatform } from "@/lib/events/playbook";

async function requireTeam() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401 };
  const { data: teamMember } = await supabase
    .from("team_members")
    .select("id")
    .eq("email", user.email || "")
    .maybeSingle();
  if (!teamMember) return { ok: false as const, status: 403 };
  return { ok: true as const };
}

// POST /api/events/[id]/playbook
// Body: one of:
//   { action: 'mark_designer_pinged' }
//   { action: 'mark_announcement_sent' }
//   { action: 'toggle_social', platform: 'instagram'|'linkedin'|'facebook'|'tiktok' }
//   { action: 'publish' }                    ← flips events.status → 'published'
//   { action: 'set_social_image', url: string|null }
//
// Team-only. Each action is a targeted write so we never blow away
// unrelated keys the wizard adds later.

interface Body {
  action?: string;
  platform?: string;
  url?: string | null;
}

const SOCIAL_KEYS = new Set<SocialPlatform>(SOCIAL_PLATFORMS.map((p) => p.key));

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireTeam();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const { id } = await params;
  const body = (await request.json()) as Body;
  if (!body.action) {
    return NextResponse.json({ error: "action required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: current } = await admin
    .from("events")
    .select("id, status, playbook_state, social_image_url")
    .eq("id", id)
    .maybeSingle();
  const evt = current as {
    id: string;
    status: string;
    playbook_state: PlaybookState;
    social_image_url: string | null;
  } | null;
  if (!evt) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const next: PlaybookState = { ...(evt.playbook_state ?? {}) };
  const eventUpdate: Record<string, unknown> = {};

  switch (body.action) {
    case "mark_designer_pinged":
      next.designer_pinged_at = now;
      break;

    case "mark_announcement_sent":
      next.announcement_sent_at = now;
      break;

    case "toggle_social": {
      const p = body.platform as SocialPlatform | undefined;
      if (!p || !SOCIAL_KEYS.has(p)) {
        return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
      }
      const posted = { ...(next.socials_posted ?? {}) };
      if (posted[p]) {
        delete posted[p];
      } else {
        posted[p] = now;
      }
      next.socials_posted = posted;
      break;
    }

    case "publish":
      if (evt.status === "published") {
        return NextResponse.json({ success: true, alreadyPublished: true });
      }
      eventUpdate.status = "published";
      next.published_at = now;
      break;

    case "set_social_image":
      // Direct column write — no playbook_state change.
      eventUpdate.social_image_url = body.url ?? null;
      break;

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  eventUpdate.playbook_state = next;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("events")
    .update(eventUpdate)
    .eq("id", id);
  if (error) {
    console.error("[event-playbook] update err:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
