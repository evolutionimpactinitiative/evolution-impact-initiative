import Link from "next/link";
import {
  ArrowLeft,
  Package,
  TrendingDown,
  AlertTriangle,
  Clock,
  Download,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { B2S_SLUG, UNIFORM_SIZES } from "@/lib/back-to-school";
import type {
  UniformChoices,
  ChildSex,
  UniformSize,
} from "@/lib/back-to-school";
import {
  aggregateDemand,
  buildMatrix,
  effectiveCell,
  groupShortfall,
  groupShortfallEffective,
  indexAllocations,
  skuCellKey,
  skuGroupLabel,
  type ChildAsk,
  type StockAllocation,
  type StockRow,
  type StockCategory,
} from "@/lib/back-to-school-stock";
import type { EffectiveCellRow } from "@/components/admin/back-to-school/AllocationSheet";
import { StockMatrix } from "@/components/admin/back-to-school/StockMatrix";
import { StockCardList } from "@/components/admin/back-to-school/StockCardList";
import { aggregateReservations } from "@/lib/back-to-school/shopping-list";
import { AddStockButton } from "@/components/admin/back-to-school/AddStockButton";
import { StockToolbar } from "@/components/admin/back-to-school/StockToolbar";
import type { ShowMode } from "@/components/admin/back-to-school/StockFilters";
import type { ShoppingLine } from "@/components/admin/back-to-school/ShoppingListPanel";

const CATEGORY_TABS: Array<{ key: "all" | StockCategory; label: string }> = [
  { key: "all", label: "All" },
  { key: "polo", label: "Polos" },
  { key: "shirt", label: "Shirts" },
  { key: "trousers", label: "Trousers" },
  { key: "skirt", label: "Skirts" },
  { key: "dress", label: "Dresses" },
  { key: "shorts", label: "Shorts" },
];

const VALID_SHOW: readonly ShowMode[] = ["all", "shortfall", "surplus", "demand"];
const VALID_FIT = ["boys", "girls", "unisex"];
const VALID_COLOUR = ["white", "blue", "grey", "black"];
const VALID_SLEEVE = ["short", "long"];
const VALID_SIZES: readonly string[] = UNIFORM_SIZES;

interface PageProps {
  searchParams: Promise<{
    category?: string;
    show?: string;
    fit?: string;
    sizes?: string;
    sleeve?: string;
    colour?: string;
    waitlist?: string;
    hideZero?: string;
    sort?: string;
  }>;
}

function parseCsv(v: string | undefined, allowed: readonly string[]): string[] {
  if (!v) return [];
  return v
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && allowed.includes(s));
}

