import Link from "next/link";
import { ArrowLeft, Search, Users } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Promise<{ q?: string }>;

export default async function AdminGtFamiliesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supa = admin as any;

  // We match against parent_carers (name, email, postcode via family) and
  // fall back to listing everyone if q is empty. Overfetching then filtering
  // is fine at this scale; hard to beat with a single join over pg text search.
  let carersQuery = supa
    .from("parent_carers")
    .select(
      `id, name, email, phone, is_primary, created_at,
       family:families ( id, postcode, created_at )`,
    )
    .order("created_at", { ascending: false });

  if (query) {
    // Escape single quotes to avoid breaking the OR string. Supabase's
    // .or() uses PostgREST filter syntax; ilike wildcards are %.
    const safe = query.replace(/[%,()]/g, " ").trim();
    carersQuery = carersQuery.or(
      `name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%`,
    );
  }

  const { data: carersRaw } = await carersQuery.limit(200);

  type CarerRow = {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    is_primary: boolean;
    created_at: string;
    family: { id: string; postcode: string | null; created_at: string } | null;
  };
  const carers = (carersRaw as CarerRow[] | null) ?? [];

  // Collapse to unique families (a parent's row is the primary contact
  // for their household — non-primary carers appear as a row too, we
  // dedupe by family_id and prefer the primary).
  const familyMap = new Map<string, CarerRow>();
  for (const c of carers) {
    if (!c.family) continue;
    const existing = familyMap.get(c.family.id);
    if (!existing || (c.is_primary && !existing.is_primary)) {
      familyMap.set(c.family.id, c);
    }
  }
  const families = [...familyMap.values()];

  // Pull children + registration counts for the visible families in one shot.
  const familyIds = families.map((f) => f.family!.id);
  const childCounts = new Map<string, number>();
  const regCounts = new Map<string, { total: number; attended: number }>();

  if (familyIds.length > 0) {
    const { data: childRows } = await supa
      .from("children")
      .select("family_id")
      .in("family_id", familyIds)
      .is("archived_at", null);
    for (const c of (childRows as { family_id: string }[] | null) ?? []) {
      childCounts.set(c.family_id, (childCounts.get(c.family_id) ?? 0) + 1);
    }

    const { data: regRows } = await supa
      .from("registrations")
      .select("family_id, attended")
      .in("family_id", familyIds);
    for (const r of (regRows as { family_id: string; attended: string | null }[] | null) ?? []) {
      const bucket = regCounts.get(r.family_id) ?? { total: 0, attended: 0 };
      bucket.total += 1;
      if (r.attended === "yes") bucket.attended += 1;
      regCounts.set(r.family_id, bucket);
    }
  }

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <Link
          href="/admin/growing-together"
          className="inline-flex items-center gap-1.5 text-sm text-brand-blue hover:text-brand-dark mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Growing Together
        </Link>
        <h1 className="font-heading font-black text-2xl lg:text-3xl text-brand-dark">
          Families
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {families.length} {families.length === 1 ? "family" : "families"}
          {query ? ` matching "${query}"` : ""} in the portal.
        </p>
      </div>

      <form action="/admin/growing-together/families" method="get" className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search by name, email, or phone"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-dark font-heading font-bold text-sm"
        >
          Search
        </button>
      </form>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {families.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            {query ? "No families match your search." : "No families in the portal yet."}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-xs uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3 font-medium">Primary carer</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Postcode</th>
                <th className="px-4 py-3 font-medium text-right">Children</th>
                <th className="px-4 py-3 font-medium text-right">Registrations</th>
                <th className="px-4 py-3 font-medium text-right">Attended</th>
                <th className="px-4 py-3 font-medium text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {families.map((c) => {
                const familyId = c.family!.id;
                const kids = childCounts.get(familyId) ?? 0;
                const regs = regCounts.get(familyId) ?? { total: 0, attended: 0 };
                return (
                  <tr key={familyId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/growing-together/families/${familyId}`}
                        className="text-sm font-medium text-brand-dark hover:text-brand-blue"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div>{c.email}</div>
                      {c.phone && <div className="text-xs text-gray-400">{c.phone}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {c.family?.postcode ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-brand-dark text-right font-medium">
                      {kids}
                    </td>
                    <td className="px-4 py-3 text-sm text-brand-dark text-right font-medium">
                      {regs.total}
                    </td>
                    <td className="px-4 py-3 text-sm text-brand-dark text-right font-medium">
                      {regs.attended}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 text-right">
                      {new Date(c.family!.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {families.length === 200 && (
        <p className="text-xs text-gray-500 flex items-center gap-2">
          <Users className="h-3.5 w-3.5" />
          Showing first 200. Refine with search.
        </p>
      )}
    </div>
  );
}
