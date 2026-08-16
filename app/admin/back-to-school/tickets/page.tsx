import Link from "next/link";
import { ArrowLeft, Printer, AlertTriangle } from "lucide-react";
import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/admin";
import { B2S_SLUG } from "@/lib/back-to-school";
import {
  PickLabel,
  type PickLabelFamily,
} from "@/components/admin/back-to-school/PickLabel";
import { PrintButton } from "@/components/admin/back-to-school/PrintButton";
import {
  PICK_LABEL_PRINT_STYLES,
  pickLabelPrintMediaRules,
} from "@/lib/back-to-school/pick-label-styles";

// One 4×6" label per child (thermal-printer sized). Sticks to the bag;
// picker scans the QR to see what to grab.
const PRINT_STYLES =
  PICK_LABEL_PRINT_STYLES + pickLabelPrintMediaRules("tickets-print-area");

import type { PickLabelChild } from "@/components/admin/back-to-school/PickLabel";

type LabelFamilyWithChildren = PickLabelFamily & {
  registration_children: Array<PickLabelChild & { display_order: number }>;
};

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
      `id, parent_name, status, qr_token,
       registration_children (
         id, child_name, child_age, uniform_size, sex, school, needs,
         uniform_choices, notes, display_order
       )`,
    )
    .eq("event_id", eventId)
    .in("status", wantedStatuses)
    .order("parent_name", { ascending: true });

  const families = (regs as LabelFamilyWithChildren[] | null) ?? [];
  const totalLabels = families.reduce(
    (n, f) => n + (f.registration_children?.length ?? 0),
    0,
  );

  // Build a QR data-URL per family. Families without a qr_token get a
  // placeholder — those need the send-approval blast to run first
  // (Friday 6pm) or a walk-in registration to complete.
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
        width: 500,       // bigger since the label QR renders at 60mm
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
              Bag labels
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              One 4×6&Prime; label per child on the thermal printer, with
              that child&rsquo;s pick list on it. Stick to a bag Friday
              night, then the picker fills straight from the label. The QR
              is for the handout scan at the door.
            </p>
          </div>
          <PrintButton
            label={`Print ${totalLabels} label${totalLabels === 1 ? "" : "s"}`}
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
                {totalLabels} label{totalLabels === 1 ? "" : "s"}
              </span>{" "}
              queued to print for {families.length} famil{families.length === 1 ? "y" : "ies"}. Make sure
              the label printer is loaded with 4×6&Prime; stock, then hit
              <Printer className="h-3.5 w-3.5 inline mx-0.5" /> Print.
            </p>
          </div>
        )}
      </div>

      {/* Print area — one label per child, families grouped for tidy preview */}
      <div id="tickets-print-area">
        {families.flatMap((f) => {
          const kids = [...(f.registration_children ?? [])].sort(
            (a, b) => a.display_order - b.display_order,
          );
          return kids.map((c) => (
            <PickLabel
              key={c.id}
              child={c}
              family={{
                id: f.id,
                parent_name: f.parent_name,
                status: f.status,
                qr_token: f.qr_token,
              }}
              qrDataUrl={qrByFamily.get(f.id) ?? null}
            />
          ));
        })}
      </div>
    </div>
  );
}
