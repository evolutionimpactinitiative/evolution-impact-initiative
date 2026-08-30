"use client";

import { Printer } from "lucide-react";

export function PrintLabelsButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 bg-brand-blue text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark"
    >
      <Printer className="h-4 w-4" />
      Print labels
    </button>
  );
}
