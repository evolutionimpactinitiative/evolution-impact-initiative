import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
  skuCellKey,
  type ChildAsk,
  type StockRow,
} from "@/lib/back-to-school-stock";
import { aggregateReservations } from "@/lib/back-to-school/shopping-list";

// GET /api/back-to-school/stock/export
// Returns a CSV of the full stock matrix: one row per size cell across
// every SKU group, with in-stock / requested / waitlisted / reserved
// counts and both shortfall variants. Team-only — receipts and stock
// levels aren't public data.

async function requireTeam() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401 };
  const { data: teamMember } = await supabase
    .from("team_members")
    .select("id")
    .eq("email", user.email || "")
    .maybeSingle();
  if (!teamMember) return { ok: false as const, status: 403 };
  return { ok: true as const };
}

// CSV-escape: wrap in double-quotes and double any embedded quotes.
// Newlines/commas inside are safe once quoted.
function csvCell(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  const auth = await requireTeam();
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const supabase = createAdminClient();

  // Same queries as the stock page — keep the export honest by using
  // exactly the same source data.
  const { data: stockRaw } = await supabase
    .from("back_to_school_stock")
    .select("id, category, colour, sleeve, fit, size, quantity, notes, updated_at");
  const stockRows = (stockRaw as StockRow[] | null) ?? [];

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

  const activeDemand = aggregateDemand(asks);
  const waitlistDemand = aggregateDemand(waitlistAsks);

  const activeMatrix = buildMatrix(stockRows, activeDemand);

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

  // Notes are on the stock row, not the cell. Index them so the export
  // can include a per-cell note.
  const noteByCell = new Map<string, string>();
  for (const s of stockRows) {
    if (s.notes) {
      noteByCell.set(
        skuCellKey({
          category: s.category,
          colour: s.colour,
          sleeve: s.sleeve,
          fit: s.fit,
          size: s.size,
        }),
        s.notes,
      );
    }
  }

  // Build the rows — one per (group, size) that exists in either stock
  // or demand. Empty cells are skipped to keep the sheet compact.
  const headers = [
    "Category",
    "Colour",
    "Fit",
    "Sleeve",
    "Size",
    "In stock",
    "Requested (approved)",
    "Waitlisted",
    "Reserved (shopping list)",
    "Shortfall (excl waitlist)",
    "Shortfall (incl waitlist)",
    "Notes",
  ];
  const lines: string[] = [headers.map(csvCell).join(",")];

  for (const g of activeMatrix) {
    for (const size of UNIFORM_SIZES) {
      const cellKey = skuCellKey({
        category: g.category,
        colour: g.colour,
        sleeve: g.sleeve,
        fit: g.fit,
        size,
      });
      const cell = g.cells.get(size);
      const stock = cell?.stock ?? 0;
      const requested = cell?.requested ?? 0;
      const waitlisted = waitlistDemand.get(cellKey) ?? 0;
      const reserved = reservedMap.get(cellKey) ?? 0;
      if (stock === 0 && requested === 0 && waitlisted === 0 && reserved === 0) {
        continue;
      }
      const shortExcl = Math.max(0, requested - stock);
      const shortIncl = Math.max(0, requested + waitlisted - stock);
      lines.push(
        [
          g.category,
          g.colour,
          g.fit,
          g.sleeve ?? "",
          size,
          stock,
          requested,
          waitlisted,
          reserved,
          shortExcl,
          shortIncl,
          noteByCell.get(cellKey) ?? "",
        ]
          .map(csvCell)
          .join(","),
      );
    }
  }

  // Excel-friendly: UTF-8 BOM up front so pound signs / accented names
  // render correctly when the file is opened by double-clicking on macOS
  // + Windows Excel.
  const body = "﻿" + lines.join("\r\n") + "\r\n";
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `b2s-stock-${stamp}.csv`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
