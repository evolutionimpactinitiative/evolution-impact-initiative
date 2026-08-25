import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  COLLECTION,
  COLLECTION_SLUG,
} from "@/lib/back-to-school/collection";
import type {
  ChildSex,
  UniformChoices,
  UniformSize,
} from "@/lib/back-to-school";
import {
  aggregateDemand,
  buildMatrix,
  effectiveCell,
  indexAllocations,
  skuCellKey,
  type ChildAsk,
  type StockAllocation,
  type StockRow,
} from "@/lib/back-to-school-stock";
import {
  indexReservations,
  type PickReservation,
} from "@/lib/back-to-school/pick-reservations";
import {
  CollectionRegisterForm,
  type AvailableCell,
} from "@/components/back-to-school/CollectionRegisterForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: `Book a slot, ${COLLECTION.title}`,
  description:
    "Pre-book a 30-minute collection slot, pick what you need per child from what we've got in stock, and turn up on the day.",
};

export default async function CollectionRegisterPage() {
  const admin = createAdminClient();

  // ── Event
  const { data: eventRow } = await admin
    .from("events")
    .select("id")
    .eq("slug", COLLECTION_SLUG)
    .maybeSingle();
  const event = eventRow as { id: string } | null;

  // ── Stock
  const { data: stockRaw } = await admin
    .from("back_to_school_stock")
    .select(
      "id, category, colour, sleeve, fit, size, quantity, notes, updated_at",
    );
  const stockRows = (stockRaw as StockRow[] | null) ?? [];

  // ── Global demand across BOTH drives (so free stock is accurate)
  const { data: activeRegs } = await admin
    .from("registrations")
    .select("id")
    .in("status", ["pending", "approved"]);
  const regIds = ((activeRegs as { id: string }[] | null) ?? []).map(
    (r) => r.id,
  );
  const asks: ChildAsk[] = [];
  if (regIds.length > 0) {
    const { data: children } = await admin
      .from("registration_children")
      .select("id, sex, uniform_size, uniform_choices, needs")
      .in("registration_id", regIds);
    for (const c of (children as Array<{
      id: string;
      sex: ChildSex | null;
      uniform_size: string | null;
      uniform_choices: UniformChoices | null;
      needs: string[] | null;
    }> | null) ?? []) {
      if (!c.uniform_size || !c.uniform_choices) continue;
      if (!(c.needs ?? []).includes("uniform")) continue;
      asks.push({
        child_id: c.id,
        sex: c.sex,
        uniform_size: c.uniform_size as UniformSize,
        uniform_choices: c.uniform_choices,
      });
    }
  }
  const demand = aggregateDemand(asks);
  const matrix = buildMatrix(stockRows, demand);

  // ── Allocations + pending reservations
  const { data: allocRaw } = await admin
    .from("back_to_school_stock_allocations")
    .select("*");
  const allocIndex = indexAllocations(
    (allocRaw as StockAllocation[] | null) ?? [],
  );
  const { data: resRaw } = await admin
    .from("back_to_school_pick_reservations")
    .select("*")
    .eq("status", "reserved");
  const reservationIndex = indexReservations(
    (resRaw as PickReservation[] | null) ?? [],
  );

  // ── Flatten → AvailableCell[] (only ones with real free stock)
  const availableCells: AvailableCell[] = [];
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
      if (ec.freeStock <= 0) continue;
      availableCells.push({
        category: g.category,
        colour: g.colour,
        sleeve: g.sleeve,
        fit: g.fit,
        size,
        freeStock: ec.freeStock,
      });
    }
  }

  // ── Slot occupancy for this event
  const slotCounts: Record<string, number> = {};
  if (event) {
    const { data: regs } = await admin
      .from("registrations")
      .select("collection_slot, status")
      .eq("event_id", event.id)
      .in("status", ["approved", "pending"])
      .not("collection_slot", "is", null);
    for (const r of (regs as { collection_slot: string }[] | null) ?? []) {
      slotCounts[r.collection_slot] = (slotCounts[r.collection_slot] ?? 0) + 1;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 md:py-12">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href="/back-to-school/collection"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-brand-dark"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to collection day info
        </Link>
        <div>
          <p className="text-xs font-heading font-bold uppercase tracking-widest text-brand-blue">
            Collection Day booking
          </p>
          <h1 className="text-3xl md:text-4xl font-heading font-black text-brand-dark mt-1">
            Book your slot
          </h1>
          <p className="text-sm text-gray-700 mt-2 leading-relaxed">
            You&rsquo;ll only be shown items we currently have in your
            child&rsquo;s size. Submitting reserves the items and locks
            your slot straight away.
          </p>
        </div>

        <CollectionRegisterForm
          availableCells={availableCells}
          slotCounts={slotCounts}
        />
      </div>
    </div>
  );
}