export default async function B2SStockPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const categoryFilter =
    (params.category as "all" | StockCategory | undefined) &&
    CATEGORY_TABS.some((t) => t.key === params.category)
      ? (params.category as "all" | StockCategory)
      : "all";
  const show: ShowMode =
    params.show && VALID_SHOW.includes(params.show as ShowMode)
      ? (params.show as ShowMode)
      : "all";
  const fit = parseCsv(params.fit, VALID_FIT);
  const sizes = parseCsv(params.sizes, VALID_SIZES);
  const sleeve = parseCsv(params.sleeve, VALID_SLEEVE);
  const colour = parseCsv(params.colour, VALID_COLOUR);
  const waitlist = params.waitlist === "1";
  const hideZero = params.hideZero === "1";
  const sort: "group" | "gap" = params.sort === "gap" ? "gap" : "group";

  const supabase = createAdminClient();

  // ─── Load stock rows ──────────────────────────────────────────────
  const { data: stockRaw } = await supabase
    .from("back_to_school_stock")
    .select("id, category, colour, sleeve, fit, size, quantity, notes, updated_at");
  const stockRows = (stockRaw as StockRow[] | null) ?? [];

  // ─── Load demand (pending/approved vs waitlisted) ─────────────────
  const asks: ChildAsk[] = [];
  const waitlistAsks: ChildAsk[] = [];
  const { data: eventRow } = await supabase
    .from("events")
    .select("id")
    .eq("slug", B2S_SLUG)
    .maybeSingle();

  if (eventRow) {
    const eventId = (eventRow as { id: string }).id;

    const { data: activeRegs } = await supabase
      .from("registrations")
      .select("id, status")
      .eq("event_id", eventId)
      .in("status", ["pending", "approved", "waitlisted"]);

    const rows = (activeRegs as { id: string; status: string }[] | null) ?? [];
    const statusById = new Map(rows.map((r) => [r.id, r.status]));
    const regIds = rows.map((r) => r.id);

    if (regIds.length > 0) {
      const { data: children } = await supabase
        .from("registration_children")
        .select("id, registration_id, sex, uniform_size, uniform_choices, needs")
        .in("registration_id", regIds);

      const list =
        (children as Array<{
          id: string;
          registration_id: string;
          sex: ChildSex | null;
          uniform_size: string | null;
          uniform_choices: UniformChoices | null;
          needs: string[] | null;
        }> | null) ?? [];

      for (const c of list) {
        if (!c.uniform_size || !c.uniform_choices) continue;
        if (!(c.needs ?? []).includes("uniform")) continue;
        const ask: ChildAsk = {
          child_id: c.id,
          sex: c.sex,
          uniform_size: c.uniform_size as UniformSize,
          uniform_choices: c.uniform_choices,
        };
        if (statusById.get(c.registration_id) === "waitlisted") {
          waitlistAsks.push(ask);
        } else {
          asks.push(ask);
        }
      }
    }
  }

  // Merge waitlist demand into the active demand when the toggle is on.
  const activeDemand = aggregateDemand(asks);
  const waitlistDemand = aggregateDemand(waitlistAsks);
  const totalWaitlistRequested = Array.from(waitlistDemand.values()).reduce(
    (s, n) => s + n,
    0,
  );

  const effectiveDemand = new Map(activeDemand);
  if (waitlist) {
    for (const [k, v] of waitlistDemand.entries()) {
      effectiveDemand.set(k, (effectiveDemand.get(k) ?? 0) + v);
    }
  }

  const matrix = buildMatrix(stockRows, effectiveDemand);

  // ─── Allocations (substitutions) ─────────────────────────────────
  // These represent "N of the FROM sku are earmarked to cover the TO
  // sku's demand". Applied at render time to compute effective stock
  // and effective demand for every cell.
  const { data: allocRaw } = await supabase
    .from("back_to_school_stock_allocations")
    .select("*")
    .order("created_at", { ascending: false });
  const allAllocations = (allocRaw as StockAllocation[] | null) ?? [];
  const allocationIndex = indexAllocations(allAllocations);

  // Active reservations from the shopping list — aggregated per SKU cell
  // so the matrix + cards can render an amber "N reserved" pill on cells
  // where donors have committed to bringing items.
  const { data: reservationsRaw } = await supabase
    .from("back_to_school_shopping_reservations")
    .select("category, colour, sleeve, fit, size, qty, status")
    .eq("status", "reserved");
  const reservedMap = aggregateReservations(
    (reservationsRaw as Array<{
      category: string;
      colour: string;
      sleeve: string | null;
      fit: string;
      size: string;
      qty: number;
      status: "reserved" | "received" | "cancelled";
    }> | null) ?? [],
  );

  // Top-line stat tiles (always over the full unfiltered matrix so users can
  // orient themselves before drilling in).
  const totalInStock = matrix.reduce((s, g) => s + g.totalStock, 0);
  const totalRequested = Array.from(activeDemand.values()).reduce(
    (s, n) => s + n,
    0,
  );

  // Shortfall MUST be summed per-cell (i.e. per size), not per group —
  // otherwise a surplus of small sizes cancels a shortage of larger ones
  // inside the same category+colour+fit and understates the true gap.
  // Allocations reduce the effective shortfall further.
  const sumCellShortfall = (m: typeof matrix) =>
    m.reduce((s, g) => s + groupShortfallEffective(g, allocationIndex), 0);

  const totalGap = sumCellShortfall(matrix);

  // Shortfall-if-waitlist-promoted: rebuild the gap using active + waitlist
  // demand so the user can see the *real* exposure without flipping the
  // toggle. Only interesting if a waitlist actually exists.
  const combinedDemand = new Map(activeDemand);
  for (const [k, v] of waitlistDemand.entries()) {
    combinedDemand.set(k, (combinedDemand.get(k) ?? 0) + v);
  }
  const combinedMatrix = buildMatrix(stockRows, combinedDemand);
  const totalGapWithWaitlist = sumCellShortfall(combinedMatrix);
  const extraGapFromWaitlist = totalGapWithWaitlist - totalGap;

  // ─── Flat list of every cell with effective numbers ──────────────
  // Passed to the allocation sheet inside cells so the picker can rank
  // candidate donors/recipients by proximity.
  const allEffectiveCells: EffectiveCellRow[] = [];
  for (const g of matrix) {
    for (const [size, cell] of g.cells.entries()) {
      const key = skuCellKey({
        category: g.category,
        colour: g.colour,
        sleeve: g.sleeve,
        fit: g.fit,
        size,
      });
      const ec = effectiveCell(cell, key, allocationIndex);
      allEffectiveCells.push({
        category: g.category,
        colour: g.colour,
        sleeve: g.sleeve,
        fit: g.fit,
        size,
        label: g.label,
        freeStock: ec.freeStock,
        uncovered: ec.uncovered,
        shortfall: ec.shortfall,
        surplus: ec.surplus,
      });
    }
  }

  // Category counts (unfiltered, so tabs always show accurate counts).
  const categoryCounts: Record<string, number> = { all: matrix.length };
  for (const g of matrix) {
    categoryCounts[g.category] = (categoryCounts[g.category] ?? 0) + 1;
  }

  // ─── Apply filters to produce the visible matrix ─────────────────
  const fitSet = new Set(fit);
  const colourSet = new Set(colour);
  const sleeveSet = new Set(sleeve);
  const sizesSet = new Set(sizes);

  let visibleMatrix = matrix.filter((g) => {
    if (categoryFilter !== "all" && g.category !== categoryFilter) return false;
    if (fitSet.size > 0 && !fitSet.has(g.fit)) return false;
    if (colourSet.size > 0 && !colourSet.has(g.colour)) return false;
    // Sleeve only applies to categories that have a sleeve dimension.
    if (
      sleeveSet.size > 0 &&
      (g.category === "polo" || g.category === "shirt") &&
      (!g.sleeve || !sleeveSet.has(g.sleeve))
    ) {
      return false;
    }
    if (hideZero && g.totalStock === 0 && g.totalRequested === 0) return false;
    return true;
  });

  // ─── Cell mask for the "Show only" preset ────────────────────────
  // A masked cell renders as a dash so the row still lines up with the
  // filtered columns, but the data is out of scope.
  let cellMask: Set<string> | null = null;
  if (show !== "all") {
    cellMask = new Set();
    for (const g of visibleMatrix) {
      for (const size of VALID_SIZES) {
        const cell = g.cells.get(size);
        const key = skuCellKey({
          category: g.category,
          colour: g.colour,
          sleeve: g.sleeve,
          fit: g.fit,
          size,
        });
        // Filters read allocation-aware numbers — a cell that's been
        // fully covered by a substitution shouldn't still show under
        // "Show shortfall".
        const ec = effectiveCell(cell, key, allocationIndex);
        const passShow =
          show === "shortfall"
            ? ec.shortfall > 0
            : show === "surplus"
              ? ec.surplus > 0
              : /* demand */ ec.uncovered > 0;
        if (passShow) {
          cellMask.add(key);
        }
      }
    }
    // Drop groups where no cell in the mask survives — keeps the matrix short.
    visibleMatrix = visibleMatrix.filter((g) => {
      for (const size of VALID_SIZES) {
        const key = skuCellKey({
          category: g.category,
          colour: g.colour,
          sleeve: g.sleeve,
          fit: g.fit,
          size,
        });
        if (cellMask!.has(key)) return true;
      }
      return false;
    });
  }

  // ─── Size columns to render ───────────────────────────────────────
  const visibleSizes = sizesSet.size > 0
    ? VALID_SIZES.filter((s) => sizesSet.has(s))
    : VALID_SIZES;

  // ─── Sort ─────────────────────────────────────────────────────────
  if (sort === "gap") {
    // Sort by true per-cell shortfall so groups with mismatched-size
    // shortages rise to the top even when net totals look balanced.
    // Uses effective (allocation-aware) shortfall.
    visibleMatrix = [...visibleMatrix].sort(
      (a, b) =>
        groupShortfallEffective(b, allocationIndex) -
        groupShortfallEffective(a, allocationIndex),
    );
  }

  // ─── Shopping list (respects all current filters + visible sizes) ─
  // Uses EFFECTIVE numbers so allocations reduce what we need to buy.
  const shoppingLines: ShoppingLine[] = [];
  for (const g of visibleMatrix) {
    for (const size of visibleSizes) {
      const cell = g.cells.get(size);
      const cellKeyStr = skuCellKey({
        category: g.category,
        colour: g.colour,
        sleeve: g.sleeve,
        fit: g.fit,
        size,
      });
      const ec = effectiveCell(cell, cellKeyStr, allocationIndex);
      const needed = ec.shortfall;
      if (needed > 0) {
        shoppingLines.push({
          label: skuGroupLabel({
            category: g.category,
            colour: g.colour,
            sleeve: g.sleeve,
            fit: g.fit,
          }),
          size,
          needed,
        });
      }
    }
  }
  shoppingLines.sort((a, b) => b.needed - a.needed);

  return (
    <div className="space-y-6" id="stock-print-area">
      {/* Print styles — hide the admin chrome, force landscape, keep only
          the stock content on the printed page. */}
      <style
        // eslint-disable-next-line react/no-unknown-property
        // Server-injected: fine to hard-code, doesn't need to be reactive.
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page { size: A4 landscape; margin: 10mm; }
              body * { visibility: hidden !important; }
              #stock-print-area, #stock-print-area * { visibility: visible !important; }
              #stock-print-area {
                position: absolute; left: 0; top: 0; width: 100%; padding: 0;
              }
              html, body { background: white !important; }
            }
          `,
        }}
      />
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div>
          <Link
            href="/admin/back-to-school"
            className="text-sm text-gray-600 hover:text-brand-dark inline-flex items-center gap-1 mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Back to School
          </Link>
          <h1 className="text-2xl md:text-3xl font-heading font-black text-brand-dark">
            Stock
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            What we have in the store vs. what families have requested. Each
            cell shows <span className="font-heading font-bold">in / requested</span>{" "}
            with the gap in red or green.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/back-to-school/stock/export"
            download
            className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-brand-dark px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:border-brand-blue"
            title="Download a CSV of every SKU × size with stock, demand, and shortfall"
          >
            <Download className="h-4 w-4" />
            Export
          </a>
          <AddStockButton />
        </div>
      </div>

      {/* Header shown only in print — cheap, prints the drive name */}
      <div className="hidden print:block">
        <h1 className="font-heading font-black text-2xl text-brand-dark">
          Back to School Drive 2026 — Stock
        </h1>
        <p className="text-xs text-gray-600 mt-1">
          Printed {new Date().toLocaleString("en-GB")}
        </p>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 print:grid-cols-5">
        <StatTile
          title="In stock"
          value={totalInStock}
          icon={<Package className="h-5 w-5" />}
          tone="blue"
        />
        <StatTile
          title="Requested"
          value={totalRequested}
          icon={<TrendingDown className="h-5 w-5" />}
          tone="green"
          subtitle="pending + approved"
        />
        <StatTile
          title="On waitlist"
          value={totalWaitlistRequested}
          icon={<Clock className="h-5 w-5" />}
          tone="amber"
          subtitle="items waitlisted kids want"
        />
        <StatTile
          title="Shortfall"
          value={totalGap}
          icon={<AlertTriangle className="h-5 w-5" />}
          tone={totalGap > 0 ? "red" : "gray"}
          subtitle={
            totalGap > 0
              ? "items short of demand (excludes waitlist)"
              : "we're covered (excludes waitlist)"
          }
          secondary={
            extraGapFromWaitlist > 0
              ? {
                  label: `+${extraGapFromWaitlist} more if the waitlist is promoted`,
                  tone: "amber",
                }
              : undefined
          }
        />
        <StatTile
          title="Unique SKUs"
          value={matrix.length}
          icon={<Package className="h-5 w-5" />}
          tone="gray"
        />
      </div>

      {/* CATEGORY TABS */}
      <div className="-mx-4 md:mx-0 px-4 md:px-0 border-b border-gray-200 pb-3 print:hidden">
        <div className="flex md:flex-wrap gap-2 overflow-x-auto md:overflow-visible no-scrollbar">
        {CATEGORY_TABS.map((tab) => {
          const isActive = tab.key === categoryFilter;
          const count = categoryCounts[tab.key] ?? 0;
          const carryOver = new URLSearchParams();
          if (show !== "all") carryOver.set("show", show);
          if (fit.length) carryOver.set("fit", fit.join(","));
          if (sizes.length) carryOver.set("sizes", sizes.join(","));
          if (sleeve.length) carryOver.set("sleeve", sleeve.join(","));
          if (colour.length) carryOver.set("colour", colour.join(","));
          if (waitlist) carryOver.set("waitlist", "1");
          if (hideZero) carryOver.set("hideZero", "1");
          if (sort === "gap") carryOver.set("sort", "gap");
          if (tab.key !== "all") carryOver.set("category", tab.key);
          const qs = carryOver.toString();
          return (
            <Link
              key={tab.key}
              href={qs ? `/admin/back-to-school/stock?${qs}` : "/admin/back-to-school/stock"}
              className={
                (isActive
                  ? "bg-brand-blue text-white "
                  : "bg-white text-brand-dark border border-gray-200 hover:border-brand-blue ") +
                "shrink-0 px-3.5 md:px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest"
              }
            >
              {tab.label}
              <span
                className={`ml-2 text-xs ${isActive ? "text-white/70" : "text-gray-500"}`}
              >
                {count}
              </span>
            </Link>
          );
        })}
        </div>
      </div>

      {/* FILTER TOOLBAR + shopping list panel */}
      <StockToolbar
        category={categoryFilter}
        show={show}
        fit={fit}
        sizes={sizes}
        sleeve={sleeve}
        colour={colour}
        waitlist={waitlist}
        hideZero={hideZero}
        sort={sort}
        shoppingLines={shoppingLines}
      />

      {/* MATRIX */}
      {visibleMatrix.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-500">
          Nothing matches these filters. Reset or widen your selection to see
          more.
        </div>
      ) : (
        <>
          {/* Desktop: the item×size matrix */}
          <div className="hidden md:block">
            <StockMatrix
              groups={visibleMatrix}
              visibleSizes={visibleSizes}
              cellMask={cellMask}
              reservedMap={reservedMap}
              allocations={allAllocations}
              allEffectiveCells={allEffectiveCells}
            />
          </div>
          {/* Mobile: expandable cards, one per SKU group */}
          <div className="md:hidden">
            <StockCardList
              groups={visibleMatrix}
              visibleSizes={visibleSizes}
              cellMask={cellMask}
              reservedMap={reservedMap}
              allocations={allAllocations}
              allEffectiveCells={allEffectiveCells}
            />
          </div>
        </>
      )}

      <div className="text-xs text-gray-500 space-y-1 pt-2 print:hidden">
        <p>
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1.5" />
          Red gap = shortfall (more requests than stock).
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 ml-3 mr-1.5" />
          Green gap = we have surplus.
        </p>
        <p>
          Requests are counted from pending &amp; approved registrations only
          unless you turn on <em>Include waitlist demand</em>. Children with sex
          &ldquo;other&rdquo; or &ldquo;prefer not to say&rdquo; count against
          the <em>Unisex</em> fit row.
        </p>
      </div>
    </div>
  );
}

function StatTile({
  title,
  value,
  icon,
  tone,
  subtitle,
  secondary,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  tone: "blue" | "green" | "red" | "gray" | "amber";
  subtitle?: string;
  // Optional secondary line — used to show a "waitlist-included" figure
  // beside the primary count so the user can see both at once.
  secondary?: { label: string; tone?: "amber" | "red" | "gray" };
}) {
  const tones: Record<string, { bg: string; text: string }> = {
    blue: { bg: "bg-brand-blue/10", text: "text-brand-blue" },
    green: { bg: "bg-brand-green/10", text: "text-brand-green" },
    red: { bg: "bg-red-100", text: "text-red-700" },
    gray: { bg: "bg-gray-100", text: "text-gray-600" },
    amber: { bg: "bg-amber-100", text: "text-amber-800" },
  };
  const secondaryTones: Record<string, string> = {
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    gray: "bg-gray-50 text-gray-600 border-gray-200",
  };
  const t = tones[tone];
  const sTone = secondaryTones[secondary?.tone ?? "amber"];
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 lg:p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="text-2xl lg:text-3xl font-bold text-brand-dark mt-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
          {secondary && (
            <p
              className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-md border ${sTone}`}
            >
              {secondary.label}
            </p>
          )}
        </div>
        <div
          className={`flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex-shrink-0 ${t.bg} ${t.text}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
