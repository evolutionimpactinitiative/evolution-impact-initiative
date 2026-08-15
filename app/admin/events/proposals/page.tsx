import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarPlus, Rocket } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  STATUS_LABELS,
  STATUS_TONES,
  type EventProposal,
  type ProposalStatus,
} from "@/lib/event-proposals/types";
import { NewProposalButton } from "@/components/admin/events/NewProposalButton";
import { DeleteRowButton } from "@/components/admin/DeleteRowButton";

type Tab = ProposalStatus | "all";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "all", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "submitted", label: "Submitted" },
  { key: "in_review", label: "In review" },
  { key: "needs_info", label: "Needs info" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProposalsIndex({ searchParams }: PageProps) {
  const params = await searchParams;
  const tab: Tab =
    TABS.find((t) => t.key === params.status)?.key ?? "all";

  const supabase = createAdminClient();

  const { data: allRaw } = await supabase
    .from("event_proposals")
    .select("*")
    .order("updated_at", { ascending: false });
  const all = (allRaw as EventProposal[] | null) ?? [];

  // For submitter names
  const memberIds = Array.from(
    new Set(
      all
        .map((p) => p.event_planner_id ?? p.created_by)
        .filter((x): x is string => !!x),
    ),
  );
  const { data: memberRows } = memberIds.length
    ? await supabase
        .from("team_members")
        .select("id, name, email")
        .in("id", memberIds)
    : { data: [] as { id: string; name: string | null; email: string }[] };
  const memberById = new Map<string, { name: string | null; email: string }>();
  for (const m of ((memberRows ?? []) as { id: string; name: string | null; email: string }[])) {
    memberById.set(m.id, { name: m.name, email: m.email });
  }

  const counts = TABS.reduce<Record<Tab, number>>(
    (acc, t) => {
      acc[t.key] =
        t.key === "all"
          ? all.length
          : all.filter((p) => p.status === t.key).length;
      return acc;
    },
    {
      all: 0,
      draft: 0,
      submitted: 0,
      in_review: 0,
      needs_info: 0,
      approved: 0,
      rejected: 0,
    },
  );

  const filtered =
    tab === "all" ? all : all.filter((p) => p.status === tab);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/events"
            className="text-sm text-gray-600 hover:text-brand-dark inline-flex items-center gap-1 mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All events
          </Link>
          <h1 className="text-2xl md:text-3xl font-heading font-black text-brand-dark">
            Event proposals
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Team drafts → board review → approve → auto-spawns a draft event
            to publish.
          </p>
        </div>
        <NewProposalButton />
      </div>

      {/* Tabs */}
      <div className="-mx-4 md:mx-0 px-4 md:px-0 border-b border-gray-200 pb-3">
        <div className="flex md:flex-wrap gap-2 overflow-x-auto md:overflow-visible no-scrollbar">
          {TABS.map((t) => {
            const isActive = t.key === tab;
            const href =
              t.key === "all"
                ? "/admin/events/proposals"
                : `/admin/events/proposals?status=${t.key}`;
            return (
              <Link
                key={t.key}
                href={href}
                className={
                  (isActive
                    ? "bg-brand-blue text-white "
                    : "bg-white text-brand-dark border border-gray-200 hover:border-brand-blue ") +
                  "shrink-0 px-3.5 md:px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest"
                }
              >
                {t.label}
                <span
                  className={`ml-2 text-xs ${isActive ? "text-white/70" : "text-gray-500"}`}
                >
                  {counts[t.key]}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <CalendarPlus className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <p className="font-heading font-bold text-brand-dark">
            No proposals in this bucket
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {tab === "draft"
              ? "Start a new proposal to get going."
              : "They'll appear here once submitted."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((p) => {
            const author = p.event_planner_id
              ? memberById.get(p.event_planner_id)
              : p.created_by
                ? memberById.get(p.created_by)
                : null;
            const tone = STATUS_TONES[p.status];
            const editHref =
              p.status === "draft"
                ? `/admin/events/proposals/${p.id}/edit`
                : `/admin/events/proposals/${p.id}`;
            return (
              <li
                key={p.id}
                className="relative bg-white rounded-2xl border border-gray-200 hover:border-brand-blue transition-colors"
              >
                <Link href={editHref} className="block p-4 pr-14">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-2 mb-1">
                        <p className="font-heading font-bold text-brand-dark truncate">
                          {p.title}
                        </p>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-heading font-bold uppercase tracking-widest ${tone.bg} ${tone.text}`}
                        >
                          {STATUS_LABELS[p.status]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {author ? `Planner: ${author.name || author.email}` : "Unassigned"}
                        {p.preferred_date && ` · ${new Date(p.preferred_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
                        {p.primary_venue_name && ` · ${p.primary_venue_name}`}
                      </p>
                      {p.spawned_event_id && (
                        <p className="inline-flex items-center gap-1 text-xs text-emerald-700 mt-1">
                          <Rocket className="h-3 w-3" />
                          Draft event created
                        </p>
                      )}
                      {p.summary && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {p.summary}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 shrink-0 mt-1" />
                  </div>
                </Link>
                <div className="absolute top-3 right-3">
                  <DeleteRowButton
                    href={`/api/event-proposals/${p.id}`}
                    entityLabel="proposal"
                    itemName={p.title}
                    warning={
                      p.spawned_event_id
                        ? "The draft event this proposal spawned will stay. Delete it separately from Events if you want it gone."
                        : undefined
                    }
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
