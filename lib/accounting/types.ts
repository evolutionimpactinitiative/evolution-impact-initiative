// Types matching the accounting schema (supabase-migration-accounting.sql).
// Money is always stored in pence (integers) — never floats.

export type FundType = "restricted" | "designated" | "unrestricted" | "endowment";

export type AccountType = "income" | "expense" | "asset" | "liability" | "equity";

export type TransactionStatus = "draft" | "posted" | "reversed";

export type PeriodStatus = "open" | "closed";

export interface Fund {
  id: string;
  code: string;
  name: string;
  fund_type: FundType;
  funder: string | null;
  funder_reference: string | null;
  starts_on: string | null;
  ends_on: string | null;
  total_awarded_pence: number | null;
  restrictions_text: string | null;
  is_active: boolean;
  display_order: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FundCategory {
  id: string;
  fund_id: string;
  code: string;
  name: string;
  description: string | null;
  budget_amount_pence: number | null;
  budget_period: "annual" | "total" | "monthly" | "quarterly" | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  account_type: AccountType;
  parent_id: string | null;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface AccountingPeriod {
  id: string;
  name: string;
  starts_on: string;
  ends_on: string;
  status: PeriodStatus;
  closed_at: string | null;
  closed_by: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  transaction_date: string;
  period_id: string;
  reference: string | null;
  description: string;
  status: TransactionStatus;
  posted_at: string | null;
  posted_by: string | null;
  reversed_by_transaction_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface JournalLine {
  id: string;
  transaction_id: string;
  account_id: string;
  fund_id: string;
  fund_category_id: string | null;
  debit_pence: number;
  credit_pence: number;
  description: string | null;
  display_order: number;
  created_at: string;
}

export interface Attachment {
  id: string;
  entity_type: string;
  entity_id: string;
  filename: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  storage_bucket: string;
  storage_path: string;
  description: string | null;
  uploaded_at: string;
  uploaded_by: string | null;
}

// Composite shape returned by listing endpoints
export interface TransactionWithLines extends Transaction {
  journal_lines: (JournalLine & {
    account: Pick<Account, "id" | "code" | "name" | "account_type">;
    fund: Pick<Fund, "id" | "code" | "name" | "fund_type">;
    fund_category: Pick<FundCategory, "id" | "code" | "name"> | null;
  })[];
  attachments: Attachment[];
}
