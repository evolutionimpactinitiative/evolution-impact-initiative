import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  User,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  COLLECTION,
  COLLECTION_SLOTS,
  slotIso,
  slotLabel,
} from "@/lib/back-to-school/collection";
import {
  aggregateDemand,
  buildMatrix,
  effectiveCell,
  indexAllocations,
  skuCellKey,
  CATEGORY_LABELS,
  COLOUR_LABELS,
  SLEEVE_LABELS,
  type ChildAsk,
  type StockAllocation,
  type StockCategory,
  type StockColour,
  type StockFit,
  type StockRow,
  type StockSleeve,
} from "@/lib/back-to-school-stock";
import {
  indexReservations,
  isSubstitute,
  type PickReservation,
} from "@/lib/back-to-school/pick-reservations";
import type { UniformChoices, UniformSize, ChildSex } from "@/lib/back-to-school";
import {
  PackSheet,
  type PackReservation,
  type StockOption,
} from "@/components/admin/back-to-school/PackSheet";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  params: Promise<{ childId: string }>;
}

export default async function CollectionPackPage({ params }: Props) {
  const { childId } = await params;
  const admin = createAdminClient();

  // ── Child + parent context ──────────────────────────────────────
  const { data: childRow } = await admin
    .from("registration_children")
    .select(
      `id, registration_id, child_name, child_age, sex, school,
       uniform_size, uniform_choices, needs, notes,
       packed_at, packed_by`,
    )
    .eq("id", childId)
    .maybeSingle();
  const child = childRow as {
    id: string;
    registration_id: string;
    child_name: string;
    child_age: number | null;
    sex: string | null;
    school: string | null;
    uniform_size: string | null;
    uniform_choices: UniformChoices | null;
    needs: string[] | null;
    notes: string | null;
    packed_at: string | null;
    packed_by: string | null;
  } | null;
  if (!child) notFound();

  const { data: regRow } = await admin
    .from("registrations")
    .select("id, event_id, parent_name, parent_email, parent_phone, collection_slot, status")
    .eq("id", child.registration_id)
    .maybeSingle();
  const reg = regRow as {
    id: string;
    event_id: string;
    parent_name: string;
    parent_email: string;
    parent_phone: string;
    collection_slot: string | null;
    status: string;
  } | null;
  if (!reg) notFound();

  // ── Active reservations for this child (also fetch consumed for the
  //     "already packed" view so the steward can see what went in). ──
  const { data: resRaw } = await admin
    .from("back_to_school_pick_reservations")
    .select("*")
    .eq("child_id", childId)
    .in("status", child.packed_at ? ["consumed", "reserved"] : ["reserved"]);
  const reservations = (resRaw as PickReservation[] | null) ?? [];

  // ── Stock availability for the substitute picker ────────────────
  const { data: stockRaw } = await admin
    .from("back_to_school_stock")
    .select("id, category, colour, sleeve, fit, size, quantity, notes, updated_at");
  const stockRows = (stockRaw as StockRow[] | null) ?? [];

  const { data: activeRegs } = await admin
    .from("registrations")
    .select("id")
    .eq("event_id", reg.event_id)
    .in("status", ["pending", "approved"]);
  const regIds = ((activeRegs as { id: string }[] | null) ?? []).map((r) => r.id);
  const allAsks: ChildAsk[] = [];
  if (regIds.length > 0) {
    const { data: kids } = await admin
      .from("registration_children")
      .select("id, sex, uniform_size, uniform_choices, needs")
      .in("registration_id", regIds);
    for (const c of ((kids as Array<{
      id: string;
      sex: ChildSex | null;
      uniform_size: string | null;
      uniform_choices: UniformChoices | null;
      needs: string[] | null;
    }> | null) ?? [])) {
      if (!c.uniform_size || !c.uniform_choices) continue;
      if (!(c.needs ?? []).includes("uniform")) continue;
      allAsks.push({
        child_id: c.id,
        sex: c.sex,
        uniform_size: c.uniform_size as UniformSize,
        uniform_choices: c.uniform_choices,
      });
    }
  }
  const demand = aggregateDemand(allAsks);
  const matrix = buildMatrix(stockRows, demand);

  const { data: allocRaw } = await admin
    .from("back_to_school_stock_allocations")
    .select("*");
  const allocIndex = indexAllocations(
    (allocRaw as StockAllocation[] | null) ?? [],
  );

  const { data: allResRaw } = await admin
    .from("back_to_school_pick_reservations")
    .select("*")
    .eq("status", "reserved");
  const allReserved = (allResRaw as PickReservation[] | null) ?? [];
  const reservationIndex = indexReservations(allReserved);

  // Flatten every stock cell into StockOption for the picker. Filter
  // to freeStock >= 1 so we only offer things actually available.
  const stockOptions: StockOption[] = [];
  for (const g of matrix) {
    for (const [size, cell] of g.cells.entries()) {
      const key = skuCellKey({
        category: g.category,
        colour: g.colour,
        sleeve: g.sleeve,
        fit: g.fit,
        size,
      });
      const ec = effectiveCell(cell, key, allocIndex, reservationIndex);
      if (ec.freeStock < 1) continue;
      stockOptions.push({
        category: g.category,
        colour: g.colour,
        sleeve: g.sleeve,
        fit: g.fit,
        size,
        freeStock: ec.freeStock,
      });
    }
  }

  // ── Reservation → PackReservation view model ────────────────────
  const activeReservations: PackReservation[] = reservations
    .filter((r) => r.status === "reserved")
    .map((r) => ({
      id: r.id,
      category: r.category,
      colour: r.colour,
      sleeve: r.sleeve,
      fit: r.fit,
      size: r.size,
      qty: r.qty,
      isSubstitute: isSubstitute(r),
      originalLabel: isSubstitute(r)
        ? itemLabel(
            r.original_category ?? r.category,
            r.original_colour ?? r.colour,
            r.original_sleeve,
            r.original_size ?? r.size,
          )
        : null,
    }));

  const consumedReservations: PackReservation[] = reservations
    .filter((r) => r.status === "consumed")
    .map((r) => ({
      id: r.id,
      category: r.category,
      colour: r.colour,
      sleeve: r.sleeve,
      fit: r.fit,
      size: r.size,
      qty: r.qty,
      isSubstitute: isSubstitute(r),
      originalLabel: isSubstitute(r)
        ? itemLabel(
            r.original_category ?? r.category,
            r.original_colour ?? r.colour,
            r.original_sleeve,
            r.original_size ?? r.size,
          )
        : null,
    }));

  // Extras (non-stock items that still need to go in the bag)
  const extras: string[] = [];
  const needs = child.needs ?? [];
  if (needs.includes("stationery")) extras.push("Stationery pack");
  if (needs.includes("bag")) extras.push("School bag");

  const slotHuman = reg.collection_slot ? humanSlot(reg.collection_slot) : null;

  // Fetch the packer name for the packed-view header
  let packedByName: string | null = null;
  if (child.packed_at && child.packed_by) {
    const { data: memberRow } = await admin
      .from("team_members")
      .select("full_name")
      .eq("id", child.packed_by)
      .maybeSingle();
    packedByName = (memberRow as { full_name: string } | null)?.full_name ?? null;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div>
        <Link
          href="/admin/back-to-school/collection"
          className="text-sm text-gray-600 hover:text-brand-dark inline-flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Collection Day
        </Link>
        <h1 className="text-2xl md:text-3xl font-heading font-black text-brand-dark">
          Pack {child.child_name}&rsquo;s bag
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          For <b>{reg.parent_name}</b> · {reg.parent_email} · {reg.parent_phone}
        </p>
      </div>

      {/* Slot + child summary card */}
      <section className="bg-white border border-gray-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCell
          icon={<Clock className="h-4 w-4" />}
          label="Slot"
          value={slotHuman ?? "Unslotted"}
          subValue={COLLECTION.dateLabel}
        />
        <SummaryCell
          icon={<User className="h-4 w-4" />}
          label="Child"
          value={child.child_name}
          subValue={
            [
              child.child_age != null ? `age ${child.child_age}` : null,
              child.sex === "male" ? "boy" : child.sex === "female" ? "girl" : null,
              child.uniform_size ? `size ${child.uniform_size}` : null,
            ]
              .filter(Boolean)
              .join(" · ") || null
          }
        />
        <SummaryCell
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Status"
          value={child.packed_at ? "Packed" : "To pack"}
          subValue={
            child.packed_at
              ? `${new Date(child.packed_at).toLocaleString("en-GB", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}${packedByName ? ` · ${packedByName}` : ""}`
              : null
          }
          tone={child.packed_at ? "emerald" : "amber"}
        />
      </section>

      {child.school && (
        <p className="text-sm text-gray-600">
          School: <b>{child.school}</b>
        </p>
      )}
      {child.notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs text-amber-800 font-heading font-bold uppercase tracking-widest">
            Parent note
          </p>
          <p className="text-sm text-amber-900 mt-1">{child.notes}</p>
        </div>
      )}

      {/* Already-packed view */}
      {child.packed_at ? (
        <section className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <div className="flex items-start gap-3 mb-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
            <div>
              <h2 className="font-heading font-black text-brand-dark">
                Bag packed and ready
              </h2>
              <p className="text-sm text-emerald-800 mt-0.5">
                Parent has been emailed. Waiting for {reg.parent_name} to arrive
                at their slot.
              </p>
            </div>
          </div>
          <p className="text-xs uppercase tracking-widest font-heading font-bold text-emerald-800 mb-2">
            What went in the bag
          </p>
          <ul className="text-sm text-brand-dark space-y-1">
            {consumedReservations.map((r) => (
              <li key={r.id}>
                • {formatConsumed(r)}
                {r.isSubstitute && r.originalLabel && (
                  <span className="text-xs text-amber-700 ml-2">
                    (substitute for {r.originalLabel})
                  </span>
                )}
              </li>
            ))}
            {extras.map((x) => (
              <li key={x}>• {x}</li>
            ))}
          </ul>
        </section>
      ) : (
        <>
          <h2 className="font-heading font-bold text-brand-dark">
            Items to pack
          </h2>
          <PackSheet
            childId={childId}
            childName={child.child_name}
            reservations={activeReservations}
            extras={extras}
            stockOptions={stockOptions}
            alreadyPacked={false}
          />
        </>
      )}
    </div>
  );
}

