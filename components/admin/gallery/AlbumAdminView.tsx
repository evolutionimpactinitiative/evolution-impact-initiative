"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Loader2,
  Pencil,
  Trash2,
  Settings,
  Star,
  Check,
} from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { galleryPublicUrl } from "@/lib/gallery/storage";
import type { GalleryAlbum, GalleryImage } from "@/lib/gallery/types";
import { SortableImageGrid } from "@/components/admin/gallery/SortableImageGrid";

interface Props {
  album: GalleryAlbum;
  images: GalleryImage[];
}

export function AlbumAdminView({ album, images }: Props) {
  const router = useRouter();
  const [uploading, setUploading] = React.useState<number>(0);
  const [uploadTotal, setUploadTotal] = React.useState<number>(0);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<GalleryImage | null>(null);
  const [albumSettings, setAlbumSettings] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setUploadTotal(files.length);
    setUploading(0);
    for (let i = 0; i < files.length; i++) {
      const original = files[i];
      try {
        // Client-side resize/compress — screenshots off a retina Mac are
        // usually 5-10 MB PNG which blows through the request body limit
        // AND is way bigger than the gallery ever needs.
        const prepared = await prepareForUpload(original);
        const form = new FormData();
        form.append("file", prepared.file);
        form.append("albumId", album.id);
        form.append("status", "published");
        if (prepared.width) form.append("width", String(prepared.width));
        if (prepared.height) form.append("height", String(prepared.height));
        const res = await fetch("/api/gallery/images", {
          method: "POST",
          body: form,
        });
        // Server may reject before our JSON handler runs (e.g. 413 Request
        // Entity Too Large from the platform) — parse defensively.
        const raw = await res.text();
        let data: { error?: string } = {};
        try {
          data = raw ? (JSON.parse(raw) as { error?: string }) : {};
        } catch {
          if (res.status === 413) {
            throw new Error(
              "Still too big after compression — try a smaller file.",
            );
          }
          throw new Error(
            res.ok
              ? "Server sent an unexpected response — image might still have uploaded, refresh to check."
              : `Upload failed (HTTP ${res.status}).`,
          );
        }
        if (!res.ok) throw new Error(data?.error || "Upload failed");
      } catch (e) {
        setUploadError(
          e instanceof Error
            ? `${original.name}: ${e.message}`
            : `${original.name}: upload failed`,
        );
        break;
      }
      setUploading(i + 1);
    }
    setUploadTotal(0);
    setUploading(0);
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploadTotal > 0}
          className="inline-flex items-center gap-1.5 bg-brand-blue text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50"
        >
          {uploadTotal > 0 ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading {uploading} / {uploadTotal}…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload images
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => setAlbumSettings(true)}
          className="inline-flex items-center gap-1.5 bg-white text-brand-dark border border-gray-200 hover:border-brand-blue px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest"
        >
          <Settings className="h-4 w-4" />
          Album settings
        </button>
        <p className="text-xs text-gray-500 ml-auto">
          JPG · PNG · WebP · HEIC · big files auto-compressed
        </p>
      </div>

      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          {uploadError}
        </div>
      )}

      {/* Sortable image grid */}
      {images.length > 0 && (
        <SortableImageGrid
          albumId={album.id}
          images={images}
          coverImageId={album.cover_image_id}
          onEdit={(img) => setEditing(img)}
          onCoverToggle={(id) => setAsCover(id)}
        />
      )}

      {/* Edit sheet */}
      <EditImageSheet
        image={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          router.refresh();
        }}
      />

      {/* Album settings sheet */}
      <AlbumSettingsSheet
        open={albumSettings}
        album={album}
        onClose={() => setAlbumSettings(false)}
        onSaved={() => {
          setAlbumSettings(false);
          router.refresh();
        }}
      />
    </div>
  );

  async function setAsCover(imageId: string) {
    try {
      const res = await fetch(`/api/gallery/albums/${album.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cover_image_id: imageId }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.refresh();
    } catch {
      // silent — the user can retry
    }
  }
}

function EditImageSheet({
  image,
  onClose,
  onSaved,
}: {
  image: GalleryImage | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    alt_text: "",
    photographer_credit: "",
    status: "published" as GalleryImage["status"],
  });
  const [busy, setBusy] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (image) {
      setForm({
        title: image.title ?? "",
        description: image.description ?? "",
        alt_text: image.alt_text ?? "",
        photographer_credit: image.photographer_credit ?? "",
        status: image.status,
      });
      setError(null);
    }
  }, [image]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!image) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/gallery/images/${image.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function del() {
    if (!image) return;
    const ok = confirm(
      "Delete this image? The file is removed from storage and can't be recovered.",
    );
    if (!ok) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/gallery/images/${image.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Delete failed");
      }
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setDeleting(false);
    }
  }

  return (
    <BottomSheet
      open={!!image}
      onClose={() => !busy && !deleting && onClose()}
      title="Edit image"
    >
      {image && (
        <form onSubmit={save} className="space-y-3">
          <div className="aspect-[4/3] bg-brand-pale/40 rounded-xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={galleryPublicUrl(image.storage_path)}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <label className="block">
            <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
              Title
            </span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
              Description
            </span>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
              placeholder="Shown below the image on its public page."
            />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
                Alt text (a11y)
              </span>
              <input
                type="text"
                value={form.alt_text}
                onChange={(e) =>
                  setForm({ ...form, alt_text: e.target.value })
                }
                className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
                placeholder="What's in the image, for screen readers"
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
                Photographer credit
              </span>
              <input
                type="text"
                value={form.photographer_credit}
                onChange={(e) =>
                  setForm({
                    ...form,
                    photographer_credit: e.target.value,
                  })
                }
                className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
                placeholder="e.g. Photo by …"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
              Status
            </span>
            <select
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as GalleryImage["status"],
                })
              }
              className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
            >
              <option value="published">Published (public)</option>
              <option value="draft">Draft (admin only)</option>
              <option value="archived">Archived (hidden)</option>
            </select>
          </label>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 sm:gap-3 pt-2">
            <button
              type="button"
              onClick={del}
              disabled={busy || deleting}
              className="inline-flex items-center justify-center gap-1.5 bg-white text-red-700 border border-red-200 px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </button>
            <button
              type="submit"
              disabled={busy || deleting}
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-brand-blue text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Save changes
            </button>
          </div>
        </form>
      )}
    </BottomSheet>
  );
}

function AlbumSettingsSheet({
  open,
  album,
  onClose,
  onSaved,
}: {
  open: boolean;
  album: GalleryAlbum;
  onClose: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = React.useState({
    name: album.name,
    description: album.description ?? "",
    status: album.status,
  });
  const [busy, setBusy] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setForm({
        name: album.name,
        description: album.description ?? "",
        status: album.status,
      });
      setError(null);
    }
  }, [open, album]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/gallery/albums/${album.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function del() {
    const ok = confirm(
      "Delete this album? Images inside will be unlinked (not deleted).",
    );
    if (!ok) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/gallery/albums/${album.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      router.push("/admin/gallery");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setDeleting(false);
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => !busy && !deleting && onClose()}
      title="Album settings"
    >
      <form onSubmit={save} className="space-y-3">
        <label className="block">
          <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
            Name
          </span>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
            Description
          </span>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
            Status
          </span>
          <select
            value={form.status}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value as GalleryAlbum["status"],
              })
            }
            className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
          >
            <option value="published">Published (public)</option>
            <option value="draft">Draft (admin only)</option>
            <option value="archived">Archived (hidden)</option>
          </select>
        </label>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 sm:gap-3 pt-2">
          <button
            type="button"
            onClick={del}
            disabled={busy || deleting}
            className="inline-flex items-center justify-center gap-1.5 bg-white text-red-700 border border-red-200 px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete album
          </button>
          <button
            type="submit"
            disabled={busy || deleting}
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-brand-blue text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Save
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}

// Max dimension on the long edge — a gallery image never needs to be
// bigger than this, and it drops file size dramatically vs the raw file.
const GALLERY_MAX_DIMENSION = 2400;
// Anything under this stays as-is (no point re-encoding a small JPEG).
const GALLERY_COMPRESS_THRESHOLD_BYTES = 1_500_000;

// Reads dimensions AND downscales/recompresses the file if needed. Retina
// screenshots off macOS are commonly 5–10 MB PNG which trips the platform
// body-size limit; we output JPEG @ 0.9 which keeps the visual quality
// high but usually lands well under 500 KB.
//
// HEIC/HEIF can't be decoded by canvas in most browsers — we pass them
// through unchanged and let the server-side accept/reject.
async function prepareForUpload(file: File): Promise<{
  file: File;
  width: number;
  height: number;
}> {
  const isHeic =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.(heic|heif)$/i.test(file.name);
  if (isHeic) {
    return { file, width: 0, height: 0 };
  }

  const bitmap = await loadBitmap(file);
  if (!bitmap) {
    return { file, width: 0, height: 0 };
  }
  const nativeW = bitmap.width;
  const nativeH = bitmap.height;

  const long = Math.max(nativeW, nativeH);
  const needsResize = long > GALLERY_MAX_DIMENSION;
  const needsCompress =
    needsResize || file.size > GALLERY_COMPRESS_THRESHOLD_BYTES;

  if (!needsCompress) {
    return { file, width: nativeW, height: nativeH };
  }

  const scale = needsResize ? GALLERY_MAX_DIMENSION / long : 1;
  const targetW = Math.round(nativeW * scale);
  const targetH = Math.round(nativeH * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { file, width: nativeW, height: nativeH };
  }
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close?.();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.9),
  );
  if (!blob) {
    return { file, width: nativeW, height: nativeH };
  }

  // Preserve the stem but force .jpg since we re-encoded as JPEG.
  const stem = file.name.replace(/\.[^./\\]+$/, "");
  const compressed = new File([blob], `${stem}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
  return { file: compressed, width: targetW, height: targetH };
}

async function loadBitmap(file: File): Promise<ImageBitmap | null> {
  // Prefer createImageBitmap when available (faster + off main thread).
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // fall through
    }
  }
  // Fallback: draw via <img> then re-wrap.
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = async () => {
      try {
        const bmp = await createImageBitmap(img);
        URL.revokeObjectURL(url);
        resolve(bmp);
      } catch {
        URL.revokeObjectURL(url);
        resolve(null);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}
