import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Mail,
  ShieldAlert,
  UserX,
  Users,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { B2S_SLUG } from "@/lib/back-to-school";
import {
  COLLECTION,
  COLLECTION_SLOTS,
  COLLECTION_SLUG,
  slotIso,
  slotLabel,
} from "@/lib/back-to-school/collection";
import { CollectionActions } from "@/components/admin/back-to-school/CollectionActions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CollectionRegistration = {
  id: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  status: "pending" | "approved" | "waitlisted" | "cancelled" | "walk_in";
  collection_slot: string | null;
  qr_token: string | null;
  attended: string | null;
  created_at: string;
  registration_children: Array<{
    id: string;
    child_name: string;
    child_age: number | null;
    uniform_size: string | null;
    sex: string | null;
    display_order: number;
  }>;
};

type Blacklist = {
  id: string;
  email: string | null;
  phone: string | null;
  parent_name: string | null;
  reason: string;
  notes: string | null;
  added_at: string;
  released_at: string | null;
};

export default async function CollectionAdminPage() {
  const admin = createAdminClient();

  const { data: eventRow } = await admin
    .from("events")
    .select("id")
    .eq("slug", COLLECTION_SLUG)
    .maybeSingle();
  const event = eventRow as { id: string } | null;
  if (!event) notFound();

  const { data: regsRaw } = await admin
    .from("registrations")
    .select(
      `id, parent_name, parent_email, parent_phone, status,
       collection_slot, qr_token, attended, created_at,
       registration_children ( id, child_name, child_age, uniform_size, sex, display_order )`,
    )
    .eq("event_id", event.id)
    .order("collection_slot", { ascending: true })
    .order("created_at", { ascending: true });
  const registrations = (regsRaw as CollectionRegistration[] | null) ?? [];

  const { data: bl } = await admin
    .from("back_to_school_blacklist")
    .select("*")
    .is("released_at", null)
    .order("added_at", { ascending: false });
  const blacklist = (bl as Blacklist[] | null) ?? [];

  // August drive no-shows — parents who were approved for the August
  // drive but never marked as collected. Fetched inline here so the
  // chair can see who's on the follow-up list without a separate page.
  const { data: augEventRow } = await admin
    .from("events")
    .select("id")
    .eq("slug", B2S_SLUG)
    .maybeSingle();
  const augustEvent = augEventRow as { id: string } | null;
  interface AugustNoShow {
    id: string;
    parent_name: string;
    parent_email: string;
    parent_phone: string;
    created_at: string;
  }
  let augustNoShows: AugustNoShow[] = [];
  if (augustEvent) {
    // Post-archive: no-shows carry cancellation_reason = 'august_no_show'
    // (set by the 26 Aug migration). Prior status-based query still
    // works but this is more precise.
    const { data: aug } = await admin
      .from("registrations")
      .select("id, parent_name, parent_email, parent_phone, created_at")
      .eq("event_id", augustEvent.id)
      .eq("cancellation_reason", "august_no_show")
      .order("parent_name", { ascending: true });
    augustNoShows = (aug as AugustNoShow[] | null) ?? [];
  }

  // Bucket registrations by slot for the top summary
  const bySlot = new Map<string, CollectionRegistration[]>();
  for (const r of registrations) {
    const key = r.collection_slot ?? "unslotted";
    const arr = bySlot.get(key) ?? [];
    arr.push(r);
    bySlot.set(key, arr);
  }

  const totalBooked = registrations.filter(
    (r) => r.status === "approved" || r.status === "pending",
  ).length;
  const totalKids = registrations.reduce(
    (n, r) => n + (r.registration_children?.length ?? 0),
    0,
  );
  const collectedCount = registrations.filter((r) => r.attended === "yes").length;

  return (
    <div className="space-y-6 pb-16">
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
              {COLLECTION.title}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {COLLECTION.dateLabel} · {COLLECTION.timeLabel} ·{" "}
              {COLLECTION.venueName}
            </p>
          </div>
          <CollectionActions eventId={event.id} />
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile
          label="Bookings"
          value={totalBooked}
          subtitle={`of ${COLLECTION.slotCapacity * COLLECTION_SLOTS.length} max`}
          icon={<Users className="h-5 w-5" />}
          tone="blue"
        />
        <StatTile
          label="Children"
          value={totalKids}
          icon={<Users className="h-5 w-5" />}
          tone="green"
        />
        <StatTile
          label="Collected"
          value={collectedCount}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone={collectedCount > 0 ? "emerald" : "gray"}
        />
        <StatTile
          label="Blacklisted"
          value={blacklist.length}
          icon={<ShieldAlert className="h-5 w-5" />}
          tone={blacklist.length > 0 ? "red" : "gray"}
        />
      </div>

      {/* Slot rundown */}
      <section className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-brand-blue" />
          <h2 className="font-heading font-bold text-brand-dark">Slots</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {COLLECTION_SLOTS.map((s) => {
            const iso = slotIso(s);
            const regs = bySlot.get(iso) ?? [];
            const active = regs.filter(
              (r) => r.status === "approved" || r.status === "pending",
            );
            const remaining = Math.max(
              0,
              COLLECTION.slotCapacity - active.length,
            );
            return (
              <div
                key={s}
                className="border border-gray-200 rounded-xl p-3"
              >
                <div className="flex items-baseline justify-between">
                  <p className="font-heading font-black text-brand-dark">
                    {slotLabel(s)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {active.length}/{COLLECTION.slotCapacity}
                  </p>
                </div>
                <p className="text-[10px] uppercase tracking-widest font-heading font-bold text-gray-500 mt-0.5">
                  {remaining === 0 ? "Full" : `${remaining} spaces left`}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Blacklist */}
      <section className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-600" />
            <h2 className="font-heading font-bold text-brand-dark">
              Blacklist
            </h2>
          </div>
          <p className="text-xs text-gray-500">
            {blacklist.length} active
          </p>
        </div>
        {blacklist.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            Nobody blocked. Auto-flagged people (no-show on both drives)
            will appear here once the drive is over.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {blacklist.map((b) => (
              <li key={b.id} className="py-2 flex items-start gap-3 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-brand-dark">
                    {b.parent_name || b.email || b.phone || "Unknown"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {b.email && <span>{b.email}</span>}
                    {b.email && b.phone && " · "}
                    {b.phone && <span>{b.phone}</span>}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Reason: <b>{b.reason}</b>
                    {b.notes && ` — ${b.notes}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Registrations by slot */}
      <section>
        <h2 className="font-heading font-bold text-brand-dark mb-3">
          Bookings
        </h2>
        {registrations.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-sm text-gray-500">
            No bookings yet. Once parents submit the form, they&rsquo;ll
            show up here grouped by slot.
          </div>
        ) : (
          <div className="space-y-4">
            {COLLECTION_SLOTS.map((s) => {
              const iso = slotIso(s);
              const regs = bySlot.get(iso) ?? [];
              if (regs.length === 0) return null;
              return (
                <div key={s} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-baseline justify-between">
                    <p className="font-heading font-black text-brand-dark">
                      {slotLabel(s)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {regs.length} booking{regs.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {regs.map((r) => (
                      <li key={r.id} className="p-3 flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-heading font-bold text-brand-dark truncate">
                              {r.parent_name}
                            </p>
                            {r.attended === "yes" && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-heading font-bold uppercase tracking-widest bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="h-3 w-3" />
                                Collected
                              </span>
                            )}
                            {r.status === "cancelled" && (
                              <span className="text-[10px] font-heading font-bold uppercase tracking-widest bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                Cancelled
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {r.registration_children.length} child
                            {r.registration_children.length === 1 ? "" : "ren"}{" "}
                            — {r.registration_children.map((c) => c.child_name).join(", ")}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {r.parent_email} · {r.parent_phone}
                          </p>
                        </div>
                        {r.qr_token && (
                          <Link
                            href={`/b2s/print/${r.qr_token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-xs font-heading font-bold uppercase tracking-widest text-brand-blue hover:text-brand-dark inline-flex items-center gap-1"
                          >
                            Print label
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* August no-shows */}
      <section className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <UserX className="h-4 w-4 text-amber-600" />
            <h2 className="font-heading font-bold text-brand-dark">
              August drive no-shows
            </h2>
          </div>
          <Link
            href="/admin/back-to-school/collection/no-show-blast"
            className="inline-flex items-center gap-1.5 bg-brand-blue text-white px-3 py-1.5 rounded-md text-xs font-heading font-bold uppercase tracking-widest hover:bg-brand-dark"
          >
            <Mail className="h-3.5 w-3.5" />
            Email all {augustNoShows.length}
          </Link>
        </div>
        <p className="text-xs text-gray-600 mb-3">
          Parents who were approved for the August drive and did not
          attend. They&rsquo;re still welcome to book Collection Day.
          Anyone who misses this one too gets auto-added to the blacklist.
        </p>
        {augustNoShows.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            No August no-shows on record.
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto -mx-2 px-2">
            <ul className="divide-y divide-gray-100">
              {augustNoShows.map((n) => (
                <li key={n.id} className="py-2 text-sm">
                  <p className="font-heading font-bold text-brand-dark truncate">
                    {n.parent_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {n.parent_email} · {n.parent_phone}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

function StatTile({
  label,
  value,
  subtitle,
  icon,
  tone,
}: {
  label: string;
  value: number;
  subtitle?: string;
  icon: React.ReactNode;
  tone: "blue" | "green" | "emerald" | "red" | "gray";
}) {
  const tones: Record<string, { bg: string; text: string }> = {
    blue: { bg: "bg-brand-blue/10", text: "text-brand-blue" },
    green: { bg: "bg-brand-green/10", text: "text-brand-green" },
    emerald: { bg: "bg-emerald-100", text: "text-emerald-700" },
    red: { bg: "bg-red-100", text: "text-red-700" },
    gray: { bg: "bg-gray-100", text: "text-gray-600" },
  };
  const t = tones[tone];
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{label}</p>
          <p className="text-2xl lg:text-3xl font-bold text-brand-dark mt-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-xl ${t.bg} ${t.text}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
