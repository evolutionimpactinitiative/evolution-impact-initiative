"use client";

import * as React from "react";
import { X, Copy, Printer, Check } from "lucide-react";

export interface ShoppingLine {
  label: string; // e.g. "Grey trousers · Boys"
  size: string;
  needed: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  lines: ShoppingLine[];
  title: string; // e.g. "Shopping list — 12 items short"
}

export function ShoppingListPanel({ open, onClose, lines, title }: Props) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  const asText = React.useMemo(() => {
    if (lines.length === 0) return "";
    const rows = lines.map(
      (l) => `${l.label} · size ${l.size} — need ${l.needed}`,
    );
    return `${title}\n\n${rows.join("\n")}`;
  }, [lines, title]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(asText);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-stretch justify-end print:hidden"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md h-full shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <div>
            <h2 className="font-heading font-black text-brand-dark text-lg">
              Shopping list
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {lines.length === 0
                ? "Everything's covered right now."
                : `${lines.length} line${lines.length === 1 ? "" : "s"} · ${lines.reduce((s, l) => s + l.needed, 0)} items short`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-brand-dark"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {lines.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No shortfalls in the current filter. Adjust filters to see gaps
              across other categories.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {lines.map((l, i) => (
                <li key={i} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-heading font-bold text-sm text-brand-dark truncate">
                      {l.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Size {l.size}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-heading font-black text-brand-blue text-lg">
                      {l.needed}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                      needed
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-gray-100 p-4 flex gap-2">
          <button
            type="button"
            onClick={copy}
            disabled={lines.length === 0}
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-brand-blue text-white px-3 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copied" : "Copy list"}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={lines.length === 0}
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white text-brand-dark border border-gray-200 px-3 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-gray-50 disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
