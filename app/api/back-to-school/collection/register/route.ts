import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import {
  COLLECTION,
  COLLECTION_SLOTS,
  COLLECTION_SLUG,
  normEmail,
  normPhone,
  slotIso,
  slotLabel,
  type CollectionSlot,
} from "@/lib/back-to-school/collection";
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
} from "@/lib/back-to-school-stock";
import {
  indexReservations,
  type PickReservation,
} from "@/lib/back-to-school/pick-reservations";
import type {
  UniformChoices,
  UniformSize,
  ChildSex,
} from "@/lib/back-to-school";

// POST /api/back-to-school/collection/register
//
// The full booking flow — validates blacklist + slot capacity + real
// stock availability, then in a single write burst creates:
//   • one registrations row (status = approved, collection_slot set)
//   • N registration_children rows
//   • N × M pick_reservations rows to lock the stock
//   • one confirmation email with QR + T&Cs
//
// Idempotency isn't guarded here — the form has a busy flag; if the
// same body arrives twice we'd double-book a slot, but that's the
// browser's job to prevent for now.

interface ChildInput {
  child_name?: string;
  child_age?: number | null;
  sex?: ChildSex | null;
  school?: string | null;
  uniform_size?: UniformSize | null;
  uniform_choices?: UniformChoices | null;
  needs?: string[];
  notes?: string | null;
}

interface Body {
  parent_name?: string;
  parent_email?: string;
  parent_phone?: string;
  parent_postcode?: string;
  slot?: CollectionSlot;
  children?: ChildInput[];
  // Honeypot — public form leaves this empty; bots often fill it.
  website?: string;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Body;

  // Honeypot
  if (body.website && body.website.trim()) {
    return NextResponse.json({ error: "Nope" }, { status: 400 });
  }

  // ── Basic validation ────────────────────────────────────────────
  const name = body.parent_name?.trim();
  const emailNorm = normEmail(body.parent_email);
  const phoneNorm = normPhone(body.parent_phone);
  const postcode = body.parent_postcode?.trim() ?? "";
  const slot = body.slot;
  const kids = (body.children ?? []).filter((c) => (c.child_name ?? "").trim());

  if (!name) return err("Please give your full name.", 400);
  if (!emailNorm) return err("Please give a valid email.", 400);
  if (!phoneNorm) return err("Please give a valid phone number.", 400);
  if (!slot || !COLLECTION_SLOTS.includes(slot)) {
    return err("Please pick a collection slot.", 400);
  }
  if (kids.length < 1) return err("Please add at least one child.", 400);
  if (kids.length > COLLECTION.maxChildrenPerRegistration) {
    return err(
      `Max ${COLLECTION.maxChildrenPerRegistration} children per family.`,
      400,
    );
  }
  for (const c of kids) {
    if (!c.uniform_size) return err("Each child needs a uniform size.", 400);
    if (c.child_age == null || c.child_age < COLLECTION.minChildAge || c.child_age > COLLECTION.maxChildAge) {
      return err(
        `Children must be aged ${COLLECTION.minChildAge}–${COLLECTION.maxChildAge}.`,
        400,
      );
    }
  }

  const admin = createAdminClient();

  // ── Blacklist check (email OR phone match) ─────────────────────
  const { data: blackRows } = await admin
    .from("back_to_school_blacklist")
    .select("id, reason")
    .is("released_at", null)
    .or(`email.eq.${emailNorm},phone.eq.${phoneNorm}`);
  const bl = (blackRows as { id: string; reason: string }[] | null) ?? [];
  if (bl.length > 0) {
    return NextResponse.json(
      {
        error:
          "This email or phone is blocked from our programs. Contact info@evolutionimpactinitiative.co.uk if you think this is a mistake.",
      },
      { status: 403 },
    );
  }

  // ── Event lookup ────────────────────────────────────────────────
  const { data: eventRow } = await admin
    .from("events")
    .select("id")
    .eq("slug", COLLECTION_SLUG)
    .maybeSingle();
  const event = eventRow as { id: string } | null;
  if (!event) return err("Collection event not found. Contact us.", 500);

  // ── Slot capacity ───────────────────────────────────────────────
  const slotAt = slotIso(slot);
  const { count: slotBooked } = await admin
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("event_id", event.id)
    .eq("collection_slot", slotAt)
    .in("status", ["approved", "pending"]);
  if ((slotBooked ?? 0) >= COLLECTION.slotCapacity) {
    return NextResponse.json(
      { error: `Sorry, the ${slotLabel(slot)} slot just filled up. Please pick another.` },
      { status: 409 },
    );
  }

  // ── Stock availability across all requested SKUs ────────────────
  const { data: stockRaw } = await admin
    .from("back_to_school_stock")
    .select("id, category, colour, sleeve, fit, size, quantity, notes, updated_at");
  const stockRows = (stockRaw as StockRow[] | null) ?? [];

