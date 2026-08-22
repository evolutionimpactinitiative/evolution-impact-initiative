import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { B2S_SLUG } from "@/lib/back-to-school";
import type {
  UniformChoices,
  ChildSex,
  UniformSize,
} from "@/lib/back-to-school";
import {
  aggregateDemand,
  buildMatrix,
  effectiveCell,
  indexAllocations,
  skuCellKey,
  skusForChild,
  skuGroupLabel,
  type ChildAsk,
  type StockAllocation,
  type StockRow,
  type StockCategory,
  type StockColour,
  type StockFit,
  type StockSleeve,
} from "@/lib/back-to-school-stock";
import {
  indexReservations,
  type PickReservation,
} from "@/lib/back-to-school/pick-reservations";
import { PickPrepView } from "@/components/back-to-school/PickPrepView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  params: Promise<{ qr_token: string }>;
  searchParams: Promise<{ s?: string }>;
}

interface Child {
  id: string;
  child_name: string;
  child_age: number | null;
  uniform_size: string | null;
  sex: ChildSex | null;
  school: string | null;
  needs: string[] | null;
  uniform_choices: UniformChoices | null;
  notes: string | null;
  display_order: number;
}

export default async function B2SPrepPage({ params, searchParams }: Props) {
  const { qr_token } = await params;
  const { s: stewardToken } = await searchParams;

  const admin = createAdminClient();

  const { data: eventRow } = await admin
    .from("events")
    .select("id")
    .eq("slug", B2S_SLUG)
    .maybeSingle();
  const eventId = eventRow ? (eventRow as { id: string }).id : null;

  if (!stewardToken || !eventId) {
    return <ErrorState message="Steward token required." />;
  }
  const { data: tokenRow } = await admin
    .from("festival_steward_tokens")
    .select("id, event_id, revoked_at")
    .eq("token", stewardToken)
    .maybeSingle();
  const token = tokenRow as {
    id: string;
    event_id: string;
    revoked_at: string | null;
  } | null;
  if (!token || token.event_id !== eventId || token.revoked_at) {
    return <ErrorState message="Steward not authorised." />;
  }

  // Fetch the family and its children
  const { data: reg } = await admin
    .from("registrations")
    .select(
      `id, parent_name, parent_phone, status, qr_token,
       registration_children (
         id, child_name, child_age, uniform_size, sex, school, needs,
         uniform_choices, notes, display_order
       )`,
    )
    .eq("qr_token", qr_token)
    .maybeSingle();
  const family = reg as
    | {
        id: string;
        parent_name: string;
        parent_phone: string;
        status: string;
        qr_token: string;
        registration_children: Child[];
      }
    | null;
  if (!family) {
    return <ErrorState message="QR not recognised — no family found." />;
  }

  const kids = [...(family.registration_children ?? [])].sort(
    (a, b) => a.display_order - b.display_order,
  );

  // Compute each child's asks (list of required SKUs)
  const childAsks: Array<{ child: Child; asks: ReturnType<typeof skusForChild> }> =
    kids.map((c) => {
      if (
        !c.uniform_size ||
        !c.uniform_choices ||
        !(c.needs ?? []).includes("uniform")
      ) {
        return { child: c, asks: [] };
      }
      const ask: ChildAsk = {
        child_id: c.id,
        sex: c.sex,
        uniform_size: c.uniform_size as UniformSize,
        uniform_choices: c.uniform_choices,
      };
      return { child: c, asks: skusForChild(ask) };
    });

  // ─── Global stock context (allocations + reservations included) ──
  const { data: stockRaw } = await admin
    .from("back_to_school_stock")
    .select("id, category, colour, sleeve, fit, size, quantity, notes, updated_at");
  const stockRows = (stockRaw as StockRow[] | null) ?? [];

  // Global demand — everyone else's requests, needed so the substitute
  // picker only offers cells that have TRUE spare.
  const { data: activeRegs } = await admin
    .from("registrations")
    .select("id")
    .eq("event_id", eventId)
    .in("status", ["pending", "approved"]);
  const regIds = ((activeRegs as { id: string }[] | null) ?? []).map((r) => r.id);
  const allAsks: ChildAsk[] = [];
  if (regIds.length > 0) {
    const { data: children } = await admin
      .from("registration_children")
      .select("id, registration_id, sex, uniform_size, uniform_choices, needs")
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
      allAsks.push({
        child_id: c.id,
        sex: c.sex,
        uniform_size: c.uniform_size as UniformSize,
        uniform_choices: c.uniform_choices,
      });
    }
  }
  const globalDemand = aggregateDemand(allAsks);
  const matrix = buildMatrix(stockRows, globalDemand);

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
  const allReservations = (resRaw as PickReservation[] | null) ?? [];
  const reservationIndex = indexReservations(allReservations);

  // Reservations SPECIFIC to this family, so we can pre-select any
  // choices the steward already made (e.g. reload the page).
  const familyReservations = allReservations.filter(
    (r) => r.registration_id === family.id,
  );

  // Flatten matrix into an EffectiveCellRow[] so the client can render
  // candidate substitutes with the right numbers.
  interface EffectiveCellRow {
    category: StockCategory;
    colour: StockColour;
    sleeve: StockSleeve;
    fit: StockFit;
    size: string;
    label: string;
    freeStock: number;
    uncovered: number;
    shortfall: number;
    surplus: number;
  }
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
      const ec = effectiveCell(cell, key, allocIndex, reservationIndex);
      allEffectiveCells.push({
        category: g.category,
        colour: g.colour,
        sleeve: g.sleeve,
        fit: g.fit,
        size,
        label: skuGroupLabel(g),
        freeStock: ec.freeStock,
        uncovered: ec.uncovered,
        shortfall: ec.shortfall,
        surplus: ec.surplus,
      });
    }
  }

  // For each child + each ask, get its effective status
  interface AskWithStatus {
    ask: {
      category: StockCategory;
      colour: StockColour;
      sleeve: StockSleeve;
      fit: StockFit;
      size: string;
    };
    label: string;
    freeStock: number;
  }
  const childrenPrep = childAsks.map(({ child, asks }) => {
    const askStatuses: AskWithStatus[] = asks.map((a) => {
      const key = skuCellKey(a);
      const parts = key.split("|");
      const grp = matrix.find(
        (g) => g.key ===
          [parts[0], parts[1], parts[2], parts[3]].join("|"),
      );
      const cell = grp?.cells.get(a.size);
      const ec = effectiveCell(cell, key, allocIndex, reservationIndex);
      return {
        ask: a,
        label: skuGroupLabel(a),
        freeStock: ec.freeStock,
      };
    });
    return { child, askStatuses };
  });

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 md:py-10">
      <div className="max-w-2xl mx-auto space-y-4">
        <Link
          href={`/b2s/scan/${encodeURIComponent(stewardToken)}?mode=checkin`}
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-brand-dark"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to scanner
        </Link>
        <div>
          <p className="text-xs font-heading font-bold uppercase tracking-widest text-brand-blue">
            Station 2 · Prep
          </p>
          <h1 className="text-2xl md:text-3xl font-heading font-black text-brand-dark mt-1">
            {family.parent_name}
          </h1>
          <p className="text-sm text-gray-600 mt-0.5">
            {family.parent_phone} · {kids.length} child
            {kids.length === 1 ? "" : "ren"}
          </p>
        </div>

        <PickPrepView
          registrationId={family.id}
          stewardToken={stewardToken}
          qrToken={family.qr_token}
          children={childrenPrep}
          existingReservations={familyReservations}
          allCells={allEffectiveCells}
        />
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center border border-red-200">
        <AlertTriangle className="h-10 w-10 text-red-600 mx-auto mb-4" />
        <h1 className="font-heading font-black text-2xl text-brand-dark mb-2">
          Can&rsquo;t prep
        </h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-heading font-bold uppercase tracking-widest text-brand-blue hover:text-brand-dark"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Home
        </Link>
      </div>
    </div>
  );
}
