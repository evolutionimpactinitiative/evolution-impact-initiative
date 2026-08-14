// Helpers around the "gallery" Supabase storage bucket.

const BUCKET = "gallery";

// Public URL from a storage path. Bucket is public so we can derive the
// URL without a signed URL call — keeps public pages fast.
export function galleryPublicUrl(storagePath: string): string {
  const base = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  ).replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}

export const GALLERY_BUCKET = BUCKET;

// slug-safe filename: lowercase, replace spaces + non-word chars with -,
// keep the extension, prepend a random hex prefix so uploads never collide.
export function makeStoragePath(originalName: string): string {
  const dot = originalName.lastIndexOf(".");
  const ext = dot >= 0 ? originalName.slice(dot + 1).toLowerCase() : "jpg";
  const stem = (dot >= 0 ? originalName.slice(0, dot) : originalName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const prefix = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${stem || "image"}.${ext}`;
}
