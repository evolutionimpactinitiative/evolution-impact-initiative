import Link from "next/link";
import { ArrowLeft, Printer, AlertTriangle } from "lucide-react";
import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/admin";
import { B2S, B2S_SLUG } from "@/lib/back-to-school";
import {
  PickTicket,
  type PickTicketFamily,
} from "@/components/admin/back-to-school/PickTicket";
import { PrintButton } from "@/components/admin/back-to-school/PrintButton";

// The print stylesheet needs to be inline server-injected so it applies
// regardless of Tailwind's build step. Keeps this page self-contained.
const PRINT_STYLES = `
  .pick-ticket {
    box-sizing: border-box;
    width: 148mm;
    min-height: 210mm;
    padding: 8mm 10mm;
    margin: 0 auto 8mm auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #111;
    background: white;
    border: 1px solid #ddd;
    page-break-after: always;
    display: flex;
    flex-direction: column;
    gap: 4mm;
  }
  .pt-header {
    display: flex;
    gap: 4mm;
    align-items: flex-start;
    border-bottom: 1px solid #333;
    padding-bottom: 3mm;
  }
  .pt-title-block { flex: 1; min-width: 0; }
  .pt-eyebrow {
    font-size: 8pt; text-transform: uppercase; letter-spacing: 1px;
    color: #17559D; font-weight: 700; margin: 0 0 2px 0;
  }
  .pt-family-name {
    font-size: 20pt; font-weight: 900; line-height: 1.1; margin: 0 0 2mm 0;
    word-break: break-word;
  }
  .pt-meta { font-size: 9pt; color: #444; margin: 0; }
  .pt-qr-block { text-align: center; width: 32mm; flex-shrink: 0; }
  .pt-qr { width: 30mm; height: 30mm; display: block; }
  .pt-qr-placeholder {
    width: 30mm; height: 30mm; border: 1px dashed #999;
    display: flex; align-items: center; justify-content: center;
    font-size: 7pt; color: #999;
  }
  .pt-ref {
    font-family: 'Courier New', monospace; font-size: 9pt; font-weight: 700;
    margin: 1mm 0 0 0; letter-spacing: 0.5px;
  }
  .pt-status {
    font-size: 8pt; font-weight: 700; text-transform: uppercase;
    letter-spacing: 1px; margin: 1mm 0 0 0;
  }
  .pt-kids { display: flex; flex-direction: column; gap: 4mm; flex: 1; }
  .pt-child {
    border: 1px solid #ccc; border-radius: 3mm; padding: 3mm;
    page-break-inside: avoid;
  }
  .pt-child-head {
    display: flex; flex-wrap: wrap; gap: 2mm; align-items: baseline;
    margin-bottom: 2mm;
  }
  .pt-child-num {
    font-size: 7pt; text-transform: uppercase; letter-spacing: 1px;
    background: #17559D; color: white; padding: 1mm 2mm; border-radius: 2mm;
    font-weight: 700;
  }
  .pt-child-name { font-size: 12pt; font-weight: 800; }
  .pt-child-meta { font-size: 8pt; color: #666; }
  .pt-child-size {
    font-size: 10pt; margin-left: auto; padding: 1mm 2mm;
    background: #DCECFF; border-radius: 2mm;
  }
  .pt-child-size strong { font-size: 14pt; }
  .pt-school { font-size: 8pt; color: #444; margin: 0 0 2mm 0; font-style: italic; }
  .pt-items { list-style: none; padding: 0; margin: 0; }
  .pt-item {
    display: flex; align-items: baseline; gap: 2mm;
    font-size: 10pt; padding: 1.5mm 0; border-bottom: 1px dotted #ddd;
  }
  .pt-item-check { font-size: 14pt; line-height: 1; }
  .pt-item-label { flex: 1; }
  .pt-item-given { display: inline-flex; gap: 1mm; font-size: 8pt; color: #666; }
  .pt-item-given-label { flex-shrink: 0; }
  .pt-blank-line {
    display: inline-block; border-bottom: 1px solid #666; height: 4mm;
    min-width: 30mm;
  }
  .pt-inline-blank { min-width: 22mm; }
  .pt-child-notes {
    font-size: 8pt; background: #FEF3C7; padding: 2mm;
    border-radius: 2mm; margin: 2mm 0 0 0;
  }
  .pt-footer {
    border-top: 1px solid #333; padding-top: 3mm;
    display: flex; flex-direction: column; gap: 2mm;
  }
  .pt-outcome, .pt-notes {
    display: flex; flex-wrap: wrap; gap: 3mm; align-items: baseline;
    font-size: 9pt;
  }
  .pt-label { font-weight: 700; text-transform: uppercase; font-size: 8pt; }
  .pt-checkbox { font-size: 10pt; }
  .pt-notes { flex: 1; }
  .pt-notes .pt-blank-line { flex: 1; min-width: 60mm; }
  .pt-venue {
    font-size: 8pt; color: #666; text-align: center; margin: 2mm 0 0 0;
  }
  @media print {
    @page { size: A5 portrait; margin: 4mm; }
    body * { visibility: hidden !important; }
    #tickets-print-area, #tickets-print-area * { visibility: visible !important; }
    #tickets-print-area {
      position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0;
    }
    .pick-ticket { border: none; margin: 0; page-break-after: always; }
    html, body { background: white !important; }
  }
`;

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

