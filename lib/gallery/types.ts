// Shared types for the public gallery + admin surface.

export type GalleryStatus = "draft" | "published" | "archived";
export type CommentStatus = "pending" | "approved" | "rejected" | "spam";

export interface GalleryAlbum {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  cover_image_id: string | null;
  display_order: number;
  status: GalleryStatus;
  created_at: string;
  updated_at: string;
}

export interface GalleryImage {
  id: string;
  album_id: string | null;
  storage_path: string;
  title: string | null;
  description: string | null;
  alt_text: string | null;
  photographer_credit: string | null;
  display_order: number;
  width: number | null;
  height: number | null;
  file_size_bytes: number | null;
  content_type: string | null;
  status: GalleryStatus;
  created_at: string;
  updated_at: string;
}

export interface GalleryComment {
  id: string;
  image_id: string;
  parent_comment_id: string | null;
  author_name: string;
  author_email: string | null;
  body: string;
  status: CommentStatus;
  created_at: string;
}

// A comment with its child replies inlined — used on the public image
// page to render threads without a second query per parent.
export interface GalleryCommentNode extends GalleryComment {
  replies: GalleryCommentNode[];
}

export function buildCommentTree(
  flat: GalleryComment[],
): GalleryCommentNode[] {
  const byId = new Map<string, GalleryCommentNode>();
  for (const c of flat) {
    byId.set(c.id, { ...c, replies: [] });
  }
  const roots: GalleryCommentNode[] = [];
  for (const c of byId.values()) {
    if (c.parent_comment_id && byId.has(c.parent_comment_id)) {
      byId.get(c.parent_comment_id)!.replies.push(c);
    } else {
      roots.push(c);
    }
  }
  // Sort each level by created_at ascending — oldest first, natural read
  const sortRec = (nodes: GalleryCommentNode[]) => {
    nodes.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    for (const n of nodes) sortRec(n.replies);
  };
  sortRec(roots);
  return roots;
}
