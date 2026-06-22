import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { FESTIVAL } from "@/lib/festival";
import { slotsForRegistration } from "@/lib/events";

export type FestivalRelease = {
  finalRelease: boolean;
  ticketsRemaining: number;
  totalTickets: number;
};

// Cached for the lifetime of a single request, so layout + page + section
// components don't each hit the DB. React.cache() handles the dedupe.
export const getFestivalRelease = cache(
  async (): Promise<FestivalRelease> => {
    const supabase = createAdminClient();

    const { data: eventRow } = await supabase
      .from("events")
      .select("id, total_slots, event_type, final_release")
      .eq("slug", FESTIVAL.slug)
      .maybeSingle();

    if (!eventRow) {
      return {
        finalRelease: false,
        ticketsRemaining: FESTIVAL.totalTickets,
        totalTickets: FESTIVAL.totalTickets,
      };
    }

    const totalTickets = eventRow.total_slots ?? FESTIVAL.totalTickets;

    const { data: regs } = await supabase
      .from("registrations")
      .select("id, registration_children (id), registration_attendees (id)")
      .eq("event_id", eventRow.id)
      .eq("status", "confirmed");

    type RegRow = {
      id: string;
      registration_children: { id: string }[] | null;
      registration_attendees: { id: string }[] | null;
    };

    const taken = ((regs as RegRow[] | null) || []).reduce(
      (sum, r) => sum + slotsForRegistration(r, eventRow.event_type),
      0,
    );

    return {
      finalRelease: eventRow.final_release ?? false,
      ticketsRemaining: Math.max(0, totalTickets - taken),
      totalTickets,
    };
  },
);
