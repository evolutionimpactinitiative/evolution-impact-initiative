"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { X, Printer } from "lucide-react";
import {
  STOCK_SIZES,
  CATEGORY_LABELS,
  COLOUR_LABELS,
  FIT_LABELS,
  type StockCategory,
} from "@/lib/back-to-school-stock";

export type ShowMode = "all" | "shortfall" | "surplus" | "demand";

const SHOW_OPTIONS: Array<{ value: ShowMode; label: string }> = [
  { value: "all", label: "All" },
  { value: "shortfall", label: "Shortfall" },
  { value: "surplus", label: "Surplus" },
  { value: "demand", label: "With demand" },
];

const FIT_OPTIONS: Array<"boys" | "girls" | "unisex"> = [
  "boys",
  "girls",
  "unisex",
];

const COLOUR_OPTIONS: Array<"white" | "blue" | "grey" | "black"> = [
  "white",
  "blue",
  "grey",
  "black",
];

const SLEEVE_OPTIONS: Array<"short" | "long"> = ["short", "long"];

interface Props {
  category: "all" | StockCategory;
  show: ShowMode;
  fit: Set<string>;
  sizes: Set<string>;
  sleeve: Set<string>;
  colour: Set<string>;
  waitlist: boolean;
  hideZero: boolean;
  sort: "group" | "gap";
  // How many shortfall lines are visible now — drives the shopping-list badge.
  shortfallLineCount: number;
  // Called to open the shopping list panel.
  onOpenShoppingList: () => void;
}

