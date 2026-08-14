import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/back-to-school/shopping-list/session
//
// Public, key-gated. Called from the shopping-list intake form to
// create (or update, if the caller has an existing pledger id) the
// donor session. Returns { pledgerId } which the browser stashes in
// localStorage so subsequent reserve calls reference the right row.

interface Body {
  k?: string;                          // shopping list key
  pledgerId?: string | null;           // existing pledger id if editing
  name?: string;
  email?: string | null;
  phone?: string | null;
  deliveryMethod?: "collection" | "drop_off";
  collectionDate?: string | null;      // ISO yyyy-mm-dd
  collectionTime?: string | null;
  collectionAddress?: string | null;
  collectionPostcode?: string | null;
  notes?: string | null;
}

function isNonEmpty(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Body;
    const expectedKey = (process.env.B2S_SHOPPING_LIST_KEY ?? "").trim();

    if (!expectedKey || (body.k ?? "").trim() !== expectedKey) {
      return NextResponse.json({ error: "Invalid link" }, { status: 401 });
    }

    if (!isNonEmpty(body.name)) {
      return NextResponse.json(
        { error: "Please enter your name." },
        { status: 400 },
      );
    }

    const method: "collection" | "drop_off" =
      body.deliveryMethod === "drop_off" ? "drop_off" : "collection";

    const payload: Record<string, unknown> = {
      name: body.name.trim(),
      email: isNonEmpty(body.email) ? body.email.trim().toLowerCase() : null,
      phone: isNonEmpty(body.phone) ? body.phone.trim() : null,
      delivery_method: method,
      collection_date: isNonEmpty(body.collectionDate)
        ? body.collectionDate
        : null,
      collection_time: isNonEmpty(body.collectionTime)
        ? body.collectionTime.trim()
        : null,
      collection_address:
        method === "collection" && isNonEmpty(body.collectionAddress)
          ? body.collectionAddress.trim()
          : null,
      collection_postcode:
        method === "collection" && isNonEmpty(body.collectionPostcode)
          ? body.collectionPostcode.trim().toUpperCase()
          : null,
      notes: isNonEmpty(body.notes) ? body.notes.trim() : null,
    };

    const admin = createAdminClient();

    if (isNonEmpty(body.pledgerId)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateErr } = await (admin as any)
        .from("back_to_school_shopping_pledgers")
        .update(payload)
        .eq("id", body.pledgerId);
      if (updateErr) {
        console.error("[b2s-shopping-session] update err:", updateErr);
        return NextResponse.json(
          { error: "Couldn't save your details." },
          { status: 500 },
        );
      }
      return NextResponse.json({ pledgerId: body.pledgerId });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: created, error: createErr } = await (admin as any)
      .from("back_to_school_shopping_pledgers")
      .insert(payload)
      .select("id")
      .single();

    if (createErr || !created) {
      console.error("[b2s-shopping-session] insert err:", createErr);
      return NextResponse.json(
        { error: "Couldn't save your details." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      pledgerId: (created as { id: string }).id,
    });
  } catch (err) {
    console.error("[b2s-shopping-session] handler err:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
