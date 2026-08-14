import Link from "next/link";
import { Plus, ImageIcon, ArrowRight } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { galleryPublicUrl } from "@/lib/gallery/storage";
import type { GalleryAlbum, GalleryImage } from "@/lib/gallery/types";
import { CreateAlbumButton } from "@/components/admin/gallery/CreateAlbumButton";

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
        <CreateAlbumButton />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {albums.map((a) => {
            const coverPath = a.cover_image_id
              ? coverById.get(a.cover_image_id)
              : null;
            const count = countByAlbum.get(a.id) ?? 0;
            return (
              <Link
                key={a.id}
                href={`/admin/gallery/albums/${a.slug}`}
                className="group bg-white rounded-2xl border border-gray-200 hover:border-brand-blue overflow-hidden transition-colors"
              >
                <div className="aspect-[4/3] bg-brand-pale/40 relative">
                  {coverPath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={galleryPublicUrl(coverPath)}
                      alt={a.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ImageIcon className="h-10 w-10" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span
                      className={
                        (a.status === "published"
                          ? "bg-emerald-100 text-emerald-800"
                          : a.status === "draft"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-100 text-gray-700") +
                        " inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-heading font-bold uppercase tracking-widest"
                      }
                    >
                      {a.status}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-heading font-bold text-brand-dark truncate">
                    {a.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {count} image{count === 1 ? "" : "s"} · /gallery/{a.slug}
                  </p>
                  {a.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {a.description}
                    </p>
                  )}
                  <span className="inline-flex items-center gap-1 text-brand-blue text-xs font-heading font-bold uppercase tracking-widest mt-3 group-hover:translate-x-0.5 transition-transform">
                    Manage
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
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
