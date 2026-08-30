import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import { COLLECTION } from "@/lib/back-to-school/collection";
import { buildSubstitutionEmail } from "@/lib/back-to-school/collection-emails";
import {
  aggregateDemand,
  buildMatrix,
  effectiveCell,
  indexAllocations,
  skuCellKey,
  type ChildAsk,
  type StockAllocation,
  type StockCategory,
  type StockColour,
  type StockFit,
  type StockRow,
  type StockSleeve,
  COLOUR_LABELS,
  SLEEVE_LABELS,
  CATEGORY_LABELS,
} from "@/lib/back-to-school-stock";
import {
  indexReservations,
  type PickReservation,
} from "@/lib/back-to-school/pick-reservations";
import type { UniformChoices, UniformSize, ChildSex } from "@/lib/back-to-school";

// POST /api/back-to-school/collection/pack/[childId]/substitute
//
// Swap one of a child's pick_reservations for a different SKU in the
// same category. Used when stock was miscounted — steward can't find
// the size the parent picked. Also emails the parent.

interface Body {
  reservation_id?: string;
  category?: StockCategory;
  colour?: StockColour;
  sleeve?: StockSleeve;
  fit?: StockFit;
  size?: string;
  reason?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> },
) {
  const { childId } = await params;
  const body = (await request.json()) as Body;

  // ── Auth ────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return err("Not signed in", 401);
  const { data: memberRow } = await supabase
    .from("team_members")
    .select("id")
    .eq("email", user.email)
    .maybeSingle();
  const teamMemberId = (memberRow as { id: string } | null)?.id ?? null;
  if (!teamMemberId) return err("Not authorised", 403);

  // ── Validate body ───────────────────────────────────────────────
  const { reservation_id, category, colour, fit, size, reason } = body;
  // Normalise undefined → null (matches DB nullable sleeve column).
  const sleeve: StockSleeve = body.sleeve ?? null;
  if (!reservation_id) return err("reservation_id required", 400);
  if (!category || !colour || !fit || !size) {
    return err("category, colour, fit, size all required", 400);
  }

  const admin = createAdminClient();

  // ── Load reservation + child + registration + siblings for stock context ─
  const { data: resRow } = await admin
    .from("back_to_school_pick_reservations")
    .select("*")
    .eq("id", reservation_id)
    .maybeSingle();
  const oldRes = resRow as PickReservation | null;
  if (!oldRes) return err("Reservation not found", 404);
  if (oldRes.child_id !== childId) return err("Reservation does not belong to child", 400);
  if (oldRes.status !== "reserved") return err("Reservation is not active", 409);
  if (oldRes.category !== category) {
    return err("Substitute must be the same category", 400);
  }

  const { data: childRow } = await admin
    .from("registration_children")
    .select("id, registration_id, child_name, packed_at")
    .eq("id", childId)
    .maybeSingle();
  const child = childRow as {
    id: string;
    registration_id: string;
    child_name: string;
    packed_at: string | null;
  } | null;
  if (!child) return err("Child not found", 404);
  if (child.packed_at) return err("Child already packed — cannot substitute", 409);

  const { data: regRow } = await admin
    .from("registrations")
    .select("id, event_id, parent_name, parent_email, qr_token, collection_slot")
    .eq("id", child.registration_id)
    .maybeSingle();
  const reg = regRow as {
    id: string;
    event_id: string;
    parent_name: string;
    parent_email: string;
    qr_token: string | null;
    collection_slot: string | null;
  } | null;
  if (!reg) return err("Registration not found", 500);

  // ── Stock availability for the new SKU ─────────────────────────
  // Reuse the same maths the public register route uses: aggregate
  // active demand against stock + allocations + active reservations,
  // then check effective free stock.
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

  // Reservations index — EXCLUDING the row we're about to release, so
  // its own hold doesn't block a same-cell substitute.
  const { data: resRaw } = await admin
    .from("back_to_school_pick_reservations")
    .select("*")
    .eq("status", "reserved");
  const otherRes = ((resRaw as PickReservation[] | null) ?? []).filter(
    (r) => r.id !== oldRes.id,
  );
  const reservationIndex = indexReservations(otherRes);

  const newKey = skuCellKey({ category, colour, sleeve, fit, size });
  const grp = matrix.find(
    (g) => g.key === [category, colour, sleeve ?? "", fit].join("|"),
  );
  const cell = grp?.cells.get(size);
  const ec = effectiveCell(cell, newKey, allocIndex, reservationIndex);
  if (ec.freeStock < 1) {
    return err(
      `No free stock for ${itemLabel(category, colour, sleeve, size)}.`,
      409,
    );
  }

  // ── Write phase ────────────────────────────────────────────────
  const nowIso = new Date().toISOString();

  // Release the old row
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: relErr } = await (admin as any)
    .from("back_to_school_pick_reservations")
    .update({
      status: "released",
      released_by: teamMemberId,
      released_at: nowIso,
      note: [oldRes.note, `Substituted at pack time${reason ? `: ${reason}` : ""}`]
        .filter(Boolean)
        .join(" | "),
    })
    .eq("id", oldRes.id);
  if (relErr) {
    console.error("[collection-substitute] release err:", relErr);
    return err("Couldn't release the old reservation.", 500);
  }

  // Insert the new one — carry the original_* fields (or seed from the
  // released row if this is the first substitution for that pick).
  const original = {
    original_category: oldRes.original_category ?? oldRes.category,
    original_colour: oldRes.original_colour ?? oldRes.colour,
    original_sleeve: oldRes.original_sleeve ?? oldRes.sleeve,
    original_fit: oldRes.original_fit ?? oldRes.fit,
    original_size: oldRes.original_size ?? oldRes.size,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: newRow, error: insErr } = await (admin as any)
    .from("back_to_school_pick_reservations")
    .insert({
      registration_id: oldRes.registration_id,
      child_id: oldRes.child_id,
      category,
      colour,
      sleeve,
      fit,
      size,
      qty: oldRes.qty,
      status: "reserved",
      reserved_by: teamMemberId,
      reserved_at: nowIso,
      note: `Substitute for ${itemLabel(original.original_category ?? category, original.original_colour ?? colour, original.original_sleeve, original.original_size ?? size)}`,
      ...original,
    })
    .select("id")
    .single();
  if (insErr || !newRow) {
    console.error("[collection-substitute] insert err:", insErr);
    // Best-effort re-reserve of the old row so we don't leave the pick empty
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from("back_to_school_pick_reservations")
      .update({
        status: "reserved",
        released_by: null,
        released_at: null,
      })
      .eq("id", oldRes.id);
    return err("Couldn't create the substitute reservation.", 500);
  }

  // ── Email the parent ───────────────────────────────────────────
  const resend = getResendClient();
  if (resend && reg.parent_email) {
    const base =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://www.evolutionimpactinitiative.co.uk";
    const verifyUrl = reg.qr_token ? `${base}/b2s/verify/${reg.qr_token}` : base;
    const slotHuman = reg.collection_slot ? humanSlot(reg.collection_slot) : null;
    const html = buildSubstitutionEmail({
      parentName: reg.parent_name,
      childName: child.child_name,
      swappedFrom: {
        label: itemLabel(
          original.original_category ?? oldRes.category,
          original.original_colour ?? oldRes.colour,
          original.original_sleeve,
          original.original_size ?? oldRes.size,
        ),
      },
      swappedTo: {
        label: itemLabel(category, colour, sleeve, size),
        reason: reason ?? null,
      },
      slotHuman,
      verifyUrl,
    });
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        replyTo: REPLY_TO_EMAIL,
        to: reg.parent_email,
        subject: `A quick swap for ${child.child_name} — Collection Day`,
        html,
      });
    } catch (e) {
      console.error("[collection-substitute] email err:", e);
    }
  }

  return NextResponse.json({ success: true, reservation_id: (newRow as { id: string }).id });
}

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
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

// Match one of the six known collection slots to a human label. Best-
// effort — falls back to the raw ISO if nothing matches.
function humanSlot(iso: string): string {
  const t = new Date(iso).getTime();
  for (const s of COLLECTION_SLOTS_LOCAL) {
    const [h, m] = s.split(":").map(Number);
    const key = new Date(`${COLLECTION.date}T${s}:00+01:00`).getTime();
    if (key === t) {
      const endM = m + COLLECTION.slotDurationMinutes;
      const endH = h + Math.floor(endM / 60);
      const endMM = endM % 60;
      const fmt = (hh: number, mm: number) =>
        `${hh}:${mm.toString().padStart(2, "0")}`;
      return `${fmt(h, m)} to ${fmt(endH, endMM)}`;
    }
  }
  return iso;
}
const COLLECTION_SLOTS_LOCAL = ["12:00", "12:30", "13:00", "13:30", "14:00", "14:30"];
