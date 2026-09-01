// Helpers around the "village-images" Supabase storage bucket.

const BUCKET = "village-images";

export const VILLAGE_BUCKET = BUCKET;

// Public URL from a storage path. Bucket is public so we can derive the
// URL without a signed URL call.
export function villagePublicUrl(storagePath: string): string {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}

export function makeVillageStoragePath(originalName: string): string {
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
