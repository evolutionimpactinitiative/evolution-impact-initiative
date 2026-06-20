// One-off: re-send the "vendor application received" email to a single vendor.
// Useful when the original email was sent to a typo'd address and the row has
// since been corrected.
//
// Usage:
//   npx tsx scripts/resend-vendor-confirmation.ts <vendor_id>

import { createAdminClient } from "../lib/supabase/admin";
import {
  getResendClient,
  FROM_EMAIL,
  REPLY_TO_EMAIL,
} from "../lib/email/resend";
import { vendorApplicationReceivedEmail } from "../lib/email/festival-templates";

async function main() {
  const vendorId = process.argv[2];
  if (!vendorId) {
    console.error("Missing vendor id argument");
    process.exit(1);
  }

  const supabase = createAdminClient();
  const { data: vendor, error } = await supabase
    .from("festival_vendors")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .select("*" as any)
    .eq("id", vendorId)
    .single();

  if (error || !vendor) {
    console.error("Vendor not found:", error?.message);
    process.exit(1);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v = vendor as any;

  console.log(`Resending vendor confirmation to ${v.email} (${v.business_name})`);

  const { subject, html } = vendorApplicationReceivedEmail({
    vendor: {
      business_name: v.business_name,
      contact_name: v.contact_name,
      category: v.category,
      contribution_amount: v.contribution_amount,
    },
  });

  const resend = getResendClient();
  if (!resend) {
    console.error("RESEND_API_KEY not set");
    process.exit(1);
  }

  const { data: sendResult, error: sendErr } = await resend.emails.send({
    from: FROM_EMAIL,
    to: v.email,
    replyTo: REPLY_TO_EMAIL,
    subject,
    html,
  });

  if (sendErr) {
    console.error("Resend send error:", sendErr);
    process.exit(1);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("email_logs").insert({
    email_type: "vendor_application_received",
    recipient_email: v.email,
    subject,
    sent_at: new Date().toISOString(),
    status: "sent",
  });

  console.log("Sent. Resend id:", sendResult?.id);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
