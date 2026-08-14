import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { galleryPublicUrl } from "@/lib/gallery/storage";
import type { GalleryComment, GalleryImage, GalleryAlbum } from "@/lib/gallery/types";
import { GalleryCommentModerationRow } from "@/components/admin/gallery/GalleryCommentModerationRow";

type StatusFilter = "pending" | "approved" | "rejected" | "spam" | "all";

const TABS: Array<{ key: StatusFilter; label: string }> = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "spam", label: "Spam" },
  { key: "all", label: "All" },
];

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function GalleryCommentsAdminPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const activeTab = ((TABS.find((t) => t.key === params.status)?.key) ??
    "pending") as StatusFilter;

  const supabase = createAdminClient();

  const { data: allRaw } = await supabase
    .from("gallery_comments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  const all = (allRaw as GalleryComment[] | null) ?? [];

  const counts: Record<StatusFilter, number> = {
    pending: all.filter((c) => c.status === "pending").length,
    approved: all.filter((c) => c.status === "approved").length,
    rejected: all.filter((c) => c.status === "rejected").length,
    spam: all.filter((c) => c.status === "spam").length,
    all: all.length,
  };

  const filtered =
    activeTab === "all" ? all : all.filter((c) => c.status === activeTab);

  // Load referenced images + albums so the row can link back to context
  const imageIds = Array.from(new Set(filtered.map((c) => c.image_id)));
  const { data: imgRows } = imageIds.length
    ? await supabase
        .from("gallery_images")
        .select("id, storage_path, album_id, title")
        .in("id", imageIds)
    : { data: [] as Pick<
        GalleryImage,
        "id" | "storage_path" | "album_id" | "title"
      >[] };
  const imageById = new Map<
    string,
    { storage_path: string; album_id: string | null; title: string | null }
  >();
  for (const r of (imgRows as Pick<
    GalleryImage,
    "id" | "storage_path" | "album_id" | "title"
  >[] | null) ?? []) {
    imageById.set(r.id, {
      storage_path: r.storage_path,
      album_id: r.album_id,
      title: r.title,
    });
  }
  const albumIds = Array.from(
    new Set(
      Array.from(imageById.values())
        .map((v) => v.album_id)
        .filter(Boolean) as string[],
    ),
  );
  const { data: albumRows } = albumIds.length
    ? await supabase
        .from("gallery_albums")
        .select("id, slug, name")
        .in("id", albumIds)
    : { data: [] as Pick<GalleryAlbum, "id" | "slug" | "name">[] };
  const albumById = new Map<string, { slug: string; name: string }>();
  for (const r of (albumRows as Pick<
    GalleryAlbum,
    "id" | "slug" | "name"
  >[] | null) ?? []) {
    albumById.set(r.id, { slug: r.slug, name: r.name });
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/gallery"
          className="text-sm text-gray-600 hover:text-brand-dark inline-flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to gallery
        </Link>
        <h1 className="text-2xl md:text-3xl font-heading font-black text-brand-dark">
          Moderate comments
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Every comment lands as <strong>pending</strong>. Approve to make
          it public, reject or delete anything spammy.
        </p>
      </div>

      {/* Tabs — horizontal scroll on mobile */}
      <div className="-mx-4 md:mx-0 px-4 md:px-0 border-b border-gray-200 pb-3">
        <div className="flex md:flex-wrap gap-2 overflow-x-auto md:overflow-visible no-scrollbar">
          {TABS.map((t) => {
            const isActive = t.key === activeTab;
            const href =
              t.key === "pending"
                ? "/admin/gallery/comments"
                : `/admin/gallery/comments?status=${t.key}`;
            return (
              <Link
                key={t.key}
                href={href}
                className={
                  (isActive
                    ? "bg-brand-blue text-white "
                    : "bg-white text-brand-dark border border-gray-200 hover:border-brand-blue ") +
                  "shrink-0 px-3.5 md:px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest"
                }
              >
                {t.label}
                <span
                  className={`ml-2 text-xs ${isActive ? "text-white/70" : "text-gray-500"}`}
                >
                  {counts[t.key]}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <MessageSquare className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <p className="font-heading font-bold text-brand-dark">
            No comments in this bucket
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const img = imageById.get(c.image_id);
            const album = img?.album_id
              ? albumById.get(img.album_id)
              : null;
            return (
              <GalleryCommentModerationRow
                key={c.id}
                comment={c}
                imageUrl={img ? galleryPublicUrl(img.storage_path) : null}
                imageTitle={img?.title ?? null}
                albumSlug={album?.slug ?? null}
                albumName={album?.name ?? null}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
