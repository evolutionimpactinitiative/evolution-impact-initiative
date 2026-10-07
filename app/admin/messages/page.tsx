import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Thread = {
  id: string;
  family_id: string;
  status: "open" | "resolved";
  assigned_admin_id: string | null;
  last_message_at: string | null;
  last_message_by: "family" | "team" | null;
};

type Family = {
  id: string;
  parent_carers: { name: string; email: string; is_primary: boolean }[];
};

const FILTERS = [
  { id: "needs_reply", label: "Needs reply" },
  { id: "all", label: "All" },
  { id: "mine", label: "Mine" },
  { id: "unassigned", label: "Unassigned" },
  { id: "resolved", label: "Resolved" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

function hoursSince(iso: string | null): string {
  if (!iso) return "—";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.round(hrs / 24);
  return `${days}d`;
}

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tm } = await (admin as any)
    .from("team_members")
    .select("id, name")
    .eq("email", user.email || "")
    .maybeSingle();
  if (!tm) redirect("/admin");

  const { filter: filterRaw } = await searchParams;
  const filter: FilterId = (
    FILTERS.find((f) => f.id === filterRaw)?.id ?? "needs_reply"
  ) as FilterId;

  // Base query — build then apply filter.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (admin as any)
    .from("chat_threads")
    .select("id, family_id, status, assigned_admin_id, last_message_at, last_message_by")
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (filter === "needs_reply") {
    query = query.eq("status", "open").eq("last_message_by", "family");
  } else if (filter === "mine") {
    query = query.eq("status", "open").eq("assigned_admin_id", tm.id);
  } else if (filter === "unassigned") {
    query = query.eq("status", "open").is("assigned_admin_id", null);
  } else if (filter === "resolved") {
    query = query.eq("status", "resolved");
  } else if (filter === "all") {
    query = query.eq("status", "open");
  }

  const { data: threadsRaw } = await query;
  const threads = (threadsRaw as Thread[] | null) ?? [];

  // Count per-filter badges in the sidebar.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const countFor = async (predicate: (q: any) => any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q = predicate(
      (admin as any)
        .from("chat_threads")
        .select("id", { count: "exact", head: true }),
    );
    const { count } = await q;
    return count ?? 0;
  };
  const [cNeedsReply, cAll, cMine, cUnassigned, cResolved] = await Promise.all([
    countFor((q) => q.eq("status", "open").eq("last_message_by", "family")),
    countFor((q) => q.eq("status", "open")),
    countFor((q) => q.eq("status", "open").eq("assigned_admin_id", tm.id)),
    countFor((q) => q.eq("status", "open").is("assigned_admin_id", null)),
    countFor((q) => q.eq("status", "resolved")),
  ]);
  const counts: Record<FilterId, number> = {
    needs_reply: cNeedsReply,
    all: cAll,
    mine: cMine,
    unassigned: cUnassigned,
    resolved: cResolved,
  };

  // Resolve family primary carers for display.
  const familyIds = threads.map((t) => t.family_id);
  let familyMap: Record<string, Family> = {};
  if (familyIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: families } = await (admin as any)
      .from("families")
      .select("id, parent_carers (name, email, is_primary)")
      .in("id", familyIds);
    for (const f of (families as Family[] | null) ?? []) {
      familyMap[f.id] = f;
    }
  }

  // Resolve assigned admin names.
  const adminIds = Array.from(
    new Set(threads.map((t) => t.assigned_admin_id).filter(Boolean) as string[]),
  );
  const adminNames: Record<string, string> = {};
  if (adminIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: admins } = await (admin as any)
      .from("team_members")
      .select("id, name")
      .in("id", adminIds);
    for (const a of (admins as { id: string; name: string }[] | null) ?? []) {
      adminNames[a.id] = a.name;
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-heading font-black text-2xl md:text-3xl text-gray-900 mb-2">
          Messages
        </h1>
        <p className="text-sm text-gray-600">
          Shared inbox for all family conversations. First to reply gets assigned.
        </p>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => {
          const active = f.id === filter;
          const count = counts[f.id];
          return (
            <Link
              key={f.id}
              href={`/admin/messages?filter=${f.id}`}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                active
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
              }`}
            >
              {f.label}
              <span
                className={`ml-2 text-xs ${active ? "text-blue-100" : "text-gray-500"}`}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {threads.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
          <MessageCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">No threads in this view.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 bg-white rounded-xl border border-gray-200 overflow-hidden">
          {threads.map((t) => {
            const family = familyMap[t.family_id];
            const primary = family?.parent_carers.find((c) => c.is_primary) ?? family?.parent_carers[0];
            const assignedLabel = t.assigned_admin_id
              ? adminNames[t.assigned_admin_id] || "Assigned"
              : null;
            const needsReply = t.status === "open" && t.last_message_by === "family";
            return (
              <li key={t.id}>
                <Link
                  href={`/admin/messages/${t.id}`}
                  className="block px-4 py-3 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 truncate">
                          {primary?.name || "Family"}
                        </p>
                        {needsReply && (
                          <span className="inline-block px-2 py-0.5 bg-red-50 text-red-700 text-xs font-bold rounded-full">
                            Needs reply
                          </span>
                        )}
                        {t.status === "resolved" && (
                          <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                            Resolved
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {primary?.email}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                        <Clock className="h-3 w-3" />
                        {hoursSince(t.last_message_at)}
                      </p>
                      {assignedLabel && (
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {assignedLabel}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
