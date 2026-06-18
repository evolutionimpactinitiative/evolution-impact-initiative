import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractTicketCode } from "@/lib/festival/check-in";

interface CheckInRequest {
  token?: string;
  code?: string;
}

interface BaseResult {
  ok: boolean;
  error?: string;
}

interface SuccessResult extends BaseResult {
  ok: true;
  status: "checked_in" | "already_checked_in";
  ticket: {
    code: string;
    holder_name: string | null;
    holder_type: "lead" | "adult" | "child";
    checked_in_at: string;
  };
  party_size: number;
  lead_name: string;
}

interface FailureResult extends BaseResult {
  ok: false;
  status: "invalid_token" | "invalid_code" | "not_found" | "server_error";
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckInRequest = await request.json();
    const { token, code } = body;

    if (!token || !code) {
      return NextResponse.json<FailureResult>(
        {
          ok: false,
          status: "invalid_code",
          error: "Missing token or ticket code",
        },
        { status: 400 },
      );
    }

    const ticketCode = extractTicketCode(code);
    if (!ticketCode) {
      return NextResponse.json<FailureResult>(
        {
          ok: false,
          status: "invalid_code",
          error: "Couldn't read a valid ticket code",
        },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    // Validate steward token
    const { data: tokenRow } = await supabase
      .from("festival_steward_tokens")
      .select("id, event_id, revoked_at")
      .eq("token", token)
      .maybeSingle();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const steward = tokenRow as any;
    if (!steward || steward.revoked_at) {
      return NextResponse.json<FailureResult>(
        {
          ok: false,
          status: "invalid_token",
          error: "Steward access not authorised",
        },
        { status: 401 },
      );
    }

    // Load ticket + registration
    const { data: ticketRow } = await supabase
      .from("festival_tickets")
      .select(
        `*,
         registrations!inner (
           parent_name,
           registration_children (id),
           registration_attendees (id)
         )`,
      )
      .eq("ticket_code", ticketCode)
      .eq("event_id", steward.event_id)
      .maybeSingle();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ticket = ticketRow as any;
    if (!ticket) {
      return NextResponse.json<FailureResult>(
        {
          ok: false,
          status: "not_found",
          error: "Ticket not found for this event",
        },
        { status: 404 },
      );
    }

    const leadName = ticket.registrations?.parent_name as string | undefined;
    const partySize =
      1 +
      ((ticket.registrations?.registration_children?.length as number) ?? 0) +
      ((ticket.registrations?.registration_attendees?.length as number) ?? 0);

    // If already checked in, return idempotently
    if (ticket.checked_in_at) {
      return NextResponse.json<SuccessResult>(
        {
          ok: true,
          status: "already_checked_in",
          ticket: {
            code: ticket.ticket_code,
            holder_name: ticket.holder_name,
            holder_type: ticket.holder_type,
            checked_in_at: ticket.checked_in_at,
          },
          party_size: partySize,
          lead_name: leadName ?? "Guest",
        },
        { status: 200 },
      );
    }

    // Mark checked in
    const now = new Date().toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error: updateErr } = await (supabase as any)
      .from("festival_tickets")
      .update({
        checked_in_at: now,
        checked_in_by_token_id: steward.id,
      })
      .eq("id", ticket.id)
      .select("ticket_code, holder_name, holder_type, checked_in_at")
      .single();

    if (updateErr || !updated) {
      console.error("[check-in] update error:", updateErr);
      return NextResponse.json<FailureResult>(
        {
          ok: false,
          status: "server_error",
          error: updateErr?.message ?? "Failed to check in",
        },
        { status: 500 },
      );
    }

    // Touch last_used_at on the steward token (best-effort)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("festival_steward_tokens")
      .update({ last_used_at: now })
      .eq("id", steward.id);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const u = updated as any;
    return NextResponse.json<SuccessResult>(
      {
        ok: true,
        status: "checked_in",
        ticket: {
          code: u.ticket_code,
          holder_name: u.holder_name,
          holder_type: u.holder_type,
          checked_in_at: u.checked_in_at,
        },
        party_size: partySize,
        lead_name: leadName ?? "Guest",
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[check-in] handler error:", err);
    return NextResponse.json<FailureResult>(
      {
        ok: false,
        status: "server_error",
        error: err instanceof Error ? err.message : "Internal error",
      },
      { status: 500 },
    );
  }
}
