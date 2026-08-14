// Playbook helpers — WhatsApp deep link, message templates, and derived
// step status for the launch checklist. Kept framework-free so the same
// helpers work in the API route + server page + client component.

import type { Event, PlaybookState } from "@/lib/supabase/types";

export const DESIGNER_WHATSAPP_GROUP_URL =
  "https://chat.whatsapp.com/KjLnSiGeypK0yL7kajtBSE?s=cl&p=i&ilr=2";

export type SocialPlatform = "instagram" | "linkedin" | "facebook" | "tiktok";

export const SOCIAL_PLATFORMS: Array<{ key: SocialPlatform; label: string }> = [
  { key: "instagram", label: "Instagram" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "facebook", label: "Facebook" },
  { key: "tiktok", label: "TikTok" },
];

// Human-friendly date + time. Used in message templates so the designer
// (and email recipients) don't have to parse ISO strings.
function fmtDateLong(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function stripSeconds(t: string | null | undefined): string | null {
  if (!t) return null;
  return t.length >= 5 ? t.slice(0, 5) : t;
}

// The message we drop into the designers' WhatsApp group. Includes what's
// needed and the 48-hour SLA the chair asked for.
export function designerBriefMessage(event: Event): string {
  const time = stripSeconds(event.start_time);
  const endTime = stripSeconds(event.end_time);
  const timeStr = time
    ? endTime
      ? `${time} – ${endTime}`
      : time
    : "";

  return [
    `Hey team — new event artwork needed 🎨`,
    ``,
    `*${event.title}*`,
    `${fmtDateLong(event.date)}${timeStr ? ` · ${timeStr}` : ""}`,
    `${event.venue_name}`,
    ``,
    `Please can we get:`,
    `• Website hero image`,
    `• Website card image`,
    `• Social media design`,
    ``,
    `Aiming to have these back within 48 hours so we can publish + start promoting. Thanks so much 🙏`,
  ].join("\n");
}

// WhatsApp doesn't officially support pre-filling a group message via URL,
// but we can at least open the group. The chair pastes the copied brief.
export function whatsAppGroupUrl(): string {
  return DESIGNER_WHATSAPP_GROUP_URL;
}

// Bulk-email compose deep link — prefills the "New event" announcement so
// the sender only tweaks and clicks send.
export function announcementEmailUrl(event: Event, siteOrigin: string): string {
  const subject = `New event: ${event.title} — ${fmtDateLong(event.date)}`;
  const publicUrl = `${siteOrigin.replace(/\/$/, "")}/events/${event.slug}`;
  const time = stripSeconds(event.start_time);
  const timeStr = time
    ? stripSeconds(event.end_time)
      ? `${time} – ${stripSeconds(event.end_time)}`
      : time
    : "";

  const body = [
    `Hi there,`,
    ``,
    `We're excited to announce our next event:`,
    ``,
    `*${event.title}*`,
    `${fmtDateLong(event.date)}${timeStr ? ` · ${timeStr}` : ""}`,
    `${event.venue_name}`,
    ``,
    event.short_description,
    ``,
    `Register here: ${publicUrl}`,
    ``,
    `Hope to see you there!`,
    `The Evolution Impact Initiative team`,
  ].join("\n");

  const params = new URLSearchParams({ subject, body });
  return `/admin/subscribers/bulk-email?${params.toString()}`;
}

// ─── Derived step status ────────────────────────────────────────────

export interface StepStatus {
  key: string;
  label: string;
  done: boolean;
  blocked?: boolean;
  detail?: string;
}

export function derivePlaybookSteps(event: Event): StepStatus[] {
  const state: PlaybookState = event.playbook_state ?? {};
  const artworkComplete =
    !!event.hero_image_url && !!event.card_image_url && !!event.social_image_url;
  const artworkCount = [
    event.hero_image_url,
    event.card_image_url,
    event.social_image_url,
  ].filter(Boolean).length;
  const published = event.status === "published";
  const socialsCount = state.socials_posted
    ? SOCIAL_PLATFORMS.filter((p) => state.socials_posted?.[p.key]).length
    : 0;

  return [
    {
      key: "designer",
      label: "Ping designer for artwork",
      done: !!state.designer_pinged_at,
      detail: state.designer_pinged_at
        ? `Pinged ${fmtRelative(state.designer_pinged_at)}`
        : "Send the brief to the designers' WhatsApp group",
    },
    {
      key: "artwork",
      label: "Upload artwork (hero · card · social)",
      done: artworkComplete,
      detail: artworkComplete
        ? "All three uploaded"
        : `${artworkCount} of 3 uploaded`,
    },
    {
      key: "publish",
      label: "Publish the event",
      done: published,
      blocked: !artworkComplete,
      detail: published
        ? "Live on the public site"
        : artworkComplete
          ? "Ready to publish"
          : "Complete artwork first",
    },
    {
      key: "announce",
      label: "Send announcement email",
      done: !!state.announcement_sent_at,
      blocked: !published,
      detail: state.announcement_sent_at
        ? `Sent ${fmtRelative(state.announcement_sent_at)}`
        : published
          ? "Compose the mailing-list email"
          : "Publish the event first",
    },
    {
      key: "socials",
      label: "Post on socials",
      done: socialsCount === SOCIAL_PLATFORMS.length,
      blocked: !published,
      detail: published
        ? `${socialsCount} of ${SOCIAL_PLATFORMS.length} platforms posted`
        : "Publish the event first",
    },
  ];
}

function fmtRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}
