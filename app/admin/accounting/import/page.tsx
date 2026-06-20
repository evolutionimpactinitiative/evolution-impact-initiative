import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { CsvImportWizard } from "@/components/admin/accounting/CsvImportWizard";
import type { Fund, FundCategory, Account } from "@/lib/accounting/types";

export const dynamic = "force-dynamic";

export default async function CsvImportPage() {
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
          href="/admin/accounting"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to accounting
        </Link>
        <h1 className="font-heading font-black text-xl lg:text-2xl text-gray-900">
          Import bank CSV
        </h1>
        <p className="text-gray-600 text-sm lg:text-base mt-1">
          Upload a Virgin Money (or any) CSV, map the columns once, then
          classify each row by fund + category before posting. Use this for
          monthly bank reconciliation and Year-1 historical backfill.
        </p>
      </div>

      <CsvImportWizard
        funds={funds}
        fundCategories={fundCategories}
        accounts={accounts}
      />
    </div>
  );
}
