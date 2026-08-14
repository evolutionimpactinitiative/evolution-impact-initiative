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
      const file = files[i];
      try {
        // Read dimensions client-side so we can store them for layout.
        const { width, height } = await readImageDimensions(file);
        const form = new FormData();
        form.append("file", file);
        form.append("albumId", album.id);
        form.append("status", "published");
        if (width) form.append("width", String(width));
        if (height) form.append("height", String(height));
        const res = await fetch("/api/gallery/images", {
          method: "POST",
          body: form,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Upload failed");
      } catch (e) {
        setUploadError(
          e instanceof Error
            ? `${file.name}: ${e.message}`
            : `${file.name}: upload failed`,
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
          JPG · PNG · WebP · HEIC · max 10 MB each
        </p>
      </div>

      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          {uploadError}
        </div>
      )}

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((img) => (
            <ImageCard
              key={img.id}
              image={img}
              isCover={album.cover_image_id === img.id}
              onEdit={() => setEditing(img)}
              onCoverToggle={() => setAsCover(img.id)}
            />
          ))}
        </div>
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

function ImageCard({
  image,
  isCover,
  onEdit,
  onCoverToggle,
}: {
  image: GalleryImage;
  isCover: boolean;
  onEdit: () => void;
  onCoverToggle: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden group">
      <div className="aspect-[4/3] bg-brand-pale/40 relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={galleryPublicUrl(image.storage_path)}
          alt={image.alt_text ?? image.title ?? ""}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {isCover && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-brand-accent text-brand-dark text-[10px] font-heading font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
            <Star className="h-3 w-3" />
            Cover
          </span>
        )}
        {image.status !== "published" && (
          <span className="absolute top-2 right-2 inline-flex items-center bg-amber-100 text-amber-800 text-[10px] font-heading font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
            {image.status}
          </span>
        )}
      </div>
      <div className="p-2 flex items-center gap-1.5">
        <p className="flex-1 text-xs text-brand-dark truncate">
          {image.title || "Untitled"}
        </p>
        <button
          type="button"
          onClick={onCoverToggle}
          title="Set as album cover"
          className={
            (isCover ? "text-brand-accent " : "text-gray-400 ") +
            "hover:text-brand-blue p-1"
          }
        >
          <Star className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="text-gray-500 hover:text-brand-blue p-1"
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
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

// Read pixel dimensions from a client-side File without uploading it.
// Used so we can store width/height and lay out the grid without CLS.
function readImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const dims = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(url);
      resolve(dims);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 0, height: 0 });
    };
    img.src = url;
  });
}
