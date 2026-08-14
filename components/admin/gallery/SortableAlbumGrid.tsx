"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ImageIcon,
  ArrowRight,
  GripVertical,
  Loader2,
} from "lucide-react";
import { galleryPublicUrl } from "@/lib/gallery/storage";
import type { GalleryAlbum } from "@/lib/gallery/types";

interface AlbumCard {
  album: GalleryAlbum;
  count: number;
  coverPath: string | null;
}

interface Props {
  albums: AlbumCard[];
}

export function SortableAlbumGrid({ albums: initialAlbums }: Props) {
  const router = useRouter();
  const [order, setOrder] = React.useState<AlbumCard[]>(initialAlbums);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setOrder(initialAlbums);
  }, [initialAlbums]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const prev = order;
    const oldIdx = prev.findIndex((x) => x.album.id === active.id);
    const newIdx = prev.findIndex((x) => x.album.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const next = arrayMove(prev, oldIdx, newIdx);
    setOrder(next);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/gallery/albums/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderedIds: next.map((x) => x.album.id),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Save failed");
      router.refresh();
    } catch (e) {
      setOrder(prev);
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <GripVertical className="h-3.5 w-3.5" />
        <span>
          Drag the handle to reorder — this is the order visitors see on the
          public /gallery page.
        </span>
        {saving && (
          <span className="ml-auto inline-flex items-center gap-1 text-brand-blue">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving…
          </span>
        )}
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={order.map((x) => x.album.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {order.map((entry) => (
              <SortableAlbumCard key={entry.album.id} {...entry} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableAlbumCard({
  album,
  count,
  coverPath,
}: AlbumCard) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: album.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    boxShadow: isDragging
      ? "0 12px 24px rgba(0,0,0,0.15)"
      : undefined,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.95 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-2xl border border-gray-200 hover:border-brand-blue overflow-hidden transition-colors relative"
    >
      <Link
        href={`/admin/gallery/albums/${album.slug}`}
        className="block group"
      >
        <div className="aspect-[4/3] bg-brand-pale/40 relative">
          {coverPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={galleryPublicUrl(coverPath)}
              alt={album.name}
              className="w-full h-full object-cover pointer-events-none"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <ImageIcon className="h-10 w-10" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <span
              className={
                (album.status === "published"
                  ? "bg-emerald-100 text-emerald-800"
                  : album.status === "draft"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-gray-100 text-gray-700") +
                " inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-heading font-bold uppercase tracking-widest"
              }
            >
              {album.status}
            </span>
          </div>
        </div>
        <div className="p-4">
          <p className="font-heading font-bold text-brand-dark truncate">
            {album.name}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {count} image{count === 1 ? "" : "s"} · /gallery/{album.slug}
          </p>
          {album.description && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              {album.description}
            </p>
          )}
          <span className="inline-flex items-center gap-1 text-brand-blue text-xs font-heading font-bold uppercase tracking-widest mt-3 group-hover:translate-x-0.5 transition-transform">
            Manage
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </Link>
      {/* Drag handle — top-left corner, floats above the link */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-brand-dark shadow flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
    </div>
  );
}