  // Pull ALL existing pending/approved regs across BOTH drives so
  // demand + reservations reflect true remaining stock.
  const { data: activeRegs } = await admin
    .from("registrations")
    .select("id")
    .in("status", ["pending", "approved"]);
  const regIds = ((activeRegs as { id: string }[] | null) ?? []).map((r) => r.id);
  const allAsks: ChildAsk[] = [];
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
  const { data: resRaw } = await admin
    .from("back_to_school_pick_reservations")
    .select("*")
    .eq("status", "reserved");
  const reservationIndex = indexReservations(
    (resRaw as PickReservation[] | null) ?? [],
  );

  // Convert this booking's chosen items into a list of SKUs to reserve.
  interface ReservationLine {
    childIdx: number;    // which of the incoming kids
    sku: {
      category: StockCategory;
      colour: StockColour;
      sleeve: StockSleeve;
      fit: StockFit;
      size: string;
    };
  }
  const linesToReserve: ReservationLine[] = [];

  // Ensure each SKU has capacity for the qty this booking wants (a
  // family with 3 kids all wanting size 5 white polo needs stock ≥ 3).
  const wantedByKey = new Map<string, number>();

  for (let i = 0; i < kids.length; i++) {
    const c = kids[i];
    const uc = c.uniform_choices;
    if (!uc) continue;

    const fit = fitFromSexLocal(c.sex);

    const pushIfSelected = (sku: {
      category: StockCategory;
      colour: StockColour;
      sleeve: StockSleeve;
      fit: StockFit;
      size: string;
    }) => {
      linesToReserve.push({ childIdx: i, sku });
      const k = skuCellKey(sku);
      wantedByKey.set(k, (wantedByKey.get(k) ?? 0) + 1);
    };

    if (uc.shirt) {
      pushIfSelected({
        category: "shirt",
        colour: "white",
        sleeve: uc.shirt.sleeve,
        fit,
        size: c.uniform_size!,
      });
    }
    if (uc.polo) {
      pushIfSelected({
        category: "polo",
        colour: uc.polo.colour as StockColour,
        sleeve: uc.polo.sleeve,
        fit,
        size: c.uniform_size!,
      });
    }
    if (uc.bottom) {
      pushIfSelected({
        category: uc.bottom.type as StockCategory,
        colour: uc.bottom.colour as StockColour,
        sleeve: null,
        fit,
        size: c.uniform_size!,
      });
    }
  }

  // Walk every requested SKU and confirm effective free stock covers
  // the qty this booking wants.
  for (const [key, qtyNeeded] of wantedByKey.entries()) {
    const parts = key.split("|");
    const cat = parts[0] as StockCategory;
    const grp = matrix.find((g) => g.key ===
      [parts[0], parts[1], parts[2], parts[3]].join("|"));
    const cell = grp?.cells.get(parts[4]);
    const ec = effectiveCell(cell, key, allocIndex, reservationIndex);
    if (ec.freeStock < qtyNeeded) {
      return NextResponse.json(
        {
          error: `Sorry, we don't have enough of one of your picks (${cat} size ${parts[4]}). Someone may have booked it just before you — please refresh and try again.`,
        },
        { status: 409 },
      );
    }
  }

  // ── Write phase ─────────────────────────────────────────────────
  // Registration row first — auto-approved (no manual review for
  // collection-only bookings), with a QR token for the confirmation
  // email and the day-of scan.
  const qrToken = randomUUID();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: regRow, error: regErr } = await (admin as any)
    .from("registrations")
    .insert({
      event_id: event.id,
      parent_name: name,
      parent_email: emailNorm,
      parent_phone: phoneNorm,
      parent_postcode: postcode || null,
      status: "approved",
      qr_token: qrToken,
      collection_slot: slotAt,
    })
    .select("id")
    .single();
  if (regErr || !regRow) {
    console.error("[collection-register] reg insert err:", regErr);
    return err("Something went wrong saving your booking. Please try again.", 500);
  }
  const registrationId = (regRow as { id: string }).id;

  // Children — capture their asks so labels can render properly.
  const childRows = kids.map((c, i) => ({
    registration_id: registrationId,
    child_name: c.child_name!.trim(),
    child_age: c.child_age ?? null,
    sex: c.sex ?? null,
    school: c.school?.trim() || null,
    uniform_size: c.uniform_size ?? null,
    uniform_choices: c.uniform_choices ?? null,
    needs: c.needs ?? ["uniform"],
    notes: c.notes?.trim() || null,
    display_order: i,
  }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: kidRows, error: kidErr } = await (admin as any)
    .from("registration_children")
    .insert(childRows)
    .select("id, display_order");
  if (kidErr || !kidRows) {
    console.error("[collection-register] children insert err:", kidErr);
    // Best-effort rollback of the parent row
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from("registrations").delete().eq("id", registrationId);
    return err("Couldn't save your children. Please try again.", 500);
  }
  const childIdByIdx = new Map<number, string>();
  for (const kr of kidRows as { id: string; display_order: number }[]) {
    childIdByIdx.set(kr.display_order, kr.id);
  }

  // Reservations — one row per (child × chosen SKU), status=reserved.
  const reservationRows = linesToReserve.map((l) => ({
    registration_id: registrationId,
    child_id: childIdByIdx.get(l.childIdx)!,
    category: l.sku.category,
    colour: l.sku.colour,
    sleeve: l.sku.sleeve,
    fit: l.sku.fit,
    size: l.sku.size,
    qty: 1,
    status: "reserved",
    note: "Collection Day booking",
  }));
  if (reservationRows.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: resErr } = await (admin as any)
      .from("back_to_school_pick_reservations")
      .insert(reservationRows);
    if (resErr) {
      console.error("[collection-register] reservation insert err:", resErr);
      // Non-fatal — the booking is still confirmed; steward can
      // re-reserve on the day if needed. Log and press on.
    }
  }

  // ── Confirmation email ──────────────────────────────────────────
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.evolutionimpactinitiative.co.uk";
  const verifyUrl = `${base}/b2s/verify/${qrToken}`;
  const emailBody = buildConfirmationEmail({
    parentName: name,
    slotIsoStr: slotAt,
    slotHuman: slotLabel(slot),
    childCount: kids.length,
    verifyUrl,
  });

  const resend = getResendClient();
  if (resend && emailNorm) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        replyTo: REPLY_TO_EMAIL,
        to: emailNorm,
        subject: `Your Back to School Collection slot — ${COLLECTION.dateLabel}`,
        html: emailBody,
      });
    } catch (e) {
      console.error("[collection-register] email err:", e);
      // Booking is saved; just fail-safe on email.
    }
  }

  return NextResponse.json({
    success: true,
    registrationId,
    qrToken,
    slot,
  });
}

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// Sex → stock fit. Mirrors lib/back-to-school-stock fitFromSex but
// duplicated here to avoid an extra import round-trip.
function fitFromSexLocal(sex: ChildSex | null | undefined): StockFit {
  if (sex === "male") return "boys";
  if (sex === "female") return "girls";
  return "unisex";
}

