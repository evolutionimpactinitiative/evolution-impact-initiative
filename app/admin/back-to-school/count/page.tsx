import Link from "next/link";
import { ArrowLeft, ListChecks } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import type { StockRow } from "@/lib/back-to-school-stock";
import type {
  CountSession,
  CountTally,
} from "@/lib/back-to-school/stock-count";
import { CountView } from "@/components/admin/back-to-school/CountView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function B2SCountPage() {
  const supabase = createAdminClient();

  const { data: openSess } = await supabase
    .from("back_to_school_count_sessions")
    .select("*")
    .eq("status", "open")
    .maybeSingle();
  const session = (openSess as CountSession | null) ?? null;

  const { data: stockRaw } = await supabase
    .from("back_to_school_stock")
    .select("id, category, colour, sleeve, fit, size, quantity, notes, updated_at")
    .order("category")
    .order("colour")
    .order("fit")
    .order("sleeve")
    .order("size");
  const stockRows = (stockRaw as StockRow[] | null) ?? [];

  const { data: talliesRaw } = session
    ? await supabase
        .from("back_to_school_count_tallies")
        .select("*")
        .eq("session_id", session.id)
    : { data: [] as CountTally[] };
  const tallies = (talliesRaw as CountTally[] | null) ?? [];

  // Show the last 5 closed sessions so people can see recent history.
  const { data: pastRaw } = await supabase
    .from("back_to_school_count_sessions")
    .select("*")
    .neq("status", "open")
    .order("started_at", { ascending: false })
    .limit(5);
  const pastSessions = (pastRaw as CountSession[] | null) ?? [];

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
        <h1 className="text-2xl md:text-3xl font-heading font-black text-brand-dark inline-flex items-center gap-2">
          <ListChecks className="h-6 w-6 text-brand-blue" />
          Stock count
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Tally each item as it goes into its labelled box. When
          you&rsquo;re done, review the diffs and one-tap reconcile — the
          system updates to match your physical count.
        </p>
      </div>

      <CountView
        session={session}
        stockRows={stockRows}
        tallies={tallies}
        pastSessions={pastSessions}
      />
    </div>
  );
}