export function StockFilters(props: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const currentParams = useSearchParams();

  // Show sleeve chip row only when the category involves sleeves.
  const showSleeveRow =
    props.category === "polo" ||
    props.category === "shirt" ||
    props.category === "all";

  function updateParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(currentParams.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v == null || v === "" || v === "all") {
        params.delete(k);
      } else {
        params.set(k, v);
      }
    }
    const q = params.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  }

  function toggleInSet(key: string, value: string, current: Set<string>) {
    const next = new Set(current);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    const csv = Array.from(next).join(",");
    updateParams({ [key]: csv || null });
  }

  function resetAll() {
    const category = currentParams.get("category");
    router.push(
      category
        ? `${pathname}?category=${category}`
        : pathname,
    );
  }

  const anyFilterActive =
    props.show !== "all" ||
    props.fit.size > 0 ||
    props.sizes.size > 0 ||
    props.sleeve.size > 0 ||
    props.colour.size > 0 ||
    props.waitlist ||
    props.hideZero;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5 space-y-4 print:hidden">
      {/* SHOW ONLY — the "one big button" */}
      <div>
        <FilterLabel>Show only</FilterLabel>
        <div className="flex flex-wrap gap-2">
          {SHOW_OPTIONS.map((opt) => {
            const isActive = opt.value === props.show;
            return (
              <Chip
                key={opt.value}
                active={isActive}
                onClick={() =>
                  updateParams({ show: opt.value === "all" ? null : opt.value })
                }
                tone={
                  opt.value === "shortfall"
                    ? "red"
                    : opt.value === "surplus"
                      ? "green"
                      : "blue"
                }
              >
                {opt.label}
                {opt.value === "shortfall" && props.shortfallLineCount > 0 && (
                  <span
                    className={`ml-1.5 text-[10px] rounded-full px-1.5 py-0.5 ${
                      isActive ? "bg-white/25 text-white" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {props.shortfallLineCount}
                  </span>
                )}
              </Chip>
            );
          })}
          <button
            type="button"
            onClick={props.onOpenShoppingList}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-heading font-bold uppercase tracking-widest bg-brand-dark text-white hover:opacity-90"
          >
            Shopping list
            {props.shortfallLineCount > 0 && (
              <span className="text-[10px] rounded-full px-1.5 py-0.5 bg-white/25">
                {props.shortfallLineCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-heading font-bold uppercase tracking-widest bg-white text-brand-dark border border-gray-200 hover:bg-gray-50"
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* FIT + COLOUR row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FilterLabel>Fit</FilterLabel>
          <div className="flex flex-wrap gap-2">
            {FIT_OPTIONS.map((f) => (
              <Chip
                key={f}
                active={props.fit.has(f)}
                onClick={() => toggleInSet("fit", f, props.fit)}
                tone="blue"
              >
                {FIT_LABELS[f]}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <FilterLabel>Colour</FilterLabel>
          <div className="flex flex-wrap gap-2">
            {COLOUR_OPTIONS.map((c) => (
              <Chip
                key={c}
                active={props.colour.has(c)}
                onClick={() => toggleInSet("colour", c, props.colour)}
                tone="blue"
              >
                {COLOUR_LABELS[c]}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      {/* SLEEVE row — only when category involves sleeves */}
      {showSleeveRow && (
        <div>
          <FilterLabel>Sleeve (polos &amp; shirts)</FilterLabel>
          <div className="flex flex-wrap gap-2">
            {SLEEVE_OPTIONS.map((s) => (
              <Chip
                key={s}
                active={props.sleeve.has(s)}
                onClick={() => toggleInSet("sleeve", s, props.sleeve)}
                tone="blue"
              >
                {s === "short" ? "Short sleeve" : "Long sleeve"}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {/* SIZE chips */}
      <div>
        <FilterLabel>Sizes</FilterLabel>
        <div className="flex flex-wrap gap-1.5">
          {STOCK_SIZES.map((s) => (
            <Chip
              key={s}
              active={props.sizes.has(s)}
              onClick={() => toggleInSet("sizes", s, props.sizes)}
              size="sm"
              tone="blue"
            >
              {s}
            </Chip>
          ))}
        </div>
      </div>

      {/* TOGGLES + reset */}
      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
        <Chip
          active={props.waitlist}
          onClick={() =>
            updateParams({ waitlist: props.waitlist ? null : "1" })
          }
          tone="amber"
        >
          Include waitlist demand
        </Chip>
        <Chip
          active={props.hideZero}
          onClick={() => updateParams({ hideZero: props.hideZero ? null : "1" })}
          tone="gray"
        >
          Hide empty rows (0 stock &amp; 0 demand)
        </Chip>
        <Chip
          active={props.sort === "gap"}
          onClick={() =>
            updateParams({ sort: props.sort === "gap" ? null : "gap" })
          }
          tone="gray"
        >
          Sort by biggest gap
        </Chip>

        {anyFilterActive && (
          <button
            type="button"
            onClick={resetAll}
            className="ml-auto inline-flex items-center gap-1 text-xs font-heading font-bold uppercase tracking-widest text-gray-500 hover:text-brand-dark"
          >
            <X className="h-3.5 w-3.5" />
            Reset filters
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Category tabs still work above (Polos / Shirts etc). These filters stack
        on top and update the URL — copy the address to share your view.
      </p>
    </div>
  );
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] text-gray-500 uppercase tracking-widest font-heading font-bold mb-1.5">
      {children}
    </p>
  );
}

function Chip({
  active,
  onClick,
  children,
  size = "md",
  tone = "blue",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  size?: "sm" | "md";
  tone?: "blue" | "red" | "green" | "gray" | "amber";
}) {
  const activeClasses: Record<string, string> = {
    blue: "bg-brand-blue text-white border-brand-blue",
    red: "bg-red-600 text-white border-red-600",
    green: "bg-brand-green text-white border-brand-green",
    gray: "bg-brand-dark text-white border-brand-dark",
    amber: "bg-amber-500 text-white border-amber-500",
  };
  const idleClasses = "bg-white text-brand-dark border-gray-200 hover:border-brand-blue";
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        (active ? activeClasses[tone] : idleClasses) +
        " inline-flex items-center rounded-full border font-heading font-bold uppercase tracking-widest transition-colors " +
        (size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1.5 text-xs")
      }
    >
      {children}
    </button>
  );
}
