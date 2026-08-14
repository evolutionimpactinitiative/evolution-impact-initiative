import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Camera } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { galleryPublicUrl } from "@/lib/gallery/storage";
import type { GalleryAlbum, GalleryImage } from "@/lib/gallery/types";

export const revalidate = 60;

interface Props {
  params: Promise<{ albumSlug: string; imageId: string }>;
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { imageId } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("gallery_images")
    .select("title, description, storage_path")
    .eq("id", imageId)
    .eq("status", "published")
    .maybeSingle();
  const img = data as {
    title: string | null;
    description: string | null;
    storage_path: string;
  } | null;
  return {
    title: img?.title ? `${img.title} | Gallery` : "Gallery photo",
    description: img?.description ?? undefined,
    openGraph: img
      ? {
          images: [{ url: galleryPublicUrl(img.storage_path) }],
        }
      : undefined,
  };
}

export default async function ImageDetailPage({ params }: Props) {
  const { albumSlug, imageId } = await params;
  const supabase = createAdminClient();

  const { data: albumRow } = await supabase
    .from("gallery_albums")
    .select("*")
    .eq("slug", albumSlug)
    .eq("status", "published")
    .maybeSingle();
  const album = albumRow as GalleryAlbum | null;
  if (!album) notFound();

  // Load current image
  const { data: imgRow } = await supabase
    .from("gallery_images")
    .select("*")
    .eq("id", imageId)
    .eq("album_id", album.id)
    .eq("status", "published")
    .maybeSingle();
  const image = imgRow as GalleryImage | null;
  if (!image) notFound();

  // Prev / next within the same album — small query, fine to run inline.
  const { data: siblingsRaw } = await supabase
    .from("gallery_images")
    .select("id, display_order")
    .eq("album_id", album.id)
    .eq("status", "published")
    .order("display_order", { ascending: true });
  const siblings =
    (siblingsRaw as { id: string; display_order: number }[] | null) ?? [];
  const idx = siblings.findIndex((s) => s.id === image.id);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  return (
    <main className="bg-white">
      {/* IMAGE + META */}
      <section className="bg-brand-dark text-white pt-24 pb-6 md:pt-28 md:pb-10">
        <div className="container mx-auto max-w-5xl px-4">
          <Link
            href={`/gallery/${album.slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-brand-accent mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            {album.name}
          </Link>
          <div className="rounded-2xl overflow-hidden bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={galleryPublicUrl(image.storage_path)}
              alt={image.alt_text ?? image.title ?? album.name}
              className="w-full h-auto object-contain max-h-[70svh] mx-auto"
            />
          </div>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              {image.title && (
                <h1 className="font-heading font-black text-2xl md:text-3xl leading-tight">
                  {image.title}
                </h1>
              )}
              {image.photographer_credit && (
                <p className="text-sm text-white/70 mt-1 inline-flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-brand-accent" />
                  {image.photographer_credit}
                </p>
              )}
            </div>
            <nav className="flex items-center gap-2 shrink-0">
              {prev ? (
                <Link
                  href={`/gallery/${album.slug}/${prev.id}`}
                  className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-md text-xs font-heading font-bold uppercase tracking-widest"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 bg-white/5 text-white/30 px-3 py-2 rounded-md text-xs font-heading font-bold uppercase tracking-widest">
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </span>
              )}
              {next ? (
                <Link
                  href={`/gallery/${album.slug}/${next.id}`}
                  className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-md text-xs font-heading font-bold uppercase tracking-widest"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 bg-white/5 text-white/30 px-3 py-2 rounded-md text-xs font-heading font-bold uppercase tracking-widest">
                  Next
                  <ChevronRight className="h-4 w-4" />
                </span>
              )}
            </nav>
          </div>
        </div>
      </section>

      {/* DESCRIPTION + COMMENTS SLOT */}
      <section className="container mx-auto max-w-3xl px-4 py-10 md:py-14 space-y-8">
        {image.description && (
          <article className="prose prose-brand max-w-none">
            <p>{image.description}</p>
          </article>
        )}

        <div className="border-t border-gray-200 pt-8">
          <h2 className="font-heading font-black text-xl text-brand-dark mb-4">
            Comments
          </h2>
          <p className="text-sm text-gray-500">
            Comments arrive in the next update — this page is ready for them.
          </p>
        </div>
      </section>
    </main>
  );
}
