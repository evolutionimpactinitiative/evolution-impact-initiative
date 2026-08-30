import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import { COLLECTION } from "@/lib/back-to-school/collection";
import { buildPackedEmail } from "@/lib/back-to-school/collection-emails";
import {
  CATEGORY_LABELS,
  COLOUR_LABELS,
  SLEEVE_LABELS,
  type StockCategory,
  type StockColour,
  type StockSleeve,
} from "@/lib/back-to-school-stock";
import type { PickReservation } from "@/lib/back-to-school/pick-reservations";

// POST /api/back-to-school/collection/pack/[childId]
//
// Marks a child's bag as packed. Consumes every active reservation
// for the child, decrements stock accordingly, and emails the parent.
// Idempotent: re-hitting on an already-packed child returns success
// without doing anything (the button on the pack page is disabled but
// belt-and-braces).

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> },
) {
  const { childId } = await params;

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

  const admin = createAdminClient();

  // ── Load child + reg + reservations ─────────────────────────────
  const { data: childRow } = await admin
    .from("registration_children")
    .select("id, registration_id, child_name, packed_at, needs")
    .eq("id", childId)
    .maybeSingle();
  const child = childRow as {
    id: string;
    registration_id: string;
    child_name: string;
    packed_at: string | null;
    needs: string[] | null;
  } | null;
  if (!child) return err("Child not found", 404);
  if (child.packed_at) {
    return NextResponse.json({ success: true, alreadyPacked: true });
  }

  const { data: regRow } = await admin
    .from("registrations")
    .select("id, parent_name, parent_email, qr_token, collection_slot")
    .eq("id", child.registration_id)
    .maybeSingle();
  const reg = regRow as {
    id: string;
    parent_name: string;
    parent_email: string;
    qr_token: string | null;
    collection_slot: string | null;
  } | null;
  if (!reg) return err("Registration not found", 500);

  const { data: resRaw } = await admin
    .from("back_to_school_pick_reservations")
    .select("*")
    .eq("child_id", childId)
    .eq("status", "reserved");
  const reservations = (resRaw as PickReservation[] | null) ?? [];

  const nowIso = new Date().toISOString();

  // ── Decrement stock per reservation ─────────────────────────────
  // We do this before flipping status so a failure leaves the
  // reservation reserved (recoverable). Best-effort: if a matching
  // stock row is missing, we log and continue — the bag is real, the
  // stock just wasn't tracked. This is rare and shouldn't block the
  // pack action.
  for (const r of reservations) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q = admin
      .from("back_to_school_stock")
      .select("id, quantity")
      .eq("category", r.category)
      .eq("colour", r.colour)
      .eq("fit", r.fit)
      .eq("size", r.size)
      .limit(1);
    // Sleeve is nullable — handle both cases so the query stays exact.
    const { data: stockMatch } = r.sleeve
      ? await q.eq("sleeve", r.sleeve)
      : await q.is("sleeve", null);
    const match = (stockMatch as { id: string; quantity: number }[] | null) ?? [];
    if (match.length === 0) {
      console.warn("[collection-pack] no stock row for reservation", r.id, {
        category: r.category,
        colour: r.colour,
        sleeve: r.sleeve,
        fit: r.fit,
        size: r.size,
      });
      continue;
    }
    const row = match[0];
    const newQty = Math.max(0, row.quantity - r.qty);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updErr } = await (admin as any)
      .from("back_to_school_stock")
      .update({ quantity: newQty, updated_at: nowIso })
      .eq("id", row.id);
    if (updErr) {
      console.error("[collection-pack] stock decrement err:", updErr);
      return err("Couldn't update stock. Please try again.", 500);
    }
  }

  // ── Flip reservations → consumed ────────────────────────────────
  if (reservations.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: consErr } = await (admin as any)
      .from("back_to_school_pick_reservations")
      .update({
        status: "consumed",
        consumed_by: teamMemberId,
        consumed_at: nowIso,
      })
      .in(
        "id",
        reservations.map((r) => r.id),
      );
    if (consErr) {
      console.error("[collection-pack] consume err:", consErr);
      return err("Couldn't mark reservations consumed.", 500);
    }
  }

  // ── Stamp packed_at / packed_by ─────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: packErr } = await (admin as any)
    .from("registration_children")
    .update({ packed_at: nowIso, packed_by: teamMemberId })
    .eq("id", childId);
  if (packErr) {
    console.error("[collection-pack] pack stamp err:", packErr);
    return err("Couldn't mark the child as packed.", 500);
  }

  // ── Email the parent ────────────────────────────────────────────
  const items = reservations.map((r) => itemLabel(r.category, r.colour, r.sleeve, r.size));
  const needs = child.needs ?? [];
  if (needs.includes("stationery")) items.push("Stationery pack");
  if (needs.includes("bag")) items.push("School bag");

  const resend = getResendClient();
  if (resend && reg.parent_email) {
    const base =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://www.evolutionimpactinitiative.co.uk";
    const verifyUrl = reg.qr_token ? `${base}/b2s/verify/${reg.qr_token}` : base;
    const slotHuman = reg.collection_slot ? humanSlot(reg.collection_slot) : null;
    const html = buildPackedEmail({
      parentName: reg.parent_name,
      childName: child.child_name,
      items,
      slotHuman,
      verifyUrl,
    });
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        replyTo: REPLY_TO_EMAIL,
        to: reg.parent_email,
        subject: `${child.child_name}'s bag is packed — Collection Day ${COLLECTION.dateLabel}`,
        html,
      });
    } catch (e) {
      console.error("[collection-pack] email err:", e);
    }
  }

  return NextResponse.json({ success: true, packed_at: nowIso });
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

function humanSlot(iso: string): string {
  const t = new Date(iso).getTime();
  for (const s of ["12:00", "12:30", "13:00", "13:30", "14:00", "14:30"]) {
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
