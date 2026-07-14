import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import { supplyPledgeReceivedEmail } from "@/lib/email/back-to-school-templates";

interface PledgeItemPayload {
  item?: string;
  size?: string | null;
  qty?: number;
}

interface PledgePayload {
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  deliveryMethod?: "drop_off" | "collection";
  collectionAddress?: string;
  collectionPostcode?: string;
  preferredWindow?: string;
  notes?: string;
  items?: PledgeItemPayload[];
  consent?: boolean;
}

const VALID_METHODS = ["drop_off", "collection"] as const;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PledgePayload;

    if (
      !isNonEmptyString(body.donorName) ||
      !isNonEmptyString(body.donorEmail) ||
      !isNonEmptyString(body.donorPhone)
    ) {
      return NextResponse.json(
        { error: "Please fill in your name, email and phone." },
        { status: 400 },
      );
    }

    if (
      !body.deliveryMethod ||
      !VALID_METHODS.includes(body.deliveryMethod)
    ) {
      return NextResponse.json(
        { error: "Please choose drop-off or collection." },
        { status: 400 },
      );
    }

    if (body.deliveryMethod === "collection") {
      if (
        !isNonEmptyString(body.collectionAddress) ||
        !isNonEmptyString(body.collectionPostcode)
      ) {
        return NextResponse.json(
          {
            error:
              "Please give a collection address and postcode. We cover Medway and surrounding areas.",
          },
          { status: 400 },
        );
      }
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: "Please add at least one item you'd like to pledge." },
        { status: 400 },
      );
    }

    const cleanedItems: Array<{
      item: string;
      size: string | null;
      qty: number;
    }> = [];
    for (let i = 0; i < body.items.length; i++) {
      const it = body.items[i];
      if (!isNonEmptyString(it.item)) {
        return NextResponse.json(
          { error: `Please name item ${i + 1}.` },
          { status: 400 },
        );
      }
      if (
        typeof it.qty !== "number" ||
        !Number.isFinite(it.qty) ||
        it.qty < 1 ||
        it.qty > 500
      ) {
        return NextResponse.json(
          {
            error: `Quantity for "${it.item}" must be between 1 and 500.`,
          },
          { status: 400 },
        );
      }
      cleanedItems.push({
        item: it.item.trim(),
        size: isNonEmptyString(it.size) ? it.size.trim() : null,
        qty: Math.round(it.qty),
      });
    }

    if (body.consent !== true) {
      return NextResponse.json(
        { error: "Please tick the confirmation box to continue." },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inserted, error: insertErr } = await (supabase as any)
      .from("back_to_school_supply_pledges")
      .insert({
        donor_name: body.donorName.trim(),
        donor_email: body.donorEmail.trim().toLowerCase(),
        donor_phone: body.donorPhone.trim(),
        items: cleanedItems,
        delivery_method: body.deliveryMethod,
        collection_address:
          body.deliveryMethod === "collection"
            ? body.collectionAddress!.trim()
            : null,
        collection_postcode:
          body.deliveryMethod === "collection"
            ? body.collectionPostcode!.trim().toUpperCase()
            : null,
        preferred_window: isNonEmptyString(body.preferredWindow)
          ? body.preferredWindow.trim()
          : null,
        notes: isNonEmptyString(body.notes) ? body.notes.trim() : null,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertErr || !inserted) {
      console.error("[b2s-supply-pledge] insert error:", insertErr);
      return NextResponse.json(
        { error: "Failed to save pledge. Please try again." },
        { status: 500 },
      );
    }

    // Confirmation email — non-fatal if it fails
    try {
      const resend = getResendClient();
      if (resend) {
        const itemCount = cleanedItems.reduce((sum, it) => sum + it.qty, 0);
        const { subject, html } = supplyPledgeReceivedEmail({
          donorName: body.donorName.trim(),
          itemCount,
          deliveryMethod: body.deliveryMethod,
        });
        await resend.emails.send({
          from: FROM_EMAIL,
          to: body.donorEmail.trim().toLowerCase(),
          replyTo: REPLY_TO_EMAIL,
          subject,
          html,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("email_logs").insert({
          email_type: "back_to_school_supply_pledge_received",
          recipient_email: body.donorEmail.trim().toLowerCase(),
          subject,
          sent_at: new Date().toISOString(),
          status: "sent",
        });
      }
    } catch (err) {
      console.error("[b2s-supply-pledge] email error (non-fatal):", err);
    }

    return NextResponse.json({
      success: true,
      pledgeId: (inserted as { id: string }).id,
    });
  } catch (err) {
    console.error("[b2s-supply-pledge] handler error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