type StatusFilter = "approved" | "walk_in" | "all";

export default async function B2STicketsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter: StatusFilter =
    params.status === "walk_in"
      ? "walk_in"
      : params.status === "all"
        ? "all"
        : "approved";

  const supabase = createAdminClient();

  const { data: eventRow } = await supabase
    .from("events")
    .select("id")
    .eq("slug", B2S_SLUG)
    .maybeSingle();

  if (!eventRow) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/back-to-school"
          className="text-sm text-gray-600 hover:text-brand-dark inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-6 text-sm text-amber-900">
          Drive event not seeded yet.
        </div>
      </div>
    );
  }
  const eventId = (eventRow as { id: string }).id;

  // Load families for the selected status. Approved is the main use case
  // (Friday-night batch). Walk-ins is used on the day as they come in.
  const wantedStatuses =
    statusFilter === "all"
      ? ["approved", "walk_in"]
      : [statusFilter];

  const { data: regs } = await supabase
    .from("registrations")
    .select(
      `id, parent_name, parent_email, parent_phone, parent_postcode,
       status, qr_token,
       registration_children (
         id, child_name, child_age, uniform_size, sex, school, needs,
         uniform_choices, notes, display_order
       )`,
    )
    .eq("event_id", eventId)
    .in("status", wantedStatuses)
    .order("parent_name", { ascending: true });

  const families = (regs as PickTicketFamily[] | null) ?? [];

  // Build a QR data-URL per family. Families without a qr_token get a
  // placeholder — those need the send-approval blast to run first (Friday 6pm)
  // or a walk-in registration to complete.
  const BASE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || "https://evolutionimpactinitiative.co.uk";
  const qrByFamily = new Map<string, string | null>();
  await Promise.all(
    families.map(async (f) => {
      if (!f.qr_token) {
        qrByFamily.set(f.id, null);
        return;
      }
      const url = `${BASE_URL}/b2s/verify/${f.qr_token}`;
      const src = await QRCode.toDataURL(url, {
        width: 200,
        margin: 1,
        errorCorrectionLevel: "M",
        color: { dark: "#111111", light: "#FFFFFF" },
      });
      qrByFamily.set(f.id, src);
    }),
  );

  const missingQrCount = families.filter((f) => !f.qr_token).length;

  return (
    <div className="space-y-6">
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      <div className="print:hidden">
        <Link
          href="/admin/back-to-school"
          className="text-sm text-gray-600 hover:text-brand-dark inline-flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Back to School
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-black text-brand-dark">
              Pick tickets
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              One A5 ticket per family. Bulk-print Friday night after the
              approval blast, then hand to the pick team on Saturday morning.
            </p>
          </div>
          <PrintButton
            label={`Print ${families.length} ticket${families.length === 1 ? "" : "s"}`}
          />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mt-4 border-b border-gray-200 pb-3">
          {(
            [
              { key: "approved", label: "Approved" },
              { key: "walk_in", label: "Walk-ins" },
              { key: "all", label: "All (approved + walk-in)" },
            ] as Array<{ key: StatusFilter; label: string }>
          ).map((t) => {
            const active = t.key === statusFilter;
            const href =
              t.key === "approved"
                ? "/admin/back-to-school/tickets"
                : `/admin/back-to-school/tickets?status=${t.key}`;
            return (
              <Link
                key={t.key}
                href={href}
                className={
                  active
                    ? "bg-brand-blue text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest"
                    : "bg-white text-brand-dark border border-gray-200 hover:border-brand-blue px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest"
                }
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        {missingQrCount > 0 && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 flex gap-3">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-heading font-bold">
                {missingQrCount} famil{missingQrCount === 1 ? "y" : "ies"} without a QR token
              </p>
              <p className="mt-1">
                Send the approval email blast first (or promote them from
                waitlist) — that&rsquo;s what generates the token that the
                ticket QR points at. Missing QRs print as a placeholder box.
              </p>
            </div>
          </div>
        )}

        {families.length === 0 && (
          <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-500">
            No families in this bucket yet.
          </div>
        )}

        {families.length > 0 && (
          <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-4 text-sm text-gray-600">
            <p>
              <span className="font-heading font-bold text-brand-dark">
                {families.length} ticket{families.length === 1 ? "" : "s"}
              </span>{" "}
              queued to print · roughly {families.length} sheets of A5. Preview
              below then hit <Printer className="h-3.5 w-3.5 inline mx-0.5" /> Print.
            </p>
          </div>
        )}
      </div>

      {/* Print area */}
      <div id="tickets-print-area">
        {families.map((f) => (
          <PickTicket
            key={f.id}
            family={f}
            qrDataUrl={qrByFamily.get(f.id) ?? null}
          />
        ))}
      </div>
    </div>
  );
}
