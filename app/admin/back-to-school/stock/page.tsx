import Link from "next/link";
import { ArrowLeft, Package, TrendingDown, AlertTriangle, Clock } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { B2S_SLUG } from "@/lib/back-to-school";
import type { UniformChoices, ChildSex, UniformSize } from "@/lib/back-to-school";
import {
  aggregateDemand,
  buildMatrix,
  type ChildAsk,
  type StockRow,
  type StockCategory,
} from "@/lib/back-to-school-stock";
import { StockMatrix } from "@/components/admin/back-to-school/StockMatrix";
import { AddStockButton } from "@/components/admin/back-to-school/AddStockButton";

const CATEGORY_TABS: Array<{ key: "all" | StockCategory; label: string }> = [
  { key: "all", label: "All" },
  { key: "polo", label: "Polos" },
  { key: "shirt", label: "Shirts" },
  { key: "trousers", label: "Trousers" },
  { key: "skirt", label: "Skirts" },
  { key: "dress", label: "Dresses" },
  { key: "shorts", label: "Shorts" },
];

interface PageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function B2SStockPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const categoryFilter =
    (params.category as "all" | StockCategory | undefined) ?? "all";

  const supabase = createAdminClient();

  // Stock rows
  const { data: stockRaw } = await supabase
    .from("back_to_school_stock")
    .select("id, category, colour, sleeve, fit, size, quantity, notes, updated_at");
  const stockRows = (stockRaw as StockRow[] | null) ?? [];

  // Demand: pull uniform choices from every child on a pending/approved
  // registration in this event. Waitlisted kids are counted separately so
  // the admin can see what capacity opens up if they promote everyone.
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

    const rows =
      (activeRegs as { id: string; status: string }[] | null) ?? [];
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

  const demand = aggregateDemand(asks);
  const waitlistDemand = aggregateDemand(waitlistAsks);
  const matrix = buildMatrix(stockRows, demand);
  const totalWaitlistRequested = Array.from(waitlistDemand.values()).reduce(
    (s, n) => s + n,
    0,
  );

  const visibleMatrix =
    categoryFilter === "all"
      ? matrix
      : matrix.filter((g) => g.category === categoryFilter);

  const totalInStock = matrix.reduce((s, g) => s + g.totalStock, 0);
  const totalRequested = matrix.reduce((s, g) => s + g.totalRequested, 0);
  const totalGap = matrix.reduce(
    (s, g) => s + Math.max(0, g.totalRequested - g.totalStock),
    0,
  );

  const categoryCounts: Record<string, number> = { all: matrix.length };
  for (const g of matrix) {
    categoryCounts[g.category] = (categoryCounts[g.category] ?? 0) + 1;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
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
        <AddStockButton />
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
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
          subtitle={totalGap > 0 ? "items short of demand" : "we're covered"}
        />
        <StatTile
          title="Unique SKUs"
          value={matrix.length}
          icon={<Package className="h-5 w-5" />}
          tone="gray"
        />
      </div>

      {/* TABS */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {CATEGORY_TABS.map((tab) => {
          const isActive = tab.key === categoryFilter;
          const count = categoryCounts[tab.key] ?? 0;
          return (
            <Link
              key={tab.key}
              href={
                tab.key === "all"
                  ? "/admin/back-to-school/stock"
                  : `/admin/back-to-school/stock?category=${tab.key}`
              }
              className={
                isActive
                  ? "bg-brand-blue text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest"
                  : "bg-white text-brand-dark border border-gray-200 hover:border-brand-blue px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest"
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

      {/* MATRIX */}
      {visibleMatrix.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-500">
          Nothing in stock and nothing requested in this category yet. Use
          &ldquo;Add stock&rdquo; to record new inventory.
        </div>
      ) : (
        <StockMatrix groups={visibleMatrix} />
      )}

      <div className="text-xs text-gray-500 space-y-1 pt-2">
        <p>
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1.5" />
          Red gap = shortfall (more requests than stock).
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 ml-3 mr-1.5" />
          Green gap = we have surplus.
        </p>
        <p>
          Requests are counted from pending &amp; approved registrations only.
          Children with sex &ldquo;other&rdquo; or &ldquo;prefer not to say&rdquo;
          count against the <em>Unisex</em> fit row.
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
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  tone: "blue" | "green" | "red" | "gray" | "amber";
  subtitle?: string;
}) {
  const tones: Record<string, { bg: string; text: string }> = {
    blue: { bg: "bg-brand-blue/10", text: "text-brand-blue" },
    green: { bg: "bg-brand-green/10", text: "text-brand-green" },
    red: { bg: "bg-red-100", text: "text-red-700" },
    gray: { bg: "bg-gray-100", text: "text-gray-600" },
    amber: { bg: "bg-amber-100", text: "text-amber-800" },
  };
  const t = tones[tone];
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
