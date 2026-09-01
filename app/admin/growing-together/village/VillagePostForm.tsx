"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Save,
  Trash2,
  Upload,
  X,
  Pin,
  Send,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import type { VillagePost } from "@/lib/supabase/types";
import {
  createVillagePost,
  updateVillagePost,
  deleteVillagePost,
} from "./actions";

type Category = VillagePost["category"];

const CATEGORY_OPTIONS: { value: Category; label: string; description: string }[] = [
  {
    value: "activity",
    label: "🎉 Activity",
    description: "Upcoming community activity — trip, workshop, meet-up.",
  },
  {
    value: "announcement",
    label: "📣 Announcement",
    description: "Something families need to know soon.",
  },
  {
    value: "local_service",
    label: "🏥 Local service",
    description: "Health visitor, food bank, legal aid, ESOL classes, etc.",
  },
  {
    value: "programme_update",
    label: "📢 Programme update",
    description: "News about Growing Together itself.",
  },
  {
    value: "resource",
    label: "📚 Parent resource",
    description: "Article, video, guide — usually links out.",
  },
];

interface Props {
  post?: VillagePost;
}

export function VillagePostForm({ post }: Props) {
  const router = useRouter();
  const isEdit = !!post;

  const [category, setCategory] = useState<Category>(post?.category ?? "announcement");
  const [body, setBody] = useState(post?.body ?? "");
  const [coverUrl, setCoverUrl] = useState<string | null>(post?.cover_image_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [saving, startSaving] = useTransition();
  const [deleting, startDeleting] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/village/images", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      setCoverUrl(json.url);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <form
      action={(fd) => {
        setError(null);
        // Inject the client-controlled fields the plain form can't reach.
        fd.set("category", category);
        fd.set("body", body);
        if (coverUrl) fd.set("cover_image_url", coverUrl);
        startSaving(async () => {
          try {
            if (isEdit) {
              await updateVillagePost(post!.id, fd);
            } else {
              await createVillagePost(fd);
            }
          } catch (e) {
            setError(e instanceof Error ? e.message : "Save failed");
          }
        });
      }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/growing-together/village")}
          className="text-sm text-gray-500 hover:text-brand-dark inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          All posts
        </button>
      </div>

      {/* Category picker */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 lg:p-6">
        <label className="block text-sm font-medium text-brand-dark mb-3">
          Category <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setCategory(opt.value)}
              className={`text-left rounded-lg p-3 border transition ${
                category === opt.value
                  ? "border-brand-blue bg-brand-blue/5 ring-1 ring-brand-blue"
                  : "border-gray-200 hover:border-brand-blue/40"
              }`}
            >
              <div className="text-sm font-heading font-bold text-brand-dark">
                {opt.label}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{opt.description}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Core content */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 lg:p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-brand-dark mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            defaultValue={post?.title ?? ""}
            required
            placeholder="e.g. Free health-visitor drop-in — every Wednesday"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-dark mb-1">Body</label>
          <RichTextEditor
            content={body}
            onChange={setBody}
            placeholder="Tell families what they need to know…"
          />
          <p className="text-xs text-gray-400 mt-1">
            Supports bold, italic, headings, lists. Keep it short and useful.
          </p>
        </div>

        {/* Cover image */}
        <div>
          <label className="block text-sm font-medium text-brand-dark mb-1">
            Cover image
          </label>
          {coverUrl ? (
            <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              {/* Use plain <img> — Supabase Storage URLs aren't in next.config domains */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverUrl}
                alt=""
                className="w-full h-48 object-cover"
              />
              <button
                type="button"
                onClick={() => setCoverUrl(null)}
                className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 rounded-full p-1.5 shadow"
                title="Remove cover"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
              <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-3">
                Optional — a photo makes the post feel alive.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                }}
                className="hidden"
                id="cover-upload"
              />
              <label
                htmlFor="cover-upload"
                className="inline-flex items-center gap-1 text-sm text-brand-blue hover:text-brand-dark cursor-pointer font-medium"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" /> Choose image
                  </>
                )}
              </label>
              {uploadError && (
                <p className="text-xs text-red-600 mt-2">{uploadError}</p>
              )}
            </div>
          )}
        </div>

        {/* Call-to-action link (any category) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">
              Link URL (optional)
            </label>
            <input
              type="url"
              name="link_url"
              defaultValue={post?.link_url ?? ""}
              placeholder="https://…"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">
              Link button text
            </label>
            <input
              type="text"
              name="link_label"
              defaultValue={post?.link_label ?? ""}
              placeholder="e.g. Book a place, Read more"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            />
          </div>
        </div>
      </section>

      {/* Category-specific fields */}
      {category === "activity" && (
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 lg:p-6 space-y-4">
          <h3 className="font-heading font-bold text-brand-dark">Activity details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1">Date</label>
              <input
                type="date"
                name="event_date"
                defaultValue={post?.event_date ?? ""}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1">Time</label>
              <input
                type="time"
                name="event_time"
                defaultValue={post?.event_time ?? ""}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1">Venue</label>
              <input
                type="text"
                name="venue"
                defaultValue={post?.venue ?? ""}
                placeholder="e.g. Ashburton Library, Croydon"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              />
            </div>
          </div>
        </section>
      )}

      {category === "local_service" && (
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 lg:p-6 space-y-4">
          <h3 className="font-heading font-bold text-brand-dark">Service details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1">
                Provider name
              </label>
              <input
                type="text"
                name="provider_name"
                defaultValue={post?.provider_name ?? ""}
                placeholder="e.g. Croydon Health Visitors"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1">
                How to contact
              </label>
              <input
                type="text"
                name="provider_contact"
                defaultValue={post?.provider_contact ?? ""}
                placeholder="Phone, email, or drop-in address"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              />
            </div>
          </div>
        </section>
      )}

      {/* Publishing controls */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 lg:p-6 space-y-4">
        <h3 className="font-heading font-bold text-brand-dark">Publishing</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">Status</label>
            <select
              name="status"
              defaultValue={post?.status ?? "draft"}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            >
              <option value="draft">Draft (only visible to team)</option>
              <option value="published">Published (live for families)</option>
              <option value="archived">Archived (hidden)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">
              Expires at (optional)
            </label>
            <input
              type="datetime-local"
              name="expires_at"
              defaultValue={
                post?.expires_at ? post.expires_at.slice(0, 16) : ""
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">
              Auto-hides from families after this time.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">
              Author name (shown to families)
            </label>
            <input
              type="text"
              name="author_name"
              defaultValue={post?.author_name ?? ""}
              placeholder="e.g. Macram, Programme Lead"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-brand-dark cursor-pointer">
          <input
            type="checkbox"
            name="pinned"
            defaultChecked={post?.pinned ?? false}
          />
          <Pin className="h-4 w-4 text-brand-blue" />
          <span>Pin to the top of Our Village</span>
        </label>
      </section>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        {isEdit && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (confirm("Delete this post? This cannot be undone.")) {
                startDeleting(async () => {
                  await deleteVillagePost(post!.id);
                });
              }
            }}
            disabled={deleting || saving}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-1" />
            )}
            Delete
          </Button>
        )}
        <div className="ml-auto flex gap-2">
          <Button
            type="submit"
            disabled={saving}
            className="bg-brand-blue hover:bg-brand-dark text-white font-heading font-bold"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…
              </>
            ) : isEdit ? (
              <>
                <Save className="h-4 w-4 mr-2" /> Save changes
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" /> Create post
              </>
            )}
          </Button>
        </div>
      </div>

      {isEdit && post?.status === "draft" && (
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <FileText className="h-3 w-3" />
          Currently a draft — change status to “Published” to make it visible to families.
        </p>
      )}
    </form>
  );
}
