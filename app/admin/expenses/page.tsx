import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ReceiptText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ExpenseSubmission,
  ExpenseStatus,
} from "@/lib/expenses/types";
import type { Fund, FundCategory, Account } from "@/lib/accounting/types";
import type { Event } from "@/lib/supabase/types";
import { NewExpenseButton } from "@/components/admin/expenses/NewExpenseButton";
import { ExpensesView } from "@/components/admin/expenses/ExpensesView";

type Tab = "mine" | "chair_queue" | "pay_queue" | "all";

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ExpensesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tab: Tab =
    (params.tab as Tab) === "chair_queue" ||
    (params.tab as Tab) === "pay_queue" ||
    (params.tab as Tab) === "all"
      ? (params.tab as Tab)
      : "mine";

  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) notFound();

  const { data: meRow } = await authClient
    .from("team_members")
    .select("id, name, email, role, is_treasurer")
    .eq("email", user.email || "")
    .maybeSingle();
  const me = meRow as {
    id: string;
    name: string | null;
    email: string;
    role: string | null;
    is_treasurer: boolean | null;
  } | null;
  if (!me) notFound();

  const isChair = me.role === "admin";
  const isTreasurer = !!me.is_treasurer;

  const supabase = createAdminClient();

  const [expensesRes, teamRes, fundsRes, categoriesRes, accountsRes, eventsRes] =
    await Promise.all([
      supabase
        .from("expense_submissions")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("team_members").select("id, name, email"),
      supabase
        .from("funds")
        .select("*")
        .eq("is_active", true)
        .order("display_order"),
      supabase
        .from("fund_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order"),
      supabase
        .from("accounts")
        .select("*")
        .eq("is_active", true)
        .order("display_order"),
      supabase
        .from("events")
        .select("id, title, date")
        .order("date", { ascending: false }),
    ]);

  const expenses = (expensesRes.data as ExpenseSubmission[] | null) ?? [];
  const teamRows =
    (teamRes.data as Array<{ id: string; name: string | null; email: string }> | null) ?? [];
  const funds = (fundsRes.data as Fund[] | null) ?? [];
  const fundCategories = (categoriesRes.data as FundCategory[] | null) ?? [];
  const accounts = (accountsRes.data as Account[] | null) ?? [];
  const events =
    (eventsRes.data as Pick<Event, "id" | "title" | "date">[] | null) ?? [];

  return (
    <div className="space-y-6 pb-16">
      <div>
        <Link
          href="/admin/accounting"
          className="text-sm text-gray-600 hover:text-brand-dark inline-flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Accounting
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-black text-brand-dark inline-flex items-center gap-2">
              <ReceiptText className="h-6 w-6 text-brand-blue" />
              Expenses
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Submit receipts + invoices → chair approves → treasurer pays.
              Payments ≥ £500 need both chair and treasurer approval.
            </p>
          </div>
          <NewExpenseButton funds={funds} events={events} />
        </div>
      </div>

      <ExpensesView
        expenses={expenses}
        team={teamRows}
        funds={funds}
        fundCategories={fundCategories}
        accounts={accounts}
        events={events}
        currentTab={tab}
        me={{
          id: me.id,
          name: me.name,
          isChair,
          isTreasurer,
        }}
      />
    </div>
  );
}
