"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  ExternalLink,
  ImageIcon,
  Loader2,
  Lock,
  MessageCircle,
  Rocket,
  Send,
  Share2,
  Upload,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Event } from "@/lib/supabase/types";
import {
  SOCIAL_PLATFORMS,
  announcementEmailUrl,
  derivePlaybookSteps,
  designerBriefMessage,
  whatsAppGroupUrl,
  type SocialPlatform,
} from "@/lib/events/playbook";

interface Props {
  event: Event;
  siteOrigin: string;
}

type Action =
  | "mark_designer_pinged"
  | "mark_announcement_sent"
  | "toggle_social"
  | "publish"
  | "set_social_image";

export function PlaybookChecklist({ event: initialEvent, siteOrigin }: Props) {
  const router = useRouter();
  const [event, setEvent] = React.useState<Event>(initialEvent);
  const [pending, setPending] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [briefCopied, setBriefCopied] = React.useState(false);

  const steps = derivePlaybookSteps(event);
  const doneCount = steps.filter((s) => s.done).length;
  const progressPct = Math.round((doneCount / steps.length) * 100);

  async function runAction(
    action: Action,
    extras?: Record<string, unknown>,
    tag?: string,
  ) {
    setPending(tag ?? action);
    setError(null);
    try {
      const res = await fetch(`/api/events/${event.id}/playbook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...(extras ?? {}) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Action failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setPending(null);
    }
  }

  const brief = designerBriefMessage(event);
  async function copyBrief() {
    try {
      await navigator.clipboard.writeText(brief);
      setBriefCopied(true);
      setTimeout(() => setBriefCopied(false), 2200);
    } catch {
      setError("Couldn't copy to clipboard");
    }
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5">
        <div className="flex items-baseline justify-between mb-2">
          <p className="font-heading font-bold text-brand-dark">Progress</p>
          <p className="text-sm text-gray-600">
            {doneCount} of {steps.length} steps
          </p>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-blue transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Step 1 — Designer brief */}
      <StepCard
        num={1}
        icon={<MessageCircle className="h-5 w-5" />}
        title="Ping designer for artwork"
        done={steps[0].done}
        detail={steps[0].detail}
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Copy the brief, open the designers&rsquo; WhatsApp group, and paste
            it in. Aim to give them 48 hours turnaround.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm text-brand-dark whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
            {brief}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyBrief}
              className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-brand-dark px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:border-brand-blue"
            >
              {briefCopied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy brief
                </>
              )}
            </button>
            <a
              href={whatsAppGroupUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-[#25D366] text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-[#1EBE5D]"
            >
              <MessageCircle className="h-4 w-4" />
              Open WhatsApp group
              <ExternalLink className="h-3 w-3" />
            </a>
            {!steps[0].done && (
              <button
                type="button"
                onClick={() => runAction("mark_designer_pinged")}
                disabled={pending === "mark_designer_pinged"}
                className="inline-flex items-center gap-1.5 bg-brand-blue text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50"
              >
                {pending === "mark_designer_pinged" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Mark as sent
              </button>
            )}
          </div>
        </div>
      </StepCard>

      {/* Step 2 — Artwork upload */}
      <StepCard
        num={2}
        icon={<ImageIcon className="h-5 w-5" />}
        title="Upload artwork"
        done={steps[1].done}
        detail={steps[1].detail}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ArtworkSlot
            label="Website hero"
            aspect="16/9"
            currentUrl={event.hero_image_url}
            event={event}
            column="hero_image_url"
            onChange={(url) =>
              setEvent((e) => ({ ...e, hero_image_url: url }))
            }
          />
          <ArtworkSlot
            label="Website card"
            aspect="4/3"
            currentUrl={event.card_image_url}
            event={event}
            column="card_image_url"
            onChange={(url) =>
              setEvent((e) => ({ ...e, card_image_url: url }))
            }
          />
          <ArtworkSlot
            label="Social media"
            aspect="1/1"
            currentUrl={event.social_image_url}
            event={event}
            column="social_image_url"
            onChange={(url) =>
              setEvent((e) => ({ ...e, social_image_url: url }))
            }
          />
        </div>
      </StepCard>

      {/* Step 3 — Publish */}
      <StepCard
        num={3}
        icon={<Rocket className="h-5 w-5" />}
        title="Publish the event"
        done={steps[2].done}
        blocked={steps[2].blocked}
        detail={steps[2].detail}
      >
        {steps[2].done ? (
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-md text-sm">
              <Check className="h-4 w-4" />
              Published
            </span>
            <a
              href={`/events/${event.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-brand-dark px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:border-brand-blue"
            >
              View public page
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Publishing makes the event live on the public site and opens
              registration.
            </p>
            <button
              type="button"
              onClick={() => runAction("publish")}
              disabled={!!steps[2].blocked || pending === "publish"}
              className="inline-flex items-center gap-1.5 bg-brand-blue text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {pending === "publish" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : steps[2].blocked ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Rocket className="h-4 w-4" />
              )}
              Publish now
            </button>
          </div>
        )}
      </StepCard>

      {/* Step 4 — Announcement email */}
      <StepCard
        num={4}
        icon={<Send className="h-5 w-5" />}
        title="Send announcement email"
        done={steps[3].done}
        blocked={steps[3].blocked}
        detail={steps[3].detail}
      >
        <div className="flex flex-wrap gap-2">
          <Link
            href={announcementEmailUrl(event, siteOrigin)}
            onClick={() => {
              // Fire-and-forget: mark step done as they hop into the composer.
              if (!steps[3].done && !steps[3].blocked) {
                runAction("mark_announcement_sent", undefined, "announce-link");
              }
            }}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest ${
              steps[3].blocked
                ? "bg-gray-100 text-gray-400 pointer-events-none"
                : "bg-brand-blue text-white hover:bg-brand-dark"
            }`}
          >
            {steps[3].blocked ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Compose announcement
          </Link>
          {steps[3].done && (
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-md text-sm">
              <Check className="h-4 w-4" />
              Marked sent
            </span>
          )}
        </div>
      </StepCard>

      {/* Step 5 — Socials */}
      <StepCard
        num={5}
        icon={<Share2 className="h-5 w-5" />}
        title="Post on socials"
        done={steps[4].done}
        blocked={steps[4].blocked}
        detail={steps[4].detail}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SOCIAL_PLATFORMS.map((p) => {
            const posted = event.playbook_state?.socials_posted?.[p.key];
            const tag = `social-${p.key}`;
            return (
              <button
                key={p.key}
                type="button"
                disabled={!!steps[4].blocked || pending === tag}
                onClick={() =>
                  runAction("toggle_social", { platform: p.key }, tag)
                }
                className={`flex items-center justify-center gap-1.5 px-3 py-3 rounded-md text-sm font-heading font-bold uppercase tracking-widest border ${
                  posted
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                    : "bg-white border-gray-200 text-brand-dark hover:border-brand-blue"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {pending === tag ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : posted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
                {p.label}
              </button>
            );
          })}
        </div>
      </StepCard>
    </div>
  );
}

