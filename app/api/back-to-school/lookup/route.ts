import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { B2S_SLUG } from "@/lib/back-to-school";
import { generateQrToken } from "@/lib/back-to-school/qr";

// GET /api/back-to-school/lookup?q=<free text>&s=<steward token>
//
// Bounce/no-email recovery: when a family arrives at the door without a
// working QR code, the steward can search by name/email/phone. The API
// returns up to 20 matching registrations. Any row without a qr_token
// gets one generated on the fly (and persisted) so the click-through to
// /b2s/verify/<token>?s=<steward> works exactly like a normal scan.
//
// Only steward-authenticated: same auth path as the distribution route.

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();
    const stewardToken = (searchParams.get("s") ?? "").trim();

    if (stewardToken.length === 0) {
      return NextResponse.json(
        { error: "Steward token required" },
        { status: 401 },
      );
    }
    if (q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const supabase = createAdminClient();

    // Resolve event + verify steward is authorised for it.
    const { data: eventRow } = await supabase
      .from("events")
      .select("id")
      .eq("slug", B2S_SLUG)
      .maybeSingle();
    if (!eventRow) {
      return NextResponse.json({ error: "Drive event not found" }, { status: 404 });
    }
    const eventId = (eventRow as { id: string }).id;

    const { data: tokenRow } = await supabase
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
      return NextResponse.json(
        { error: "Steward not authorised" },
        { status: 403 },
      );
    }

    // Escape ILIKE wildcards so a stray % or _ in a query doesn't blow up.
    const safe = q.replace(/[\\%_]/g, (m) => `\\${m}`);
    const like = `%${safe}%`;

    const { data: rows } = await supabase
      .from("registrations")
      .select(
        "id, parent_name, parent_email, parent_phone, parent_postcode, status, qr_token, distribution_status",
      )
      .eq("event_id", eventId)
      .or(
        `parent_name.ilike.${like},parent_email.ilike.${like},parent_phone.ilike.${like}`,
      )
      .order("parent_name", { ascending: true })
      .limit(20);

    const list =
      (rows as Array<{
        id: string;
        parent_name: string;
        parent_email: string;
        parent_phone: string;
        parent_postcode: string | null;
        status: string;
        qr_token: string | null;
        distribution_status: string | null;
      }> | null) ?? [];

    // Backfill qr_tokens for any rows without one — needed so the steward
    // can click straight through to the verify page.
    const needsTokens = list.filter((r) => !r.qr_token);
    if (needsTokens.length > 0) {
      for (const r of needsTokens) {
        const newToken = generateQrToken();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from("registrations")
          .update({ qr_token: newToken })
          .eq("id", r.id);
        r.qr_token = newToken;
      }
    }

    return NextResponse.json({
      results: list.map((r) => ({
        id: r.id,
        parentName: r.parent_name,
        parentEmail: r.parent_email,
        parentPhone: r.parent_phone,
        parentPostcode: r.parent_postcode,
        status: r.status,
        distributionStatus: r.distribution_status,
        qrToken: r.qr_token,
      })),
    });
  } catch (err) {
    console.error("[b2s-lookup] handler err:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
