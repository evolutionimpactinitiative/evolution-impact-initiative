import type { Metadata } from "next";
import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { galleryPublicUrl } from "@/lib/gallery/storage";
import type { GalleryAlbum, GalleryImage } from "@/lib/gallery/types";
import { SectionLabel } from "@/components/shared/SectionLabel";

export const metadata: Metadata = {
  title: "Gallery | Evolution Impact Initiative",
  description:
    "Photos from Evolution Impact Initiative's community work across Medway — Back to School Drives, Evolution Fest, and everything in between.",
};

export const revalidate = 60;

export default async function GalleryLandingPage() {
  const supabase = createAdminClient();

  const { data: albumsRaw } = await supabase
    .from("gallery_albums")
    .select("*")
    .eq("status", "published")
    .order("display_order", { ascending: true });
  const albums = (albumsRaw as GalleryAlbum[] | null) ?? [];

  const albumIds = albums.map((a) => a.id);
  const coverIds = albums
    .map((a) => a.cover_image_id)
    .filter(Boolean) as string[];

  const [countsRes, coversRes] = await Promise.all([
    albumIds.length
      ? supabase
          .from("gallery_images")
          .select("album_id")
          .in("album_id", albumIds)
          .eq("status", "published")
      : Promise.resolve({ data: [] as { album_id: string | null }[] }),
    coverIds.length
      ? supabase
          .from("gallery_images")
          .select("id, storage_path, alt_text, title")
          .in("id", coverIds)
      : Promise.resolve({
          data: [] as Pick<
            GalleryImage,
            "id" | "storage_path" | "alt_text" | "title"
          >[],
        }),
  ]);

  const countByAlbum = new Map<string, number>();
  for (const r of (countsRes.data as { album_id: string | null }[] | null) ??
    []) {
    if (!r.album_id) continue;
    countByAlbum.set(r.album_id, (countByAlbum.get(r.album_id) ?? 0) + 1);
  }
  const coverById = new Map<
    string,
    Pick<GalleryImage, "storage_path" | "alt_text" | "title">
  >();
  for (const c of (coversRes.data as Pick<
    GalleryImage,
    "id" | "storage_path" | "alt_text" | "title"
  >[] | null) ?? []) {
    coverById.set(c.id, {
      storage_path: c.storage_path,
      alt_text: c.alt_text,
      title: c.title,
    });
  }

  return (
    <main className="bg-white">
      {/* HERO */}
      <section className="bg-gradient-to-br from-brand-blue to-brand-dark text-white pt-28 pb-14 md:pt-36 md:pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <SectionLabel text="Gallery" color="brand-accent" className="mb-4" />
          <h1 className="font-heading font-black text-3xl md:text-5xl leading-none mb-4">
            Moments from our community
          </h1>
          <p className="text-white/80 max-w-2xl leading-relaxed">
            Photos from Back to School Drives, Evolution Fest, workshops and
            the everyday small acts that make big impact across Medway. Tap
            an album to explore.
          </p>
        </div>
      </section>

      {/* ALBUMS */}
      <section className="container mx-auto max-w-6xl px-4 py-12 md:py-16">
        {albums.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {albums.map((a) => {
              const cover = a.cover_image_id
                ? coverById.get(a.cover_image_id)
                : null;
              const count = countByAlbum.get(a.id) ?? 0;
              return (
                <Link
                  key={a.id}
                  href={`/gallery/${a.slug}`}
                  className="group bg-white rounded-2xl border border-gray-200 hover:border-brand-blue overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="aspect-[4/3] bg-brand-pale/40 relative overflow-hidden">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={galleryPublicUrl(cover.storage_path)}
                        alt={cover.alt_text ?? cover.title ?? a.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ImageIcon className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-heading font-black text-brand-dark text-lg leading-tight">
                      {a.name}
                    </h3>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-heading font-bold mt-1">
                      {count} photo{count === 1 ? "" : "s"}
                    </p>
                    {a.description && (
                      <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                        {a.description}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="bg-brand-pale/40 rounded-2xl p-12 text-center">
      <ImageIcon className="h-12 w-12 text-brand-blue mx-auto mb-4" />
      <p className="font-heading font-bold text-brand-dark text-xl">
        Gallery coming soon
      </p>
      <p className="text-gray-600 mt-2 max-w-md mx-auto">
        We&rsquo;re curating photos from our community work. Check back soon
        or follow us on Instagram for the latest.
      </p>
    </div>
  );
}
