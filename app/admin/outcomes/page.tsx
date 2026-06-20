import Link from "next/link";
import { Activity, ArrowRight, BarChart3 } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { bandLabel } from "@/lib/outcomes/scoring";
import { formatDate } from "@/lib/accounting/format";

export const dynamic = "force-dynamic";

interface JoinedResponse {
  id: string;
  submitted_at: string;
  timepoint: string;
  context_label: string | null;
  score_raw: number | null;
  score_transformed: number | null;
  score_band: string | null;
  instrument: { code: string; name: string } | null;
  participant: { name: string | null; email: string | null } | null;
}

interface InstrumentSummary {
  code: string;
  name: string;
  n: number;
  avg_transformed: number | null;
  avg_raw: number | null;
}

function bandClass(band: string | null): string {
  switch (band) {
    case "low":
      return "bg-red-100 text-red-700";
    case "medium":
      return "bg-yellow-100 text-yellow-700";
    case "average":
      return "bg-blue-100 text-blue-700";
    case "high":
      return "bg-green-100 text-green-700";
    case "very_high":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export default async function AdminOutcomesPage() {
  const admin = createAdminClient();

  // Recent 25 responses
  const { data: rData } = await admin
    .from("outcome_responses")
    .select(
      `
      id,
      submitted_at,
      timepoint,
      context_label,
      score_raw,
      score_transformed,
      score_band,
      instrument:outcome_instruments ( code, name ),
      participant:outcome_participants ( name, email )
    `,
    )
    .order("submitted_at", { ascending: false })
    .limit(25);
  const responses = (rData ?? []) as unknown as JoinedResponse[];

  // Simple aggregates per instrument
  const { data: allRaw } = await admin
    .from("outcome_responses")
    .select(
      `score_raw, score_transformed, instrument:outcome_instruments ( code, name )`,
    );
  const all = (allRaw ?? []) as unknown as {
    score_raw: number | null;
    score_transformed: number | null;
    instrument: { code: string; name: string } | null;
  }[];

  const summaryByCode = new Map<string, InstrumentSummary>();
  for (const r of all) {
    if (!r.instrument) continue;
    const key = r.instrument.code;
    const cur = summaryByCode.get(key) ?? {
      code: key,
      name: r.instrument.name,
      n: 0,
      avg_transformed: null,
      avg_raw: null,
    };
    cur.n += 1;
    // Accumulator approach: we'll divide at the end.
    cur.avg_raw =
      (cur.avg_raw ?? 0) + (r.score_raw ?? 0);
    cur.avg_transformed =
      (cur.avg_transformed ?? 0) + (r.score_transformed ?? 0);
    summaryByCode.set(key, cur);
  }
  const summary = Array.from(summaryByCode.values()).map((s) => ({
    ...s,
    avg_raw: s.n > 0 ? Number(((s.avg_raw ?? 0) / s.n).toFixed(2)) : null,
    avg_transformed: s.n > 0 ? Number(((s.avg_transformed ?? 0) / s.n).toFixed(2)) : null,
  }));

  // Pending invitation count
  const { count: pendingCount } = await admin
    .from("outcome_invitations")
    .select("*", { count: "exact", head: true })
    .is("response_id", null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-black text-xl lg:text-2xl text-gray-900">
          Outcomes
        </h1>
        <p className="text-gray-600 text-sm lg:text-base mt-1">
          Participant well-being measurement via ONS4 + SWEMWBS. {responses.length} response
          {responses.length === 1 ? "" : "s"} recorded · {pendingCount ?? 0} invitation
          {pendingCount === 1 ? "" : "s"} pending.
        </p>
      </div>

      {/* Per-instrument summary cards */}
      {summary.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {summary.map((s) => (
            <div
              key={s.code}
              className="bg-white border border-gray-100 rounded-xl shadow-sm p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {s.code}
                  </p>
                  <h3 className="font-heading font-bold text-gray-900">{s.name}</h3>
                </div>
                <BarChart3 className="w-5 h-5 text-gray-300 shrink-0" />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Responses</p>
                  <p className="text-xl font-bold text-gray-900">{s.n}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {s.avg_transformed != null && s.avg_transformed > 0
                      ? "Avg metric score"
                      : "Avg raw score"}
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {s.avg_transformed != null && s.avg_transformed > 0
                      ? s.avg_transformed
                      : (s.avg_raw ?? "—")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent responses */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-heading font-bold text-lg text-gray-900">
            Recent responses
          </h2>
        </div>
        {responses.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-2">No responses yet.</p>
            <p className="text-xs text-gray-400">
              Create an outcome_invitations row in Supabase to get a survey link.
              Admin invitation UI lands in Sprint 2.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {responses.map((r) => (
              <li key={r.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">
                    {r.instrument?.name ?? "Unknown instrument"}
                    <span className="ml-2 text-xs font-normal text-gray-400 uppercase tracking-wide">
                      {r.timepoint}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDate(r.submitted_at)}
                    {r.participant?.name ? ` · ${r.participant.name}` : ""}
                    {r.context_label ? ` · ${r.context_label}` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-gray-900">
                    {r.score_transformed ?? r.score_raw ?? "—"}
                  </p>
                  {r.score_band && (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-0.5 ${bandClass(r.score_band)}`}
                    >
                      {bandLabel(r.score_band)}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Sprint 2 will add: admin invitation UI · email sending · programme-strand tagging · trend charts ·{" "}
        <Link
          href="https://warwick.ac.uk/fac/sci/med/research/platform/wemwbs/"
          target="_blank"
          className="underline hover:text-gray-600"
        >
          full 14-item WEMWBS
          <ArrowRight className="inline w-3 h-3" />
        </Link>
      </p>
    </div>
  );
}