// ─── Step card shell ────────────────────────────────────────────

function StepCard({
  num,
  icon,
  title,
  done,
  blocked,
  detail,
  children,
}: {
  num: number;
  icon: React.ReactNode;
  title: string;
  done: boolean;
  blocked?: boolean;
  detail?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`bg-white border rounded-2xl overflow-hidden ${
        done ? "border-emerald-200" : "border-gray-200"
      }`}
    >
      <div className="p-4 md:p-5 flex items-start gap-3 border-b border-gray-100">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            done
              ? "bg-emerald-600 text-white"
              : blocked
                ? "bg-gray-100 text-gray-400"
                : "bg-brand-blue/10 text-brand-blue"
          }`}
        >
          {done ? <Check className="h-5 w-5" /> : icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="text-xs text-gray-500 font-heading font-bold uppercase tracking-widest">
              Step {num}
            </p>
            {done && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-heading font-bold uppercase tracking-widest bg-emerald-100 text-emerald-800">
                Done
              </span>
            )}
            {blocked && !done && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-heading font-bold uppercase tracking-widest bg-gray-100 text-gray-500">
                <Lock className="h-3 w-3" />
                Blocked
              </span>
            )}
          </div>
          <p className="font-heading font-bold text-brand-dark mt-0.5">
            {title}
          </p>
          {detail && (
            <p className="text-sm text-gray-500 mt-0.5">{detail}</p>
          )}
        </div>
      </div>
      <div className="p-4 md:p-5">{children}</div>
    </section>
  );
}

// ─── Artwork slot ────────────────────────────────────────────────

function ArtworkSlot({
  label,
  aspect,
  currentUrl,
  event,
  column,
  onChange,
}: {
  label: string;
  aspect: string;
  currentUrl: string | null;
  event: Event;
  column: "hero_image_url" | "card_image_url" | "social_image_url";
  onChange: (url: string | null) => void;
}) {
  const supabase = createClient();
  const [uploading, setUploading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErr(null);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${event.id}-${column}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("event-images")
        .upload(fileName, file);
      if (upErr) throw upErr;
      const {
        data: { publicUrl },
      } = supabase.storage.from("event-images").getPublicUrl(fileName);

      if (column === "social_image_url") {
        // Use the playbook API so RLS/service-role handling is consistent
        const res = await fetch(`/api/events/${event.id}/playbook`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "set_social_image", url: publicUrl }),
        });
        if (!res.ok) throw new Error("Save failed");
      } else {
        // Direct write to the existing column for hero/card — same pattern
        // as EventForm.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updErr } = await (supabase as any)
          .from("events")
          .update({ [column]: publicUrl })
          .eq("id", event.id);
        if (updErr) throw updErr;
      }
      onChange(publicUrl);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove() {
    setUploading(true);
    setErr(null);
    try {
      if (column === "social_image_url") {
        const res = await fetch(`/api/events/${event.id}/playbook`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "set_social_image", url: null }),
        });
        if (!res.ok) throw new Error("Remove failed");
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updErr } = await (supabase as any)
          .from("events")
          .update({ [column]: null })
          .eq("id", event.id);
        if (updErr) throw updErr;
      }
      onChange(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Remove failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <p className="text-xs text-gray-500 font-heading font-bold uppercase tracking-widest mb-1">
        {label}
      </p>
      <div
        className="relative w-full bg-gray-50 border border-gray-200 rounded-md overflow-hidden"
        style={{ aspectRatio: aspect }}
      >
        {currentUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentUrl}
              alt={label}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={remove}
              disabled={uploading}
              className="absolute top-1 right-1 w-7 h-7 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center text-gray-600 hover:text-red-600 disabled:opacity-50"
              aria-label="Remove image"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-brand-blue"
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <Upload className="h-6 w-6" />
                <span className="text-xs">Upload</span>
              </>
            )}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={upload}
        />
      </div>
      {err && <p className="text-xs text-red-700 mt-1">{err}</p>}
    </div>
  );
}
