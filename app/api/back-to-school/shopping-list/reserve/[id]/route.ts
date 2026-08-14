import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// DELETE /api/back-to-school/shopping-list/reserve/[id]
//
// Public, key-gated. Removes a reservation. Only "reserved" rows can
// be deleted from the public path — received/cancelled are locked so
// a donor can't accidentally undo their own delivery record.
//
// Body: { k, pledgerId }
// We check the reservation belongs to the pledger. Not signed, so a
// pledger who knows another pledger's id could delete theirs, but the
// admin sees all changes.

interface Body {
  k?: string;
  pledgerId?: string;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Body;
    const expectedKey = (process.env.B2S_SHOPPING_LIST_KEY ?? "").trim();

    if (!expectedKey || (body.k ?? "").trim() !== expectedKey) {
      return NextResponse.json({ error: "Invalid link" }, { status: 401 });
    }
    if (!body.pledgerId) {
      return NextResponse.json({ error: "Pledger required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: row } = await admin
      .from("back_to_school_shopping_reservations")
      .select("id, pledger_id, status")
      .eq("id", id)
      .maybeSingle();
    const rsv = row as {
      id: string;
      pledger_id: string;
      status: string;
    } | null;

    if (!rsv) return NextResponse.json({ success: true }); // idempotent
    if (rsv.pledger_id !== body.pledgerId) {
      return NextResponse.json(
        { error: "That reservation isn't yours." },
        { status: 403 },
      );
    }
    if (rsv.status !== "reserved") {
      return NextResponse.json(
        { error: "Already picked up or cancelled — ask the team to reset." },
        { status: 409 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: delErr } = await (admin as any)
      .from("back_to_school_shopping_reservations")
      .delete()
      .eq("id", id);
    if (delErr) {
      console.error("[b2s-shopping-reserve-delete] err:", delErr);
      return NextResponse.json(
        { error: "Couldn't remove reservation." },
        { status: 500 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[b2s-shopping-reserve-delete] handler err:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
