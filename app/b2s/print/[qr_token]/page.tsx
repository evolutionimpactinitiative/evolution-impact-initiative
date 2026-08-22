import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/admin";
import { B2S_SLUG } from "@/lib/back-to-school";
import {
  PickLabel,
  type PickLabelChild,
  type PickLabelItem,
} from "@/components/admin/back-to-school/PickLabel";
import { PickTicketAutoPrint } from "@/components/back-to-school/PickTicketAutoPrint";
import {
  PICK_LABEL_PRINT_STYLES,
  pickLabelPrintMediaRules,
} from "@/lib/back-to-school/pick-label-styles";
import type { PickReservation } from "@/lib/back-to-school/pick-reservations";
import { isSubstitute } from "@/lib/back-to-school/pick-reservations";
import {
  COLOUR_LABELS,
  SLEEVE_LABELS,
  type StockCategory,
} from "@/lib/back-to-school-stock";

const PRINT_STYLES =
  PICK_LABEL_PRINT_STYLES + pickLabelPrintMediaRules("single-print-area");

// Station 2 walk-in flow needs the full child pick-list data since
// each label now carries the items to grab for that specific child.
type LabelPrintFamily = {
  id: string;
  parent_name: string;
  status: string;
  qr_token: string | null;
  registration_children: Array<PickLabelChild & { display_order: number }>;
};

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
      `id, parent_name, status, qr_token,
       registration_children (
         id, child_name, child_age, uniform_size, sex, school, needs,
         uniform_choices, notes, display_order
       )`,
    )
    .eq("qr_token", qr_token)
    .maybeSingle();

  const family = reg as LabelPrintFamily | null;
  if (!family) {
    return <ErrorState message="QR not recognised — no family found." />;
  }

  const BASE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || "https://evolutionimpactinitiative.co.uk";
  const qrDataUrl = await QRCode.toDataURL(
    `${BASE_URL}/b2s/verify/${family.qr_token}`,
    {
      width: 500,           // bigger — label QR renders at 60mm
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#111111", light: "#FFFFFF" },
    },
  );

  const scannerHref = `/b2s/scan/${encodeURIComponent(stewardToken)}?mode=checkin`;
  const kids = [...(family.registration_children ?? [])].sort(
    (a, b) => a.display_order - b.display_order,
  );

  // If the prep step created pick reservations for this family, use
  // them to build the per-child pick list — labels then reflect any
  // substitutions the steward accepted.
  const { data: resRaw } = await supabase
    .from("back_to_school_pick_reservations")
    .select("*")
    .eq("registration_id", family.id)
    .eq("status", "reserved");
  const reservations = (resRaw as PickReservation[] | null) ?? [];
  const resByChild = new Map<string, PickReservation[]>();
  for (const r of reservations) {
    const arr = resByChild.get(r.child_id) ?? [];
    arr.push(r);
    resByChild.set(r.child_id, arr);
  }

  function itemLabelForCategory(
    category: StockCategory,
    colour: string,
    sleeve: string | null,
    size: string,
  ): string {
    const c = COLOUR_LABELS[colour as keyof typeof COLOUR_LABELS] ?? colour;
    if (category === "polo") {
      return `${c} polo (${sleeve ? SLEEVE_LABELS[sleeve as keyof typeof SLEEVE_LABELS] : "?"} sleeve) · size ${size}`;
    }
    if (category === "shirt") {
      return `${c} shirt (${sleeve ? SLEEVE_LABELS[sleeve as keyof typeof SLEEVE_LABELS] : "?"} sleeve) · size ${size}`;
    }
    return `${c} ${category} · size ${size}`;
  }

  function overrideFor(childId: string, child: PickLabelChild): PickLabelItem[] | undefined {
    const rs = resByChild.get(childId);
    if (!rs || rs.length === 0) return undefined;
    // Uniform items from reservations…
    const items: PickLabelItem[] = rs.map((r) => ({
      label: itemLabelForCategory(r.category, r.colour, r.sleeve, r.size),
      substitutingFor: isSubstitute(r)
        ? `size ${r.original_size}`
        : undefined,
      needsSubstitutionBlank: false, // steward already decided; no free-form blank needed
    }));
    // Stationery / bag aren't tracked via reservations, still driven by needs
    const needs = child.needs ?? [];
    if (needs.includes("stationery")) {
      items.push({ label: "Stationery pack" });
    }
    if (needs.includes("bag")) {
      items.push({ label: "School bag" });
    }
    return items;
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6 md:py-10">
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      <div className="max-w-2xl mx-auto space-y-4">
        <PickTicketAutoPrint
          scannerHref={scannerHref}
          familyLabel={`${family.parent_name} · ${kids.length} label${kids.length === 1 ? "" : "s"}`}
        />

        {/* One 4×6" label per child */}
        <div id="single-print-area">
          {kids.map((c) => (
            <PickLabel
              key={c.id}
              child={c}
              family={{
                id: family.id,
                parent_name: family.parent_name,
                status: family.status,
                qr_token: family.qr_token,
              }}
              qrDataUrl={qrDataUrl}
              overrideItems={overrideFor(c.id, c)}
            />
          ))}
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
