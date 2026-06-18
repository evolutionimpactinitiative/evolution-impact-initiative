import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { FESTIVAL_SLUG } from "@/lib/festival";
import type {
  FestivalTicket,
  FestivalTicketInsert,
} from "@/lib/supabase/types";

// createAdminClient() returns an untyped Supabase client, matching the rest
// of the codebase. We keep our own narrow types where it matters.
type AdminClient = ReturnType<typeof createAdminClient>;

// URL-safe alphabet without confusing characters (no 0/O, no 1/I/L)
const TICKET_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const TICKET_LENGTH = 10;

export function generateTicketCode(): string {
  const bytes = randomBytes(TICKET_LENGTH);
  let code = "";
  for (let i = 0; i < TICKET_LENGTH; i += 1) {
    code += TICKET_ALPHABET[bytes[i] % TICKET_ALPHABET.length];
  }
  return code;
}

export function ticketUrl(code: string, baseUrl?: string): string {
  const base =
    baseUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://www.evolutionimpactinitiative.co.uk");
  return `${base.replace(/\/$/, "")}/ticket/${code}`;
}

interface RegistrationForTickets {
  id: string;
  event_id: string;
  parent_name: string;
  registration_children: { child_name: string; display_order: number }[];
  registration_attendees: { attendee_name: string; display_order: number }[];
}

/**
 * Idempotently create one festival_tickets row per attendee
 * (lead booker + each child + each additional adult).
 * Skips creation if tickets already exist for this registration.
 * Returns the full list of tickets (existing + newly created).
 */
export async function createTicketsForRegistration(
  registration: RegistrationForTickets,
  options: { client?: AdminClient } = {},
): Promise<FestivalTicket[]> {
  const supabase = options.client ?? createAdminClient();

  // Check for existing tickets first (idempotency)
  const { data: existing } = await supabase
    .from("festival_tickets")
    .select("*")
    .eq("registration_id", registration.id)
    .order("display_order", { ascending: true });

  if (existing && existing.length > 0) {
    return existing as FestivalTicket[];
  }

  // Build the ordered list of holders
  const holders: Array<{ name: string; type: "lead" | "adult" | "child" }> = [
    { name: registration.parent_name, type: "lead" },
  ];

  for (const attendee of registration.registration_attendees ?? []) {
    holders.push({ name: attendee.attendee_name, type: "adult" });
  }
  for (const child of registration.registration_children ?? []) {
    holders.push({ name: child.child_name, type: "child" });
  }

  // Generate codes with retry on collision (very unlikely with 10 chars × 31 alphabet)
  const inserts: FestivalTicketInsert[] = [];
  for (let idx = 0; idx < holders.length; idx += 1) {
    const holder = holders[idx];
    inserts.push({
      registration_id: registration.id,
      event_id: registration.event_id,
      ticket_code: generateTicketCode(),
      holder_name: holder.name,
      holder_type: holder.type,
      display_order: idx,
    });
  }

  const { data: inserted, error } = await supabase
    .from("festival_tickets")
    .insert(inserts)
    .select();

  if (error) {
    // If unique-violation on ticket_code, regenerate and retry once
    if (error.code === "23505") {
      const retried = inserts.map((row) => ({
        ...row,
        ticket_code: generateTicketCode(),
      }));
      const { data: retryInserted, error: retryError } = await supabase
        .from("festival_tickets")
        .insert(retried)
        .select();
      if (retryError) throw retryError;
      return (retryInserted ?? []) as FestivalTicket[];
    }
    throw error;
  }

  return (inserted ?? []) as FestivalTicket[];
}

/**
 * True if a given event slug is the Evolution Fest 2026 festival event.
 */
export function isFestivalEvent(event: { slug: string } | null | undefined): boolean {
  return event?.slug === FESTIVAL_SLUG;
}
