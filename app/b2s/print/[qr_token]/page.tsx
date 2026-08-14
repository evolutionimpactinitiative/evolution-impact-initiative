import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/admin";
import { B2S_SLUG } from "@/lib/back-to-school";
import {
  PickTicket,
  type PickTicketFamily,
} from "@/components/admin/back-to-school/PickTicket";
import { PickTicketAutoPrint } from "@/components/back-to-school/PickTicketAutoPrint";
import {
  PICK_TICKET_PRINT_STYLES,
  pickTicketPrintMediaRules,
} from "@/lib/back-to-school/pick-ticket-styles";

const PRINT_STYLES =
  PICK_TICKET_PRINT_STYLES + pickTicketPrintMediaRules("single-print-area");

interface Props {
  params: Promise<{ qr_token: string }>;
  searchParams: Promise<{ s?: string }>;
}

export const dynamic = "force-dynamic";

// Station 2 "scan and print" page. Steward scans a family's QR (either
// from the approval email or the walk-in ticket), lands here, and the
// print dialog auto-opens for a single ticket. After they print they hit
// "Next family" to return to the scanner.
export default async function B2SPrintPage({ params, searchParams }: Props) {
  const { qr_token } = await params;
  const { s: stewardToken } = await searchParams;

  const supabase = createAdminClient();

  const { data: eventRow } = await supabase
    .from("events")
    .select("id")
    .eq("slug", B2S_SLUG)
    .maybeSingle();
  const eventId = eventRow ? (eventRow as { id: string }).id : null;

  // Steward auth — required for print (we don't want a family who has the
  // QR URL to print their own ticket).
  if (!stewardToken || !eventId) {
    return <ErrorState message="Steward token required." />;
  }
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
    return <ErrorState message="Steward not authorised." />;
  }

  const { data: reg } = await supabase
    .from("registrations")
    .select(
      `id, parent_name, parent_email, parent_phone, parent_postcode,
       status, qr_token,
       registration_children (
         id, child_name, child_age, uniform_size, sex, school, needs,
         uniform_choices, notes, display_order
       )`,
    )
    .eq("qr_token", qr_token)
    .maybeSingle();

  const family = reg as PickTicketFamily | null;
  if (!family) {
    return <ErrorState message="QR not recognised — no family found." />;
  }

  const BASE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || "https://evolutionimpactinitiative.co.uk";
  const qrDataUrl = await QRCode.toDataURL(
    `${BASE_URL}/b2s/verify/${family.qr_token}`,
    {
      width: 200,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#111111", light: "#FFFFFF" },
    },
  );

  const scannerHref = `/b2s/scan/${encodeURIComponent(stewardToken)}?mode=checkin`;

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6 md:py-10">
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      <div className="max-w-2xl mx-auto space-y-4">
        <PickTicketAutoPrint
          scannerHref={scannerHref}
          familyLabel={family.parent_name}
        />

        <div id="single-print-area">
          <PickTicket family={family} qrDataUrl={qrDataUrl} />
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center border border-red-200">
        <AlertTriangle className="h-10 w-10 text-red-600 mx-auto mb-4" />
        <h1 className="font-heading font-black text-2xl text-brand-dark mb-2">
          Can&rsquo;t print
        </h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-heading font-bold uppercase tracking-widest text-brand-blue hover:text-brand-dark"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Home
        </Link>
      </div>
    </div>
  );
}
