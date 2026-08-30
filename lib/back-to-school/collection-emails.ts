// Emails for the Collection Day packing flow.
//   • buildSubstitutionEmail — sent when the steward swaps one of the
//     parent's picked items for a different SKU (usually because we
//     had fewer of the original than the count claimed).
//   • buildPackedEmail — sent when a child's bag is fully packed and
//     ready for the parent to collect.
//
// Both keep the same visual language as the booking confirmation
// (brand blue eyebrow, big heading, slot callout, one CTA) so the
// parent recognises the sender.

import { COLLECTION } from "@/lib/back-to-school/collection";

interface SlotBits {
  slotHuman: string | null; // "12:00 to 12:30" — may be null if unslotted
}

interface SubstitutionItem {
  label: string;               // "Blue polo (short sleeve) · size 8-9"
  reason?: string | null;      // free-form, shown as a small line
}

export function buildSubstitutionEmail(input: {
  parentName: string;
  childName: string;
  swappedFrom: SubstitutionItem;
  swappedTo: SubstitutionItem;
  verifyUrl: string;
} & SlotBits): string {
  const { parentName, childName, swappedFrom, swappedTo, slotHuman, verifyUrl } = input;
  return wrap(`
    <p style="font-size:12px;text-transform:uppercase;letter-spacing:1.4px;color:#17559D;font-weight:800;margin:0 0 8px 0;">
      Back to School Collection Day · ${COLLECTION.dateLabel}
    </p>
    <h1 style="font-size:24px;font-weight:900;margin:0 0 12px 0;">A small change to ${escapeHtml(childName)}&rsquo;s bag</h1>
    <p style="font-size:15px;line-height:1.5;margin:0 0 16px 0;">
      Hi ${escapeHtml(parentName)}, we&rsquo;re packing your bags today
      and needed to swap one item for ${escapeHtml(childName)} — we had
      slightly fewer of the original than we thought.
    </p>

    <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:12px;padding:14px;margin:14px 0;">
      <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:1.2px;color:#9A3412;font-weight:700;">Swapped</p>
      <p style="margin:6px 0 0 0;font-size:14px;color:#7C2D12;text-decoration:line-through;">${escapeHtml(swappedFrom.label)}</p>
      <p style="margin:8px 0 0 0;font-size:12px;text-transform:uppercase;letter-spacing:1.2px;color:#065F46;font-weight:700;">For</p>
      <p style="margin:6px 0 0 0;font-size:15px;color:#111;font-weight:600;">${escapeHtml(swappedTo.label)}</p>
      ${swappedTo.reason ? `<p style="margin:6px 0 0 0;font-size:12px;color:#666;">${escapeHtml(swappedTo.reason)}</p>` : ""}
    </div>

    ${slotHuman ? slotCallout(slotHuman) : ""}

    <p style="font-size:14px;line-height:1.55;margin:16px 0;">
      If this swap doesn&rsquo;t work for you, just reply to this email
      before your slot and we&rsquo;ll do what we can. Otherwise nothing
      to do — see you on the day.
    </p>

    <p style="text-align:center;margin:20px 0;">
      <a href="${verifyUrl}" style="display:inline-block;background:#17559D;color:#fff;text-decoration:none;font-weight:700;padding:10px 18px;border-radius:8px;font-size:14px;">View my booking</a>
    </p>

    <p style="font-size:13px;color:#666;margin:24px 0 0 0;">
      The Evolution Impact Initiative team
    </p>
  `);
}

export function buildPackedEmail(input: {
  parentName: string;
  childName: string;   // when >1 child, callers can pass "your children" and set isFamily=true
  items: string[];
  verifyUrl: string;
} & SlotBits): string {
  const { parentName, childName, items, slotHuman, verifyUrl } = input;
  const itemsHtml = items.length
    ? `<ul style="font-size:14px;line-height:1.55;padding-left:18px;margin:8px 0 0 0;">
         ${items.map((it) => `<li>${escapeHtml(it)}</li>`).join("")}
       </ul>`
    : "";
  return wrap(`
    <p style="font-size:12px;text-transform:uppercase;letter-spacing:1.4px;color:#17559D;font-weight:800;margin:0 0 8px 0;">
      Back to School Collection Day · ${COLLECTION.dateLabel}
    </p>
    <h1 style="font-size:24px;font-weight:900;margin:0 0 12px 0;">${escapeHtml(childName)}&rsquo;s bag is packed and ready</h1>
    <p style="font-size:15px;line-height:1.5;margin:0 0 16px 0;">
      Hi ${escapeHtml(parentName)}, we&rsquo;ve packed everything for
      ${escapeHtml(childName)} and it&rsquo;s ready to go. Please
      collect during your booked slot below.
    </p>

    <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:12px;padding:14px;margin:14px 0;">
      <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:1.2px;color:#065F46;font-weight:700;">In the bag</p>
      ${itemsHtml || `<p style="margin:8px 0 0 0;font-size:14px;color:#111;">Your requested items.</p>`}
    </div>

    ${slotHuman ? slotCallout(slotHuman) : ""}

    <h2 style="font-size:16px;margin:20px 0 6px 0;">Bring the QR</h2>
    <p style="font-size:14px;line-height:1.55;margin:0 0 12px 0;">
      Show the QR from your original booking email at pickup. If you
      can&rsquo;t find it, use the link below.
    </p>
    <p style="text-align:center;margin:16px 0;">
      <a href="${verifyUrl}" style="display:inline-block;background:#17559D;color:#fff;text-decoration:none;font-weight:700;padding:10px 18px;border-radius:8px;font-size:14px;">Open my QR</a>
    </p>

    <p style="font-size:13px;color:#666;margin:24px 0 0 0;">
      The Evolution Impact Initiative team
    </p>
  `);
}

function slotCallout(slotHuman: string): string {
  return `
    <div style="background:#F0F6FF;border:1px solid #C7DCFF;border-radius:12px;padding:14px;margin:14px 0;">
      <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:1.2px;color:#17559D;font-weight:700;">Your slot</p>
      <p style="margin:6px 0 0 0;font-size:20px;font-weight:800;">${escapeHtml(slotHuman)}</p>
      <p style="margin:4px 0 0 0;font-size:13px;color:#333;">${COLLECTION.dateLabel}, ${COLLECTION.venueName}, ${COLLECTION.venueAddress}</p>
    </div>
  `;
}

function wrap(inner: string): string {
  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111;">
    ${inner}
  </div>
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
