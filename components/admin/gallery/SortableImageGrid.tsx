"use client";

import * as React from "react";
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
import { Pencil, Star, GripVertical, Loader2 } from "lucide-react";
import { galleryPublicUrl } from "@/lib/gallery/storage";
import type { GalleryImage } from "@/lib/gallery/types";

interface Props {
  albumId: string;
  images: GalleryImage[];
  coverImageId: string | null;
  onEdit: (image: GalleryImage) => void;
  onCoverToggle: (imageId: string) => void;
}

// Grid of image cards you can drag to reorder. Auto-saves on drop
// (optimistic — reverts + shows a small error if the API fails).
export function SortableImageGrid({
  albumId,
  images: initialImages,
  coverImageId,
  onEdit,
  onCoverToggle,
}: Props) {
  const router = useRouter();
  const [order, setOrder] = React.useState<GalleryImage[]>(initialImages);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Server-driven refreshes (upload, delete, edit) should re-seed the
  // local order — otherwise a new upload would sit stale.
  React.useEffect(() => {
    setOrder(initialImages);
  }, [initialImages]);

  const sensors = useSensors(
    // Small activation distance so a normal tap on the card (edit/star)
    // doesn't trigger a drag by accident.
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
    const prevOrder = order;
    const oldIdx = prevOrder.findIndex((i) => i.id === active.id);
    const newIdx = prevOrder.findIndex((i) => i.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const nextOrder = arrayMove(prevOrder, oldIdx, newIdx);
    setOrder(nextOrder);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/gallery/images/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          albumId,
          orderedIds: nextOrder.map((i) => i.id),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Save failed");
      router.refresh();
    } catch (e) {
      setOrder(prevOrder);
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
          Drag the handle on any image to reorder — public gallery follows this
          order.
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
          items={order.map((i) => i.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {order.map((img) => (
              <SortableImageCard
                key={img.id}
                image={img}
                isCover={coverImageId === img.id}
                onEdit={() => onEdit(img)}
                onCoverToggle={() => onCoverToggle(img.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableImageCard({
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Lift the dragging card visually — feels more like moving a physical
    // photo around.
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
      className="bg-white rounded-xl border border-gray-200 overflow-hidden group relative"
    >
      <div className="aspect-[4/3] bg-brand-pale/40 relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={galleryPublicUrl(image.storage_path)}
          alt={image.alt_text ?? image.title ?? ""}
          className="w-full h-full object-cover pointer-events-none"
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
        {/* Drag handle — bottom-left corner, touch-friendly */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="absolute bottom-2 left-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-brand-dark shadow flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
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