function buildConfirmationEmail(input: {
  parentName: string;
  slotIsoStr: string;
  slotHuman: string;
  childCount: number;
  verifyUrl: string;
}): string {
  const rulesUrl = "https://www.evolutionimpactinitiative.co.uk/back-to-school/collection";
  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111;">
    <p style="font-size:12px;text-transform:uppercase;letter-spacing:1.4px;color:#17559D;font-weight:800;margin:0 0 8px 0;">
      Back to School Collection Day · ${COLLECTION.dateLabel}
    </p>
    <h1 style="font-size:26px;font-weight:900;margin:0 0 12px 0;">You&rsquo;re booked in, ${input.parentName}.</h1>
    <p style="font-size:15px;line-height:1.5;margin:0 0 16px 0;">
      We&rsquo;ve reserved the items you picked for your ${input.childCount === 1 ? "child" : `${input.childCount} children`}. Everything will be pre-packed and ready to collect on the day — please just turn up in your slot.
    </p>

    <div style="background:#F0F6FF;border:1px solid #C7DCFF;border-radius:12px;padding:16px;margin:16px 0;">
      <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:1.2px;color:#17559D;font-weight:700;">Your slot</p>
      <p style="margin:6px 0 0 0;font-size:22px;font-weight:800;">${input.slotHuman}</p>
      <p style="margin:4px 0 0 0;font-size:14px;color:#333;">${COLLECTION.dateLabel} · ${COLLECTION.venueName}, ${COLLECTION.venueAddress}</p>
    </div>

    <div style="text-align:center;margin:16px 0;">
      <p style="margin:0 0 8px 0;font-size:12px;text-transform:uppercase;letter-spacing:1.2px;color:#666;font-weight:700;">Show this QR at pickup</p>
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(input.verifyUrl)}" alt="Booking QR" style="width:180px;height:180px;border-radius:8px;" />
    </div>

    <h2 style="font-size:18px;margin:24px 0 8px 0;">Things you need to know</h2>
    <ul style="font-size:14px;line-height:1.55;padding-left:18px;margin:0 0 16px 0;">
      <li><b>Arrive in your slot.</b> If you miss it, come back between ${COLLECTION.graceLabel} and wait until everything else has been handed out.</li>
      <li><b>Miss us twice, and that&rsquo;s it.</b> If you registered for our August drive and didn&rsquo;t collect, this is your second chance. Missing this too means you&rsquo;ll be blocked from every EII program going forward.</li>
      <li><b>Zero tolerance for disrespect.</b> Any rudeness toward our volunteers or other families = asked to leave and blocked from all future events.</li>
      <li><b>One bag per family, packed to your booking.</b> If your plans change, please email us so we can release your items to someone else.</li>
    </ul>

    <p style="font-size:14px;line-height:1.55;margin:16px 0;">
      Full details of the drive: <a href="${rulesUrl}" style="color:#17559D;">${rulesUrl}</a>
    </p>
    <p style="font-size:14px;line-height:1.55;margin:16px 0;">
      Questions? Just reply to this email.
    </p>
    <p style="font-size:13px;color:#666;margin:24px 0 0 0;">
      — The Evolution Impact Initiative team
    </p>
  </div>
  `;
}