function SummaryCell({
  icon,
  label,
  value,
  subValue,
  tone = "gray",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string | null;
  tone?: "gray" | "emerald" | "amber";
}) {
  const tones: Record<string, string> = {
    gray: "text-gray-500",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
  };
  return (
    <div>
      <p
        className={`text-[10px] uppercase tracking-widest font-heading font-bold flex items-center gap-1 ${tones[tone]}`}
      >
        {icon}
        {label}
      </p>
      <p className="font-heading font-black text-brand-dark mt-1">{value}</p>
      {subValue && <p className="text-xs text-gray-500 mt-0.5">{subValue}</p>}
    </div>
  );
}

function itemLabel(
  category: StockCategory,
  colour: StockColour,
  sleeve: StockSleeve,
  size: string,
): string {
  const c = COLOUR_LABELS[colour] ?? colour;
  const cat = CATEGORY_LABELS[category].toLowerCase();
  const slv = sleeve ? SLEEVE_LABELS[sleeve] : null;
  return `${c} ${cat}${slv ? ` (${slv})` : ""} · size ${size}`;
}

function formatConsumed(r: PackReservation): string {
  const c = COLOUR_LABELS[r.colour] ?? r.colour;
  const cat = CATEGORY_LABELS[r.category].toLowerCase();
  const slv = r.sleeve ? SLEEVE_LABELS[r.sleeve] : null;
  const fitTag = r.fit === "unisex" ? " unisex" : "";
  return `${c} ${cat}${slv ? ` (${slv})` : ""} · size ${r.size}${fitTag}${
    r.qty > 1 ? ` × ${r.qty}` : ""
  }`;
}

function humanSlot(iso: string): string {
  const t = new Date(iso).getTime();
  for (const s of COLLECTION_SLOTS) {
    if (new Date(slotIso(s)).getTime() === t) return slotLabel(s);
  }
  return iso;
}
