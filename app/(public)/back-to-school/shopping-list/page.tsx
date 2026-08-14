import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  B2S,
  B2S_SLUG,
  type ChildSex,
  type UniformChoices,
  type UniformSize,
} from "@/lib/back-to-school";
import {
  aggregateDemand,
  type ChildAsk,
} from "@/lib/back-to-school-stock";
import {
  buildShoppingList,
  type ShoppingReservation,
} from "@/lib/back-to-school/shopping-list";
import { ShoppingListClient } from "@/components/back-to-school/ShoppingListClient";

export const metadata: Metadata = {
  title: `Shop for Back to School | ${B2S.title}`,
  robots: { index: false, follow: false },
};

export const revalidate = 0;
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ k?: string }>;
}

export default async function BackToSchoolShoppingListPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const providedKey = (params.k ?? "").trim();
  const expectedKey = (process.env.B2S_SHOPPING_LIST_KEY ?? "").trim();
  const keyValid =
    expectedKey.length > 0 && providedKey === expectedKey;

  if (!keyValid) {
    return <InvalidLink />;
  }

  const supabase = createAdminClient();

  // Load active demand from families
  const { data: eventRow } = await supabase
    .from("events")
    .select("id")
    .eq("slug", B2S_SLUG)
    .maybeSingle();
  const asks: ChildAsk[] = [];
  if (eventRow) {
    const eventId = (eventRow as { id: string }).id;
    const { data: activeRegs } = await supabase
      .from("registrations")
      .select("id")
      .eq("event_id", eventId)
      .in("status", ["pending", "approved"]);
    const regIds = ((activeRegs as { id: string }[] | null) ?? []).map(
      (r) => r.id,
    );
    if (regIds.length > 0) {
      const { data: kids } = await supabase
        .from("registration_children")
        .select("id, sex, uniform_size, uniform_choices, needs")
        .in("registration_id", regIds);
      const list =
        (kids as Array<{
          id: string;
          sex: ChildSex | null;
          uniform_size: string | null;
          uniform_choices: UniformChoices | null;
          needs: string[] | null;
        }> | null) ?? [];
      for (const c of list) {
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
  }
  const demand = aggregateDemand(asks);

  // Current stock + reservations
  const { data: stockRaw } = await supabase
    .from("back_to_school_stock")
    .select("category, colour, sleeve, fit, size, quantity");
  const stockRows =
    (stockRaw as Array<{
      category: string;
      colour: string;
      sleeve: string | null;
      fit: string;
      size: string;
      quantity: number;
    }> | null) ?? [];

  const { data: rsvRaw } = await supabase
    .from("back_to_school_shopping_reservations")
    .select("id, pledger_id, category, colour, sleeve, fit, size, qty, status, notes, created_at, received_at")
    .eq("status", "reserved");
  const reservations =
    (rsvRaw as ShoppingReservation[] | null) ?? [];

  const needRows = buildShoppingList({
    demand,
    stockRows,
    reservations: reservations.map((r) => ({
      category: r.category,
      colour: r.colour,
      sleeve: r.sleeve,
      fit: r.fit,
      size: r.size,
      qty: r.qty,
      status: r.status,
    })),
  });

  return (
    <ShoppingListClient
      keyParam={providedKey}
      needRows={needRows}
      reservations={reservations}
      venue={{
        name: B2S.venueName,
        address: B2S.venueAddress,
        area: B2S.venueArea,
        dateLabel: B2S.dateLabel,
        timeLabel: B2S.timeLabel,
      }}
    />
  );
}

function InvalidLink() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center border border-red-200">
        <AlertTriangle className="h-10 w-10 text-red-600 mx-auto mb-4" />
        <h1 className="font-heading font-black text-2xl text-brand-dark mb-2">
          This link isn&rsquo;t valid
        </h1>
        <p className="text-gray-600 mb-6">
          The shopping list link you followed is missing or has been rotated.
          Please ask for a fresh link.
        </p>
        <Link
          href="/back-to-school"
          className="inline-flex items-center gap-1 text-sm font-heading font-bold uppercase tracking-widest text-brand-blue hover:text-brand-dark"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to the drive
        </Link>
      </div>
    </div>
  );
}
