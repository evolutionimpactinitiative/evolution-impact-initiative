"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { poundsToPence } from "./format";

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

interface CurrentTeamMember {
  id: string;
  email: string;
}

async function getCurrentTeamMember(): Promise<CurrentTeamMember | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  const { data } = await supabase
    .from("team_members")
    .select("id, email")
    .eq("email", user.email)
    .maybeSingle();
  return (data as CurrentTeamMember | null) ?? null;
}

async function findPeriodForDate(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  isoDate: string,
): Promise<string | null> {
  const { data } = await admin
    .from("accounting_periods")
    .select("id, status")
    .lte("starts_on", isoDate)
    .gte("ends_on", isoDate)
    .maybeSingle();
  if (!data) return null;
  return data.id as string;
}

// ----------------------------------------------------------------------------
// Payment Out: create a draft tx with debit(expense) + credit(asset/bank),
// post it, optionally attach a file path that was already uploaded client-side.
// ----------------------------------------------------------------------------
export interface PaymentOutInput {
  transaction_date: string; // ISO YYYY-MM-DD
  description: string;
  amount_pounds: string; // raw form value
  fund_id: string;
  fund_category_id: string;
  expense_account_id: string;
  paid_from_account_id: string; // asset (Bank, Stripe, Cash)
  reference?: string;
  attachment?: {
    filename: string;
    storage_path: string;
    mime_type: string;
    file_size_bytes: number;
  };
  post_immediately?: boolean;
}

export async function createPaymentOut(
  input: PaymentOutInput,
): Promise<ActionResult<{ transaction_id: string }>> {
  try {
    const me = await getCurrentTeamMember();
    if (!me) return { ok: false, error: "Not authenticated" };

    const amount_pence = poundsToPence(input.amount_pounds);
    if (amount_pence <= 0) {
      return { ok: false, error: "Amount must be greater than zero" };
    }

    const admin = createAdminClient();

    const period_id = await findPeriodForDate(admin, input.transaction_date);
    if (!period_id) {
      return {
        ok: false,
        error: `No accounting period covers ${input.transaction_date}. Create one first.`,
      };
    }

    // 1. Create draft transaction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tx, error: txErr } = await (admin as any)
      .from("transactions")
      .insert({
        transaction_date: input.transaction_date,
        period_id,
        description: input.description,
        reference: input.reference ?? null,
        status: "draft",
        created_by: me.id,
      })
      .select()
      .single();

    if (txErr || !tx) {
      return { ok: false, error: txErr?.message ?? "Failed to create transaction" };
    }

    // 2. Insert two journal lines: DEBIT expense, CREDIT asset
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: linesErr } = await (admin as any).from("journal_lines").insert([
      {
        transaction_id: tx.id,
        account_id: input.expense_account_id,
        fund_id: input.fund_id,
        fund_category_id: input.fund_category_id,
        debit_pence: amount_pence,
        credit_pence: 0,
        display_order: 1,
      },
      {
        transaction_id: tx.id,
        account_id: input.paid_from_account_id,
        fund_id: input.fund_id,
        fund_category_id: input.fund_category_id,
        debit_pence: 0,
        credit_pence: amount_pence,
        display_order: 2,
      },
    ]);

    if (linesErr) {
      // Rollback: delete the draft tx (CASCADE removes lines)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from("transactions").delete().eq("id", tx.id);
      return { ok: false, error: linesErr.message };
    }

    // 3. Attachment (optional)
    if (input.attachment) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from("attachments").insert({
        entity_type: "transaction",
        entity_id: tx.id,
        filename: input.attachment.filename,
        mime_type: input.attachment.mime_type,
        file_size_bytes: input.attachment.file_size_bytes,
        storage_bucket: "attachments",
        storage_path: input.attachment.storage_path,
        uploaded_by: me.id,
      });
    }

    // 4. Post the transaction (trigger validates balance)
    if (input.post_immediately !== false) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: postErr } = await (admin as any)
        .from("transactions")
        .update({ status: "posted", posted_by: me.id })
        .eq("id", tx.id);

      if (postErr) {
        return { ok: false, error: `Posted check failed: ${postErr.message}` };
      }
    }

    revalidatePath("/admin/accounting");
    revalidatePath("/admin/accounting/transactions");

    return { ok: true, data: { transaction_id: tx.id as string } };
  } catch (err) {
    console.error("[createPaymentOut]", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unexpected error",
    };
  }
}

// ----------------------------------------------------------------------------
// Payment In: mirror of Payment Out — debit asset, credit income
// ----------------------------------------------------------------------------
export interface PaymentInInput {
  transaction_date: string;
  description: string;
  amount_pounds: string;
  fund_id: string;
  fund_category_id: string;
  income_account_id: string;
  received_into_account_id: string; // asset (Bank, Stripe)
  reference?: string;
  attachment?: PaymentOutInput["attachment"];
  post_immediately?: boolean;
}

