import { StickyNote } from "lucide-react";

export type ParentVisibleNote = {
  id: string;
  body: string;
  author_name: string | null;
  created_at: string;
};

export function ParentNotesSection({
  label,
  notes,
}: {
  label: string;
  notes: ParentVisibleNote[];
}) {
  if (notes.length === 0) return null;
  return (
    <section
      aria-label={`${label} — notes from the team`}
      className="bg-brand-pale/40 border border-brand-blue/20 rounded-2xl p-4 md:p-5 my-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <StickyNote className="h-4 w-4 text-brand-blue" />
        <h3 className="font-heading font-black text-sm text-brand-dark uppercase tracking-wider">
          Notes from the EII team · {label}
        </h3>
      </div>
      <ul className="space-y-3">
        {notes.map((n) => (
          <li
            key={n.id}
            className="bg-white border border-brand-dark/5 rounded-xl p-4"
          >
            <p className="text-sm text-brand-dark whitespace-pre-wrap">
              {n.body}
            </p>
            <p className="mt-2 text-[11px] text-brand-dark/50">
              {n.author_name || "The team"} ·{" "}
              {new Date(n.created_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
