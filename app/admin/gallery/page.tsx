import Link from "next/link";
import { ImageIcon, MessageSquare } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import type { GalleryAlbum, GalleryImage } from "@/lib/gallery/types";
import { CreateAlbumButton } from "@/components/admin/gallery/CreateAlbumButton";
import { SortableAlbumGrid } from "@/components/admin/gallery/SortableAlbumGrid";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function GalleryAdminPage() {
  const supabase = createAdminClient();

  const { data: albumsRaw } = await supabase
    .from("gallery_albums")
    .select("*")
    .order("display_order", { ascending: true });
  const albums = (albumsRaw as GalleryAlbum[] | null) ?? [];

  const albumIds = albums.map((a) => a.id);
  const { data: countsRaw } = albumIds.length
    ? await supabase
        .from("gallery_images")
        .select("album_id")
        .in("album_id", albumIds)
    : { data: [] as { album_id: string | null }[] };
  const countByAlbum = new Map<string, number>();
  for (const r of (countsRaw as { album_id: string | null }[] | null) ?? []) {
    if (!r.album_id) continue;
    countByAlbum.set(r.album_id, (countByAlbum.get(r.album_id) ?? 0) + 1);
  }

  const coverIds = albums
    .map((a) => a.cover_image_id)
    .filter(Boolean) as string[];
  const { data: coversRaw } = coverIds.length
    ? await supabase
        .from("gallery_images")
        .select("id, storage_path")
        .in("id", coverIds)
    : { data: [] as Pick<GalleryImage, "id" | "storage_path">[] };
  const coverById = new Map<string, string>();
  for (const c of (coversRaw as Pick<
    GalleryImage,
    "id" | "storage_path"
  >[] | null) ?? []) {
    coverById.set(c.id, c.storage_path);
  }

  // Uncategorised image count so admin can see if there's a bucket to
  // clean up.
  const { count: uncategorised } = await supabase
    .from("gallery_images")
    .select("id", { count: "exact", head: true })
    .is("album_id", null);

  const { count: pendingComments } = await supabase
    .from("gallery_comments")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-black text-brand-dark">
            Gallery
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Group your images into albums. Each album has its own page and its
            own url on the public gallery.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/gallery/comments"
            className="inline-flex items-center gap-1.5 bg-white text-brand-dark border border-gray-200 hover:border-brand-blue px-3 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest"
          >
            <MessageSquare className="h-4 w-4" />
            Comments
            {(pendingComments ?? 0) > 0 && (
              <span className="ml-1 bg-amber-100 text-amber-800 rounded-full px-1.5 py-0.5 text-[10px]">
                {pendingComments}
              </span>
            )}
          </Link>
          <CreateAlbumButton />
        </div>
      </div>

      {albums.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <ImageIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <p className="font-heading font-bold text-brand-dark">
            No albums yet
          </p>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            Create your first album (e.g. &ldquo;Back to School 2026&rdquo;)
            then upload images into it.
          </p>
        </div>
      ) : (
        <SortableAlbumGrid
          albums={albums.map((a) => ({
            album: a,
            count: countByAlbum.get(a.id) ?? 0,
            coverPath: a.cover_image_id
              ? coverById.get(a.cover_image_id) ?? null
              : null,
          }))}
        />
      )}

      {(uncategorised ?? 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
          <p className="font-heading font-bold uppercase tracking-widest text-xs mb-1">
            {uncategorised} uncategorised image{uncategorised === 1 ? "" : "s"}
          </p>
          <p>
            These images aren&rsquo;t attached to an album so they won&rsquo;t
            appear on the public gallery. Assign them to an album via the
            all-images admin view (coming soon) or ping me.
          </p>
        </div>
      )}
    </div>
  );
}
