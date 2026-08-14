import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ImageIcon } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import type { GalleryAlbum, GalleryImage } from "@/lib/gallery/types";
import { AlbumAdminView } from "@/components/admin/gallery/AlbumAdminView";
import { AlbumCoverPicker } from "@/components/admin/gallery/AlbumCoverPicker";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AlbumAdminPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: albumRow } = await supabase
    .from("gallery_albums")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  const album = albumRow as GalleryAlbum | null;
  if (!album) notFound();

  const { data: imagesRaw } = await supabase
    .from("gallery_images")
    .select("*")
    .eq("album_id", album.id)
    .order("display_order", { ascending: true });
  const images = (imagesRaw as GalleryImage[] | null) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/gallery"
          className="text-sm text-gray-600 hover:text-brand-dark inline-flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All albums
        </Link>
        <h1 className="text-2xl md:text-3xl font-heading font-black text-brand-dark">
          {album.name}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          /gallery/{album.slug} · {images.length} image
          {images.length === 1 ? "" : "s"} · status {album.status}
        </p>
      </div>

      <AlbumCoverPicker album={album} images={images} />

      <AlbumAdminView album={album} images={images} />

      {images.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <ImageIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <p className="font-heading font-bold text-brand-dark">
            No images yet
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Use the upload button above to add your first image.
          </p>
        </div>
      )}
    </div>
  );
}
