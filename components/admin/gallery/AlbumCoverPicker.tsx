"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, ImageIcon, Star, Check, X } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { galleryPublicUrl } from "@/lib/gallery/storage";
import type { GalleryAlbum, GalleryImage } from "@/lib/gallery/types";

interface Props {
  album: GalleryAlbum;
  images: GalleryImage[];
}

export function AlbumCoverPicker({ album, images }: Props) {
  const router = useRouter();
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const currentCover = React.useMemo(
    () => images.find((i) => i.id === album.cover_image_id) ?? null,
    [album.cover_image_id, images],
  );

  async function setCover(imageId: string | null) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/gallery/albums/${album.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cover_image_id: imageId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setPickerOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5">
        <div className="flex items-start gap-4">
          {/* Preview */}
          <div className="w-24 h-24 md:w-28 md:h-28 shrink-0 rounded-xl overflow-hidden bg-brand-pale/40 relative">
            {currentCover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={galleryPublicUrl(currentCover.storage_path)}
                alt={currentCover.alt_text ?? currentCover.title ?? "Cover"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <ImageIcon className="h-8 w-8" />
              </div>
            )}
          </div>

          {/* Meta + actions */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <Star className="h-4 w-4 text-brand-accent" />
              <p className="text-xs uppercase tracking-widest font-heading font-bold text-brand-blue">
                Album cover
              </p>
            </div>
            <p className="font-heading font-bold text-brand-dark truncate">
              {currentCover
                ? currentCover.title || "Untitled image"
                : "No cover selected"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {currentCover
                ? "This image represents the album on the public gallery grid."
                : "Public gallery shows a placeholder until you pick one."}
            </p>
            {error && <p className="text-xs text-red-700 mt-2">{error}</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                disabled={busy || images.length === 0}
                className="inline-flex items-center gap-1.5 bg-brand-blue text-white px-3 py-1.5 rounded-md text-xs font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Star className="h-3.5 w-3.5" />
                )}
                {currentCover ? "Change cover" : "Pick cover"}
              </button>
              {currentCover && (
                <button
                  type="button"
                  onClick={() => setCover(null)}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 bg-white text-brand-dark border border-gray-200 hover:border-brand-blue px-3 py-1.5 rounded-md text-xs font-heading font-bold uppercase tracking-widest disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear
                </button>
              )}
            </div>
            {images.length === 0 && (
              <p className="text-xs text-gray-400 mt-2">
                Upload at least one image before you can pick a cover.
              </p>
            )}
          </div>
        </div>
      </div>

      <BottomSheet
        open={pickerOpen}
        onClose={() => !busy && setPickerOpen(false)}
        title="Pick a cover image"
      >
        <p className="text-sm text-gray-600 mb-3">
          Tap the image you want to represent this album on the public
          gallery grid.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {images.map((img) => {
            const isCurrent = album.cover_image_id === img.id;
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => setCover(img.id)}
                disabled={busy}
                className={
                  "relative aspect-square rounded-lg overflow-hidden border-2 transition-colors disabled:opacity-50 " +
                  (isCurrent
                    ? "border-brand-accent"
                    : "border-transparent hover:border-brand-blue")
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={galleryPublicUrl(img.storage_path)}
                  alt={img.alt_text ?? img.title ?? ""}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {isCurrent && (
                  <span className="absolute top-1 right-1 bg-brand-accent text-brand-dark rounded-full w-6 h-6 flex items-center justify-center">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </>
  );
}
