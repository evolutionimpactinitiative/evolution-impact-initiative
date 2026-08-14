import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ImageIcon } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { galleryPublicUrl } from "@/lib/gallery/storage";
import type { GalleryAlbum, GalleryImage } from "@/lib/gallery/types";
import { SectionLabel } from "@/components/shared/SectionLabel";

export const revalidate = 60;

interface Props {
  params: Promise<{ albumSlug: string }>;
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { albumSlug } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("gallery_albums")
    .select("name, description")
    .eq("slug", albumSlug)
    .eq("status", "published")
    .maybeSingle();
  const album = data as { name: string; description: string | null } | null;
  return {
    title: album?.name
      ? `${album.name} | Gallery`
      : "Gallery | Evolution Impact Initiative",
    description:
      album?.description ??
      "Photos from Evolution Impact Initiative's community work.",
  };
}

export default async function AlbumPage({ params }: Props) {
  const { albumSlug } = await params;
  const supabase = createAdminClient();

  const { data: albumRow } = await supabase
    .from("gallery_albums")
    .select("*")
    .eq("slug", albumSlug)
    .eq("status", "published")
    .maybeSingle();
  const album = albumRow as GalleryAlbum | null;
  if (!album) notFound();

  const { data: imagesRaw } = await supabase
    .from("gallery_images")
    .select("*")
    .eq("album_id", album.id)
    .eq("status", "published")
    .order("display_order", { ascending: true });
  const images = (imagesRaw as GalleryImage[] | null) ?? [];

  return (
    <main className="bg-white">
      {/* HERO */}
      <section className="bg-gradient-to-br from-brand-blue to-brand-dark text-white pt-28 pb-10 md:pt-36 md:pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <Link
            href="/gallery"
            className="flex w-fit items-center gap-1.5 text-sm text-white/70 hover:text-brand-accent mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            All albums
          </Link>
          <div className="mb-3">
            <SectionLabel
              text={`${images.length} photo${images.length === 1 ? "" : "s"}`}
              color="brand-accent"
            />
          </div>
          <h1 className="font-heading font-black text-3xl md:text-5xl leading-none mb-3">
            {album.name}
          </h1>
          {album.description && (
            <p className="text-white/80 max-w-2xl leading-relaxed">
              {album.description}
            </p>
          )}
        </div>
      </section>

      {/* GRID */}
      <section className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
        {images.length === 0 ? (
          <div className="bg-brand-pale/40 rounded-2xl p-10 text-center">
            <ImageIcon className="h-10 w-10 text-brand-blue mx-auto mb-3" />
            <p className="font-heading font-bold text-brand-dark">
              No photos in this album yet
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
            {images.map((img) => (
              <Link
                key={img.id}
                href={`/gallery/${album.slug}/${img.id}`}
                className="group relative aspect-square bg-brand-pale/40 rounded-lg overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={galleryPublicUrl(img.storage_path)}
                  alt={img.alt_text ?? img.title ?? ""}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                {img.title && (
                  <div className="absolute inset-0 flex items-end p-2 opacity-0 group-hover:opacity-100 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity">
                    <p className="text-white text-xs font-heading font-bold truncate">
                      {img.title}
                    </p>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
