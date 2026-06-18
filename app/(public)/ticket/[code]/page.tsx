import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, MapPin, Clock, CheckCircle2, Sparkles } from "lucide-react";
import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/admin";
import { FESTIVAL } from "@/lib/festival";
import { ticketUrl } from "@/lib/festival/tickets";
import type { Event, FestivalTicket } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: `Your ticket · ${FESTIVAL.title}`,
  description: `Your ticket for ${FESTIVAL.title} — ${FESTIVAL.dateLabel}, ${FESTIVAL.venueName}.`,
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ code: string }>;
}

const HOLDER_LABELS: Record<FestivalTicket["holder_type"], string> = {
  lead: "Lead booker",
  adult: "Adult",
  child: "Child",
};

const HOLDER_COLORS: Record<FestivalTicket["holder_type"], string> = {
  lead: "bg-white text-brand-dark",
  adult: "bg-brand-green text-white",
  child: "bg-brand-blue text-white",
};

export default async function TicketPage({ params }: PageProps) {
  const { code } = await params;
  const cleanCode = code.toUpperCase().trim();

  const supabase = createAdminClient();
  const { data: ticketRow } = await supabase
    .from("festival_tickets")
    .select("*")
    .eq("ticket_code", cleanCode)
    .maybeSingle();

  const ticket = ticketRow as FestivalTicket | null;
  if (!ticket) return notFound();

  const { data: eventRow } = await supabase
    .from("events")
    .select("*")
    .eq("id", ticket.event_id)
    .maybeSingle();

  const event = eventRow as Event | null;
  const eventTitle = event?.title ?? FESTIVAL.title;
  const eventDateLabel = event
    ? new Date(event.date).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : FESTIVAL.dateLabel;
  const eventTimeLabel = FESTIVAL.timeLabel;
  const eventVenue = event?.venue_name ?? FESTIVAL.venueName;

  const qrSrc = await QRCode.toDataURL(ticketUrl(ticket.ticket_code), {
    width: 480,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#1E1E1E", light: "#FFFFFF" },
  });

  const isCheckedIn = ticket.checked_in_at !== null;
  const checkedInLabel = ticket.checked_in_at
    ? new Date(ticket.checked_in_at).toLocaleString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        day: "numeric",
        month: "short",
      })
    : null;

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <div className="max-w-md mx-auto px-4 pt-28 pb-16">
        {/* Eyebrow */}
        <div className="text-center mb-6">
          <p className="font-heading text-xs uppercase tracking-widest text-brand-accent mb-2">
            {FESTIVAL.title}
          </p>
          <p className="text-xs text-white/50">{FESTIVAL.tagline}</p>
        </div>

        {/* Holder badge */}
        <div className="text-center mb-3">
          <span
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-heading font-bold uppercase tracking-widest ${HOLDER_COLORS[ticket.holder_type]}`}
          >
            {HOLDER_LABELS[ticket.holder_type]}
          </span>
        </div>

        {/* Name */}
        <h1 className="font-heading font-black text-3xl text-center text-white mb-1 leading-tight">
          {ticket.holder_name || "Guest ticket"}
        </h1>
        <p className="text-center text-white/50 text-sm mb-8 font-heading tracking-widest">
          #{ticket.ticket_code}
        </p>

        {/* QR card */}
        <div className="bg-white rounded-2xl p-6 mb-6 relative">
          {isCheckedIn && (
            <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 bg-brand-green text-white px-2.5 py-1 rounded-full text-[10px] font-heading font-bold uppercase tracking-widest">
              <CheckCircle2 className="h-3 w-3" />
              Checked in
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrSrc}
            alt="Ticket QR code"
            className="w-full h-auto block"
          />
        </div>

        {/* Instruction */}
        <div className="text-center mb-8">
          {isCheckedIn ? (
            <p className="text-sm text-white/60 leading-relaxed">
              Welcomed in at{" "}
              <span className="text-brand-accent font-semibold">
                {checkedInLabel}
              </span>
              . Enjoy the day!
            </p>
          ) : (
            <p className="text-sm text-white/80 leading-relaxed">
              Show this QR to a steward at the door.
              <br />
              <span className="text-white/50">Brightness up. Fast check-in.</span>
            </p>
          )}
        </div>

        {/* Event details */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
          <p className="font-heading text-[10px] uppercase tracking-widest text-brand-accent mb-3">
            Event details
          </p>
          <p className="font-heading font-bold text-white text-lg mb-3">
            {eventTitle}
          </p>
          <ul className="space-y-2 text-sm text-white/75">
            <li className="flex items-start gap-2.5">
              <Calendar className="h-4 w-4 text-brand-accent shrink-0 mt-0.5" />
              <span>{eventDateLabel}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Clock className="h-4 w-4 text-brand-accent shrink-0 mt-0.5" />
              <span>{eventTimeLabel}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-brand-accent shrink-0 mt-0.5" />
              <span>
                {eventVenue}, {FESTIVAL.venueArea}
              </span>
            </li>
          </ul>
        </div>

        {/* Transferability note */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-8">
          <p className="font-heading text-[10px] uppercase tracking-widest text-brand-accent mb-2">
            Sharing this ticket
          </p>
          <p className="text-sm text-white/70 leading-relaxed">
            Tickets are transferable. If your plans change, just share this
            link with whoever is coming instead.
          </p>
        </div>

        {/* Festival link */}
        <Link
          href={`/${FESTIVAL.slug}`}
          className="flex items-center justify-center gap-2 bg-brand-accent text-brand-dark font-heading font-bold text-sm uppercase tracking-wider px-5 py-3 rounded-md hover:bg-brand-green hover:text-white transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          About the festival
        </Link>
      </div>
    </div>
  );
}