export async function createPaymentIn(
  input: PaymentInInput,
): Promise<ActionResult<{ transaction_id: string }>> {
  try {
    const me = await getCurrentTeamMember();
    if (!me) return { ok: false, error: "Not authenticated" };

    const amount_pence = poundsToPence(input.amount_pounds);
    if (amount_pence <= 0) {
      return { ok: false, error: "Amount must be greater than zero" };
    }

    const admin = createAdminClient();

    const period_id = await findPeriodForDate(admin, input.transaction_date);
    if (!period_id) {
      return {
        ok: false,
        error: `No accounting period covers ${input.transaction_date}.`,
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tx, error: txErr } = await (admin as any)
      .from("transactions")
      .insert({
        transaction_date: input.transaction_date,
        period_id,
        description: input.description,
        reference: input.reference ?? null,
        status: "draft",
        created_by: me.id,
      })
      .select()
      .single();

    if (txErr || !tx) {
      return { ok: false, error: txErr?.message ?? "Failed to create transaction" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: linesErr } = await (admin as any).from("journal_lines").insert([
      {
        transaction_id: tx.id,
        account_id: input.received_into_account_id,
        fund_id: input.fund_id,
        fund_category_id: input.fund_category_id,
        debit_pence: amount_pence,
        credit_pence: 0,
        display_order: 1,
      },
      {
        transaction_id: tx.id,
        account_id: input.income_account_id,
        fund_id: input.fund_id,
        fund_category_id: input.fund_category_id,
        debit_pence: 0,
        credit_pence: amount_pence,
        display_order: 2,
      },
    ]);

    if (linesErr) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from("transactions").delete().eq("id", tx.id);
      return { ok: false, error: linesErr.message };
    }

    if (input.attachment) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from("attachments").insert({
        entity_type: "transaction",
        entity_id: tx.id,
        filename: input.attachment.filename,
        mime_type: input.attachment.mime_type,
        file_size_bytes: input.attachment.file_size_bytes,
        storage_bucket: "attachments",
        storage_path: input.attachment.storage_path,
        uploaded_by: me.id,
      });
    }

    if (input.post_immediately !== false) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: postErr } = await (admin as any)
        .from("transactions")
        .update({ status: "posted", posted_by: me.id })
        .eq("id", tx.id);

      if (postErr) {
        return { ok: false, error: `Posted check failed: ${postErr.message}` };
      }
    }

    revalidatePath("/admin/accounting");
    revalidatePath("/admin/accounting/transactions");

    return { ok: true, data: { transaction_id: tx.id as string } };
  } catch (err) {
    console.error("[createPaymentIn]", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unexpected error",
    };
  }
}

// ----------------------------------------------------------------------------
// Reverse a posted transaction: create a new posted tx with opposite lines.
// Original is then marked status='reversed'.
// ----------------------------------------------------------------------------
export async function reverseTransaction(
  original_tx_id: string,
  reason: string,
): Promise<ActionResult<{ reversal_id: string }>> {
  try {
    const me = await getCurrentTeamMember();
    if (!me) return { ok: false, error: "Not authenticated" };

    const admin = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: original } = await (admin as any)
      .from("transactions")
      .select("*, journal_lines(*)")
      .eq("id", original_tx_id)
      .maybeSingle();

    if (!original) return { ok: false, error: "Transaction not found" };
    if (original.status !== "posted") {
      return { ok: false, error: `Cannot reverse a transaction in '${original.status}' status` };
    }
    if (original.reversed_by_transaction_id) {
      return { ok: false, error: "Transaction is already reversed" };
    }

    const today = new Date().toISOString().split("T")[0];
    const period_id = await findPeriodForDate(admin, today);
    if (!period_id) return { ok: false, error: "No open period for today's date" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: reversal, error: revErr } = await (admin as any)
      .from("transactions")
      .insert({
        transaction_date: today,
        period_id,
        description: `Reversal of ${original.id.slice(0, 8)}: ${reason}`,
        reference: `REV-${original.reference ?? original.id.slice(0, 8)}`,
        status: "draft",
        created_by: me.id,
      })
      .select()
      .single();

    if (revErr || !reversal) {
      return { ok: false, error: revErr?.message ?? "Failed to create reversal" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flipped = (original.journal_lines as any[]).map((l, i) => ({
      transaction_id: reversal.id,
      account_id: l.account_id,
      fund_id: l.fund_id,
      fund_category_id: l.fund_category_id,
      debit_pence: l.credit_pence,
      credit_pence: l.debit_pence,
      display_order: i + 1,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: linesErr } = await (admin as any).from("journal_lines").insert(flipped);
    if (linesErr) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from("transactions").delete().eq("id", reversal.id);
      return { ok: false, error: linesErr.message };
    }

    // Post the reversal
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: postErr } = await (admin as any)
      .from("transactions")
      .update({ status: "posted", posted_by: me.id })
      .eq("id", reversal.id);
    if (postErr) return { ok: false, error: postErr.message };

    // Mark the original as reversed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from("transactions")
      .update({ status: "reversed", reversed_by_transaction_id: reversal.id })
      .eq("id", original_tx_id);

    revalidatePath("/admin/accounting");
    revalidatePath("/admin/accounting/transactions");

    return { ok: true, data: { reversal_id: reversal.id as string } };
  } catch (err) {
    console.error("[reverseTransaction]", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unexpected error",
    };
  }
}

// ----------------------------------------------------------------------------
// Mint a short-lived signed URL for downloading an attachment
// ----------------------------------------------------------------------------
export async function getAttachmentDownloadUrl(
  attachment_id: string,
): Promise<ActionResult<{ url: string }>> {
  try {
    const me = await getCurrentTeamMember();
    if (!me) return { ok: false, error: "Not authenticated" };

    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: att } = await (admin as any)
      .from("attachments")
      .select("storage_bucket, storage_path")
      .eq("id", attachment_id)
      .maybeSingle();

    if (!att) return { ok: false, error: "Attachment not found" };

    const { data: signed, error } = await admin.storage
      .from(att.storage_bucket)
      .createSignedUrl(att.storage_path, 60 * 5); // 5 minutes

    if (error || !signed) {
      return { ok: false, error: error?.message ?? "Failed to mint URL" };
    }

    return { ok: true, data: { url: signed.signedUrl } };
  } catch (err) {
    console.error("[getAttachmentDownloadUrl]", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unexpected error",
    };
  }
}
