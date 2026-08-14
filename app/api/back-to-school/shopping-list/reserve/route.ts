import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/back-to-school/shopping-list/reserve
//
// Public, key-gated. Creates a reservation row for a known pledger.
// Called when a donor taps "I'll get one" against a specific SKU+size.
//
// We validate the pledger exists but don't try to verify a session token
// (the pledger id is the token — leaking it lets a snoop create
// reservations under someone else's name but nothing worse; and the
// admin can cancel obvious spam). Belt-and-braces would be a signed
// pledger cookie; not worth the complexity for a one-day drive.

const VALID_CATEGORIES = [
  "polo",
  "shirt",
  "trousers",
  "skirt",
  "dress",
  "shorts",
] as const;
const VALID_COLOURS = ["white", "blue", "grey", "black"] as const;
const VALID_SLEEVES = ["short", "long"] as const;
const VALID_FITS = ["boys", "girls", "unisex"] as const;

interface Body {
  k?: string;
  pledgerId?: string;
  category?: string;
  colour?: string;
  sleeve?: string | null;
  fit?: string;
  size?: string;
  qty?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Body;
    const expectedKey = (process.env.B2S_SHOPPING_LIST_KEY ?? "").trim();

    if (!expectedKey || (body.k ?? "").trim() !== expectedKey) {
      return NextResponse.json({ error: "Invalid link" }, { status: 401 });
    }

    if (!body.pledgerId) {
      return NextResponse.json(
        { error: "Missing pledger — refresh the page and enter your details again." },
        { status: 400 },
      );
    }
    if (
      !body.category ||
      !VALID_CATEGORIES.includes(body.category as never)
    ) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    if (!body.colour || !VALID_COLOURS.includes(body.colour as never)) {
      return NextResponse.json({ error: "Invalid colour" }, { status: 400 });
    }
    if (!body.fit || !VALID_FITS.includes(body.fit as never)) {
      return NextResponse.json({ error: "Invalid fit" }, { status: 400 });
    }
    if (!body.size) {
      return NextResponse.json({ error: "Invalid size" }, { status: 400 });
    }
    let sleeve: string | null = null;
    if (body.category === "polo" || body.category === "shirt") {
      if (!body.sleeve || !VALID_SLEEVES.includes(body.sleeve as never)) {
        return NextResponse.json(
          { error: "Sleeve required for polo/shirt" },
          { status: 400 },
        );
      }
      sleeve = body.sleeve;
    }
    const qty = typeof body.qty === "number" && body.qty > 0 ? Math.floor(body.qty) : 1;
    if (qty > 20) {
      return NextResponse.json(
        { error: "Max 20 per reservation — split into multiple pledges if you're buying a batch." },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    // Confirm pledger exists
    const { data: pledger } = await admin
      .from("back_to_school_shopping_pledgers")
      .select("id")
      .eq("id", body.pledgerId)
      .maybeSingle();
    if (!pledger) {
      return NextResponse.json(
        { error: "Pledger not found. Refresh and enter your details again." },
        { status: 404 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: created, error: createErr } = await (admin as any)
      .from("back_to_school_shopping_reservations")
      .insert({
        pledger_id: body.pledgerId,
        category: body.category,
        colour: body.colour,
        sleeve,
        fit: body.fit,
        size: body.size,
        qty,
        status: "reserved",
      })
      .select("id")
      .single();
    if (createErr || !created) {
      console.error("[b2s-shopping-reserve] insert err:", createErr);
      return NextResponse.json(
        { error: "Couldn't save reservation." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      id: (created as { id: string }).id,
      qty,
    });
  } catch (err) {
    console.error("[b2s-shopping-reserve] handler err:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
