import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { TransactionForm } from "@/components/admin/accounting/TransactionForm";
import type { Fund, FundCategory, Account } from "@/lib/accounting/types";

export const dynamic = "force-dynamic";

export default async function NewTransactionPage() {
  const admin = createAdminClient();

  const [fundsRes, categoriesRes, accountsRes] = await Promise.all([
    admin.from("funds").select("*").eq("is_active", true).order("display_order"),
    admin.from("fund_categories").select("*").eq("is_active", true).order("display_order"),
    admin.from("accounts").select("*").eq("is_active", true).order("display_order"),
  ]);

  const funds = (fundsRes.data ?? []) as Fund[];
  const fundCategories = (categoriesRes.data ?? []) as FundCategory[];
  const accounts = (accountsRes.data ?? []) as Account[];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/accounting/transactions"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to transactions
        </Link>
        <h1 className="font-heading font-black text-xl lg:text-2xl text-gray-900">
          New transaction
        </h1>
        <p className="text-gray-600 text-sm lg:text-base mt-1">
          Record a payment out (expense) or payment in (receipt). Both sides post in one step.
        </p>
      </div>

      <TransactionForm
        funds={funds}
        fundCategories={fundCategories}
        accounts={accounts}
      />
    </div>
  );
}
