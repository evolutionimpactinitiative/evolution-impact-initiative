import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Users,
  XCircle,
  AlertTriangle,
  Package,
  Clock,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { B2S, B2S_SLUG } from "@/lib/back-to-school";
import { DayViewAutoRefresh } from "@/components/admin/back-to-school/DayViewAutoRefresh";

// Live view for Station 4 (and the chair). Refreshes every 20s in the
// browser via the client wrapper; this server component runs fresh on
// every render so numbers are always current.
export const revalidate = 0;
export const dynamic = "force-dynamic";

const LOW_STOCK_THRESHOLD = 3;

export default async function B2SDayViewPage() {
  const supabase = createAdminClient();

  const { data: eventRow } = await supabase
    .from("events")
    .select("id")
    .eq("slug", B2S_SLUG)
    .maybeSingle();

  if (!eventRow) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/back-to-school"
          className="text-sm text-gray-600 hover:text-brand-dark inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-6 text-sm text-amber-900">
          Drive event not seeded yet.
        </div>
      </div>
    );
  }
  const eventId = (eventRow as { id: string }).id;

  // ─── Load registrations (small volume; ok to fetch all) ───────────
  const { data: regRows } = await supabase
    .from("registrations")
    .select(
      "id, parent_name, parent_postcode, status, distribution_status, distribution_recorded_at",
    )
    .eq("event_id", eventId);
  const regs =
    (regRows as Array<{
      id: string;
      parent_name: string;
      parent_postcode: string | null;
      status: string;
      distribution_status: string | null;
      distribution_recorded_at: string | null;
    }> | null) ?? [];

  // "Today" is the UK day of the drive — use the client server clock,
  // which for a Vercel deploy will be UTC. On the day (22 Aug 2026 UK),
  // 00:00 UK is 23:00 UTC 21 Aug, so we cut at UK midnight explicitly.
  const now = new Date();
  const ukTodayStart = ukMidnight(now);

  const collectedToday = regs.filter(
    (r) =>
      r.distribution_status === "collected" &&
      r.distribution_recorded_at &&
      new Date(r.distribution_recorded_at) >= ukTodayStart,
  );
  const partialToday = regs.filter(
    (r) =>
      r.distribution_status === "partial" &&
      r.distribution_recorded_at &&
      new Date(r.distribution_recorded_at) >= ukTodayStart,
  );
  const noShowToday = regs.filter(
    (r) =>
      r.distribution_status === "no_show" &&
      r.distribution_recorded_at &&
      new Date(r.distribution_recorded_at) >= ukTodayStart,
  );

  const stillExpected = regs.filter(
    (r) =>
      (r.status === "approved" ||
        r.status === "pending" ||
        r.status === "walk_in") &&
      !r.distribution_status,
  );

  const totalToServeToday =
    collectedToday.length + partialToday.length + noShowToday.length +
    stillExpected.length;
  const doneToday = collectedToday.length + partialToday.length + noShowToday.length;
  const progressPct =
    totalToServeToday > 0
      ? Math.round((doneToday / totalToServeToday) * 100)
      : 0;

  // ─── Stock summary + low-stock alerts ─────────────────────────────
  const { data: stockRaw } = await supabase
    .from("back_to_school_stock")
    .select("id, category, colour, sleeve, fit, size, quantity")
    .order("quantity", { ascending: true });
  const stockList =
    (stockRaw as Array<{
      id: string;
      category: string;
      colour: string;
      sleeve: string | null;
      fit: string;
      size: string;
      quantity: number;
    }> | null) ?? [];

  const totalInStock = stockList.reduce((s, r) => s + (r.quantity ?? 0), 0);
  const lowStock = stockList.filter(
    (r) => r.quantity > 0 && r.quantity <= LOW_STOCK_THRESHOLD,
  );
  const outOfStock = stockList.filter((r) => r.quantity === 0);

  // ─── Recent activity — last 10 dispositioned families today ───────
  const recentActivity = regs
    .filter(
      (r) =>
        r.distribution_recorded_at &&
        new Date(r.distribution_recorded_at) >= ukTodayStart,
    )
    .sort(
      (a, b) =>
        new Date(b.distribution_recorded_at!).getTime() -
        new Date(a.distribution_recorded_at!).getTime(),
    )
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/back-to-school"
            className="text-sm text-gray-600 hover:text-brand-dark inline-flex items-center gap-1 mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Back to School
          </Link>
          <h1 className="text-2xl md:text-4xl font-heading font-black text-brand-dark">
            Day view · Station 4
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Live snapshot of what&rsquo;s happening on the drive. Refreshes
            every 20 seconds — leave open on the Station 4 tablet.
          </p>
        </div>
        <DayViewAutoRefresh intervalMs={20_000} />
      </div>

      {/* PROGRESS STRIP */}
      <div className="bg-white rounded-2xl border-2 border-brand-blue/20 p-5 md:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <p className="font-heading font-bold text-brand-dark text-lg">
            {doneToday} / {totalToServeToday} families served today
          </p>
          <p className="text-xs text-gray-500 uppercase tracking-widest">
            {stillExpected.length} still expected
          </p>
        </div>
        <div className="h-3 rounded-full bg-brand-blue/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-brand-green transition-all duration-500"
            style={{ width: `${Math.min(100, progressPct)}%` }}
          />
        </div>
      </div>

      {/* BIG STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <BigStat
          label="Collected"
          value={collectedToday.length}
          icon={<CheckCircle2 className="h-6 w-6" />}
          tone="green"
        />
        <BigStat
          label="Partial"
          value={partialToday.length}
          icon={<AlertTriangle className="h-6 w-6" />}
          tone="amber"
        />
        <BigStat
          label="No-shows"
          value={noShowToday.length}
          icon={<XCircle className="h-6 w-6" />}
          tone="red"
        />
        <BigStat
          label="Still expected"
          value={stillExpected.length}
          icon={<Clock className="h-6 w-6" />}
          tone="blue"
        />
      </div>

      {/* STOCK STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <BigStat
          label="Total in stock"
          value={totalInStock}
          icon={<Package className="h-6 w-6" />}
          tone="blue"
        />
        <BigStat
          label={`Low stock (≤ ${LOW_STOCK_THRESHOLD})`}
          value={lowStock.length}
          icon={<AlertTriangle className="h-6 w-6" />}
          tone={lowStock.length > 0 ? "amber" : "gray"}
          hint="SKUs almost gone"
        />
        <BigStat
          label="Out of stock"
          value={outOfStock.length}
          icon={<XCircle className="h-6 w-6" />}
          tone={outOfStock.length > 0 ? "red" : "gray"}
          hint="SKUs at zero"
        />
      </div>

      {/* LOW-STOCK LIST + ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5">
          <h3 className="font-heading font-bold text-brand-dark text-lg mb-3 inline-flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Running low
          </h3>
          {lowStock.length === 0 ? (
            <p className="text-sm text-gray-500">
              Nothing under the {LOW_STOCK_THRESHOLD}-unit alert threshold.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {lowStock.slice(0, 12).map((s) => (
                <li
                  key={s.id}
                  className="py-2 flex items-center justify-between text-sm"
                >
                  <span className="text-brand-dark truncate pr-3">
                    {formatSkuLabel(s)}
                  </span>
                  <span className="font-heading font-black text-amber-700 shrink-0">
                    {s.quantity}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {lowStock.length > 12 && (
            <p className="text-xs text-gray-500 mt-2">
              +{lowStock.length - 12} more — see the Stock page.
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5">
          <h3 className="font-heading font-bold text-brand-dark text-lg mb-3 inline-flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-blue" />
            Recent activity
          </h3>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-gray-500">
              No families served yet today. Get set up.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentActivity.map((r) => {
                const time = r.distribution_recorded_at
                  ? new Date(r.distribution_recorded_at).toLocaleTimeString(
                      "en-GB",
                      { hour: "2-digit", minute: "2-digit" },
                    )
                  : "";
                return (
                  <li
                    key={r.id}
                    className="py-2 flex items-center justify-between gap-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-heading font-bold text-brand-dark truncate">
                        {r.parent_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {r.parent_postcode ?? "—"} · {time}
                      </p>
                    </div>
                    <ActivityPill status={r.distribution_status} />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-500">
        {B2S.venueName}, {B2S.venueArea} · {B2S.dateLabel} · {B2S.timeLabel}
      </p>
    </div>
  );
}

function BigStat({
  label,
  value,
  icon,
  tone,
  hint,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "blue" | "green" | "red" | "gray" | "amber";
  hint?: string;
}) {
  const tones: Record<string, { bg: string; text: string; ring: string }> = {
    blue: {
      bg: "bg-brand-blue/10",
      text: "text-brand-blue",
      ring: "border-brand-blue/20",
    },
    green: {
      bg: "bg-brand-green/10",
      text: "text-brand-green",
      ring: "border-brand-green/20",
    },
    red: { bg: "bg-red-100", text: "text-red-700", ring: "border-red-200" },
    gray: { bg: "bg-gray-100", text: "text-gray-600", ring: "border-gray-200" },
    amber: {
      bg: "bg-amber-100",
      text: "text-amber-800",
      ring: "border-amber-200",
    },
  };
  const t = tones[tone];
  return (
    <div
      className={`bg-white rounded-2xl border-2 ${t.ring} p-4 md:p-5 flex items-start justify-between gap-3`}
    >
      <div className="min-w-0">
        <p className="text-xs font-heading font-bold uppercase tracking-widest text-gray-500">
          {label}
        </p>
        <p className="font-heading font-black text-4xl md:text-5xl text-brand-dark mt-2 leading-none">
          {value}
        </p>
        {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      </div>
      <div
        className={`flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-xl shrink-0 ${t.bg} ${t.text}`}
      >
        {icon}
      </div>
    </div>
  );
}

function ActivityPill({ status }: { status: string | null }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    collected: {
      bg: "bg-emerald-100",
      text: "text-emerald-800",
      label: "Collected",
    },
    partial: {
      bg: "bg-amber-100",
      text: "text-amber-800",
      label: "Partial",
    },
    no_show: { bg: "bg-red-100", text: "text-red-800", label: "No-show" },
  };
  const s =
    (status && map[status]) || {
      bg: "bg-gray-100",
      text: "text-gray-700",
      label: status ?? "—",
    };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-heading font-bold uppercase tracking-widest ${s.bg} ${s.text} shrink-0`}
    >
      {s.label}
    </span>
  );
}

function formatSkuLabel(s: {
  category: string;
  colour: string;
  sleeve: string | null;
  fit: string;
  size: string;
}): string {
  const cat = s.category.charAt(0).toUpperCase() + s.category.slice(1);
  const col = s.colour.charAt(0).toUpperCase() + s.colour.slice(1);
  const fit = s.fit.charAt(0).toUpperCase() + s.fit.slice(1);
  const sleeve = s.sleeve ? ` (${s.sleeve})` : "";
  return `${col} ${cat.toLowerCase()}${sleeve} · ${fit} · size ${s.size}`;
}

// Returns the start of "today" in UK time, as a Date whose UTC timestamp is
// the correct instant. Uses Intl to derive the offset — no library needed.
function ukMidnight(now: Date): Date {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) =>
    parts.find((p) => p.type === t)?.value ?? "0";
  const y = Number(get("year"));
  const m = Number(get("month"));
  const d = Number(get("day"));
  // Constructing an ISO with the London offset would be nicer, but the
  // simpler approach: build a UTC date for that Y/M/D 00:00 UK, then adjust
  // by the London offset at that instant. We approximate by trying both 0/1
  // hour UTC offset (BST/GMT). The result is precise to the second.
  const guess = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  // Determine the London offset at the guess:
  const londonHour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      hour: "2-digit",
      hour12: false,
    }).format(guess),
  );
  // If it's 1am UK when we expected 0, subtract 1h; if it's 23h yesterday,
  // add 1h. Handles both BST and GMT correctly.
  if (londonHour === 1) return new Date(guess.getTime() - 3600_000);
  if (londonHour === 23) return new Date(guess.getTime() + 3600_000);
  return guess;
}
