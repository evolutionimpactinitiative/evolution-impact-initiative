import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Shuffle,
  Users,
  XCircle,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { B2S_SLUG } from "@/lib/back-to-school";
import type {
  StockAllocation,
  StockCategory,
  StockColour,
  StockFit,
} from "@/lib/back-to-school-stock";
import {
  COLOUR_LABELS,
  FIT_LABELS,
  SLEEVE_LABELS,
} from "@/lib/back-to-school-stock";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Read-only snapshot of the August 22 2026 drive. Every row here still
// exists in the DB — this page just presents the archived state so the
// team can browse who came, who didn't, and what got substituted.

type RegRow = {
  id: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  status: string;
  attended: string | null;
  check_in_time: string | null;
  cancellation_reason: string | null;
  registration_children: Array<{ id: string; child_name: string; child_age: number | null }>;
};

export default async function AugustArchivePage() {
  const admin = createAdminClient();

  const { data: eventRow } = await admin
    .from("events")
    .select("id")
    .eq("slug", B2S_SLUG)
    .maybeSingle();
  const event = eventRow as { id: string } | null;
  if (!event) notFound();

  // Every registration for the August drive, in a stable order
  const { data: regsRaw } = await admin
    .from("registrations")
    .select(
      `id, parent_name, parent_email, parent_phone, status, attended,
       check_in_time, cancellation_reason,
       registration_children ( id, child_name, child_age )`,
    )
    .eq("event_id", event.id)
    .order("parent_name", { ascending: true });
  const regs = (regsRaw as RegRow[] | null) ?? [];

  // Substitutions made during the drive (all archived on 26 Aug)
  const { data: allocRaw } = await admin
    .from("back_to_school_stock_allocations")
    .select("*")
    .not("archived_at", "is", null)
    .order("created_at", { ascending: true });
  const allocations = (allocRaw as StockAllocation[] | null) ?? [];

  // Stock movements for drive day (real distribution history)
  const { data: distRaw } = await admin
    .from("back_to_school_stock_movements")
    .select("id, delta, registration_id, child_id, created_at")
    .eq("reason", "distributed")
    .gte("created_at", "2026-08-22T00:00:00")
    .lt("created_at", "2026-08-23T00:00:00");
  const distributions =
    (distRaw as Array<{
      id: string;
      delta: number;
      registration_id: string | null;
      child_id: string | null;
    }> | null) ?? [];

  // ─── Buckets for the summary tiles ──────────────────────────────
  const attendedRegs = regs.filter((r) => r.attended === "yes");
  const noShowRegs = regs.filter(
    (r) => r.cancellation_reason === "august_no_show",
  );
  const declinedRegs = regs.filter((r) => r.status === "declined");
  const totalKids = regs.reduce(
    (n, r) => n + (r.registration_children?.length ?? 0),
    0,
  );
  const itemsDistributed = distributions.reduce((n, d) => n + Math.abs(d.delta), 0);
  const substitutions = allocations.length;

  return (
    <div className="space-y-6 pb-16">
      <div>
        <Link
          href="/admin/back-to-school"
          className="text-sm text-gray-600 hover:text-brand-dark inline-flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Back to School
        </Link>
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="text-2xl md:text-3xl font-heading font-black text-brand-dark inline-flex items-center gap-2">
            <Archive className="h-6 w-6 text-brand-blue" />
            August drive archive
          </h1>
          <span className="text-xs font-heading font-bold uppercase tracking-widest bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            Read only
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Saturday 22 August 2026, Sunlight Centre, Gillingham. Snapshot
          taken 26 August 2026 after the physical stock count.
        </p>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tile
          label="Registered"
          value={regs.length}
          subtitle={`${totalKids} children`}
          icon={<Users className="h-5 w-5" />}
          tone="blue"
        />
        <Tile
          label="Attended"
          value={attendedRegs.length}
          subtitle={`${itemsDistributed} items distributed`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="emerald"
        />
        <Tile
          label="No-shows"
          value={noShowRegs.length}
          subtitle="Auto-cancelled"
          icon={<XCircle className="h-5 w-5" />}
          tone="red"
        />
        <Tile
          label="Substitutions"
          value={substitutions}
          subtitle="Made during prep"
          icon={<Shuffle className="h-5 w-5" />}
          tone="amber"
        />
      </div>

      {/* Attended families */}
      <FamilyList
        title="Families who attended"
        subtitle="From drive-day scan history. Their items were handed out."
        colour="emerald"
        rows={attendedRegs}
        showCheckIn
      />

      {/* No-shows */}
      <FamilyList
        title="No-shows"
        subtitle="Approved for August but did not attend. Being invited to the Collection Day on 5 September."
        colour="amber"
        rows={noShowRegs}
      />

      {/* Declined */}
      {declinedRegs.length > 0 && (
        <FamilyList
          title="Declined at registration"
          subtitle="Applied but didn't meet the criteria (age range, etc)."
          colour="gray"
          rows={declinedRegs}
        />
      )}

      {/* Substitutions log */}
      <section className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Shuffle className="h-4 w-4 text-amber-600" />
          <h2 className="font-heading font-bold text-brand-dark">
            Substitutions made
          </h2>
        </div>
        <p className="text-xs text-gray-600 mb-3">
          Each row is a SKU-to-SKU swap the team made during prep when
          exact-size stock ran short. Archived so they no longer affect
          the collection drive&rsquo;s free-stock math.
        </p>
        {allocations.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            No substitutions on record.
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto -mx-2 px-2">
            <ul className="divide-y divide-gray-100">
              {allocations.map((a) => (
                <li key={a.id} className="py-2 text-xs flex items-center gap-2">
                  <span className="flex-1 min-w-0">
                    <b className="text-brand-dark">{a.qty}</b>
                    {" · "}
                    <span className="text-gray-700">
                      {skuLabel(a.category, a.from_colour, a.from_sleeve, a.from_fit, a.from_size)}
                    </span>
                    <ArrowRight className="inline h-3 w-3 text-gray-400 mx-1" />
                    <span className="text-gray-700">
                      {skuLabel(a.category, a.to_colour, a.to_sleeve, a.to_fit, a.to_size)}
                    </span>
                    {a.note && (
                      <span className="text-gray-500 italic"> ({a.note})</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

function skuLabel(
  cat: StockCategory,
  colour: StockColour,
  sleeve: string | null,
  fit: StockFit,
  size: string,
) {
  const s = sleeve ? ` ${SLEEVE_LABELS[sleeve as keyof typeof SLEEVE_LABELS]}` : "";
  return `${COLOUR_LABELS[colour]} ${cat}${s} ${FIT_LABELS[fit]} size ${size}`;
}

function FamilyList({
  title,
  subtitle,
  colour,
  rows,
  showCheckIn,
}: {
  title: string;
  subtitle: string;
  colour: "emerald" | "amber" | "gray";
  rows: RegRow[];
  showCheckIn?: boolean;
}) {
  const tones: Record<string, string> = {
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    gray: "text-gray-500",
  };
  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5">
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <h2 className="font-heading font-bold text-brand-dark">
          {title}
        </h2>
        <p className={`text-xs font-heading font-bold uppercase tracking-widest ${tones[colour]}`}>
          {rows.length}
        </p>
      </div>
      <p className="text-xs text-gray-600 mb-3">{subtitle}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500 italic">Nothing here.</p>
      ) : (
        <div className="max-h-80 overflow-y-auto -mx-2 px-2">
          <ul className="divide-y divide-gray-100">
            {rows.map((r) => (
              <li key={r.id} className="py-2 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-heading font-bold text-brand-dark truncate">
                    {r.parent_name}
                  </p>
                  {showCheckIn && r.check_in_time && (
                    <p className="text-xs text-gray-500 shrink-0">
                      {new Date(r.check_in_time).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {r.parent_email} · {r.parent_phone}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {r.registration_children.length}{" "}
                  {r.registration_children.length === 1 ? "child" : "children"}
                  {r.registration_children.length > 0 && ": "}
                  {r.registration_children.map((c) => c.child_name).join(", ")}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Tile({
  label,
  value,
  subtitle,
  icon,
  tone,
}: {
  label: string;
  value: number;
  subtitle?: string;
  icon: React.ReactNode;
  tone: "blue" | "emerald" | "red" | "amber";
}) {
  const tones: Record<string, { bg: string; text: string }> = {
    blue: { bg: "bg-brand-blue/10", text: "text-brand-blue" },
    emerald: { bg: "bg-emerald-100", text: "text-emerald-700" },
    red: { bg: "bg-red-100", text: "text-red-700" },
    amber: { bg: "bg-amber-100", text: "text-amber-700" },
  };
  const t = tones[tone];
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{label}</p>
          <p className="text-2xl lg:text-3xl font-bold text-brand-dark mt-1">
            {value}
          </p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${t.bg} ${t.text}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
