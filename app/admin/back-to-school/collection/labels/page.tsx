import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  COLLECTION,
  COLLECTION_SLOTS,
  COLLECTION_SLUG,
  slotIso,
  slotLabel,
} from "@/lib/back-to-school/collection";
import {
  PickLabel,
  type PickLabelChild,
} from "@/components/admin/back-to-school/PickLabel";
import { PrintLabelsButton } from "@/components/admin/back-to-school/PrintLabelsButton";
import {
  PICK_LABEL_PRINT_STYLES,
  pickLabelPrintMediaRules,
} from "@/lib/back-to-school/pick-label-styles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Admin-only bulk print. One label per child, page-break per label so
// a 4×6 thermal printer just walks through them. On A4/Letter the
// browser lays them out one per page. `?reg=<id>` narrows to a single
// family for the per-row "Print" links on the collection dashboard.

type LabelReg = {
  id: string;
  parent_name: string;
  status: string;
  qr_token: string | null;
  collection_slot: string | null;
  registration_children: Array<PickLabelChild & { display_order: number }>;
};

const PRINT_AREA = "labels-print-area";
const PRINT_STYLES =
  PICK_LABEL_PRINT_STYLES + pickLabelPrintMediaRules(PRINT_AREA);

interface Props {
  searchParams: Promise<{ reg?: string }>;
}

export default async function CollectionLabelsPage({ searchParams }: Props) {
  const { reg: regFilter } = await searchParams;
  const admin = createAdminClient();

  const { data: eventRow } = await admin
    .from("events")
    .select("id")
    .eq("slug", COLLECTION_SLUG)
    .maybeSingle();
  const event = eventRow as { id: string } | null;
  if (!event) notFound();

  // Only pull approved/pending — no cancelled or walk-ins here (walk-in
  // labels come out of the day-of Station 2 flow).
  let query = admin
    .from("registrations")
    .select(
      `id, parent_name, status, qr_token, collection_slot,
       registration_children (
         id, child_name, child_age, uniform_size, sex, school,
         needs, uniform_choices, notes, display_order
       )`,
    )
    .eq("event_id", event.id)
    .in("status", ["approved", "pending"])
    .order("collection_slot", { ascending: true })
    .order("created_at", { ascending: true });

  if (regFilter) query = query.eq("id", regFilter);

  const { data: regsRaw } = await query;
  const regs = (regsRaw as LabelReg[] | null) ?? [];

  // Sort within-slot the same way as the dashboard, then flatten to
  // (family, child) rows for a stable print order.
  const bySlot = new Map<number, LabelReg[]>();
  for (const r of regs) {
    const key = r.collection_slot
      ? new Date(r.collection_slot).getTime()
      : -1;
    const arr = bySlot.get(key) ?? [];
    arr.push(r);
    bySlot.set(key, arr);
  }
  const ordered: LabelReg[] = [];
  for (const s of COLLECTION_SLOTS) {
    const t = new Date(slotIso(s)).getTime();
    for (const r of bySlot.get(t) ?? []) ordered.push(r);
  }
  // Anything without a slot (shouldn't happen for collection drive) or
  // whose slot didn't match — append at the end so it's never dropped.
  for (const r of regs) {
    if (!ordered.includes(r)) ordered.push(r);
  }

  const BASE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://evolutionimpactinitiative.co.uk";

  const totalKids = ordered.reduce(
    (n, r) => n + (r.registration_children?.length ?? 0),
    0,
  );

  // Pre-compute QR data URLs for every family so we don't do it inline
  // in the render loop.
  const qrByReg = new Map<string, string | null>();
  await Promise.all(
    ordered.map(async (r) => {
      if (!r.qr_token) {
        qrByReg.set(r.id, null);
        return;
      }
      const url = await QRCode.toDataURL(
        `${BASE_URL}/b2s/verify/${r.qr_token}`,
        {
          width: 500,
          margin: 1,
          errorCorrectionLevel: "M",
          color: { dark: "#111111", light: "#FFFFFF" },
        },
      );
      qrByReg.set(r.id, url);
    }),
  );

  return (
    <div className="space-y-4">
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      <div className="print:hidden">
        <Link
          href="/admin/back-to-school/collection"
          className="text-sm text-gray-600 hover:text-brand-dark inline-flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Collection Day
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-black text-brand-dark">
              {regFilter ? "Family labels" : "All collection labels"}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {COLLECTION.dateLabel} · {ordered.length} famil
              {ordered.length === 1 ? "y" : "ies"} · {totalKids} label
              {totalKids === 1 ? "" : "s"} · sorted by slot
            </p>
          </div>
          <PrintLabelsButton />
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Tip: use your browser&rsquo;s print dialog (or the Print button
          above). Labels are sized 4×6&Prime; portrait; on a thermal
          printer each one advances automatically. On A4/Letter you&rsquo;ll
          get one label per sheet.
        </p>
      </div>

      {ordered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-sm text-gray-500 print:hidden">
          {regFilter
            ? "No matching booking found — it may have been cancelled."
            : "No approved bookings yet."}
        </div>
      ) : (
        <div id={PRINT_AREA}>
          {ordered.map((r) => {
            const slotHuman = r.collection_slot
              ? formatSlotLabel(r.collection_slot)
              : null;
            const kids = [...(r.registration_children ?? [])].sort(
              (a, b) => a.display_order - b.display_order,
            );
            return (
              <div key={r.id}>
                {/* On-screen only — hidden on print */}
                <p className="print:hidden text-[10px] uppercase tracking-widest font-heading font-bold text-brand-blue mt-6 mb-2">
                  {r.parent_name}
                  {slotHuman && ` · ${slotHuman}`} · {kids.length} label
                  {kids.length === 1 ? "" : "s"}
                </p>
                {kids.map((c) => (
                  <PickLabel
                    key={c.id}
                    child={c}
                    family={{
                      id: r.id,
                      parent_name: r.parent_name,
                      status: r.status,
                      qr_token: r.qr_token,
                    }}
                    qrDataUrl={qrByReg.get(r.id) ?? null}
                    driveLabel={`Collection Day · ${COLLECTION.dateLabel}${slotHuman ? ` · ${slotHuman}` : ""}`}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Match one of the six known slots to a human label, otherwise fall
// back to a raw time.
function formatSlotLabel(iso: string): string {
  const t = new Date(iso).getTime();
  for (const s of COLLECTION_SLOTS) {
    if (new Date(slotIso(s)).getTime() === t) return slotLabel(s);
  }
  return iso;
}

