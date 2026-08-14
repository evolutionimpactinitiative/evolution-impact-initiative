import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/admin";
import { B2S, B2S_SLUG } from "@/lib/back-to-school";
import { b2sStewardScanUrl } from "@/lib/back-to-school/steward";
import { B2SStewardTokensView } from "@/components/admin/back-to-school/B2SStewardTokensView";
import type { FestivalStewardToken } from "@/lib/supabase/types";

// Live — new tokens should appear immediately after creation.
export const dynamic = "force-dynamic";

export default async function B2SStewardsPage() {
  const supabase = createAdminClient();

  const { data: eventRow } = await supabase
    .from("events")
    .select("id")
    .eq("slug", B2S_SLUG)
    .maybeSingle();

  if (!eventRow) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/back-to-school"
          className="text-sm text-gray-600 hover:text-brand-dark inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-6 text-sm text-amber-900">
          Back to School event not seeded yet.
        </div>
      </div>
    );
  }
  const eventId = (eventRow as { id: string }).id;

  const { data: tokensData } = await supabase
    .from("festival_steward_tokens")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  const tokens = (tokensData as FestivalStewardToken[] | null) ?? [];

  const activeTokens = tokens.filter((t) => !t.revoked_at);
  const revokedTokens = tokens.filter((t) => t.revoked_at);

  // Generate QR code data URLs server-side so the client component doesn't
  // need to know the base URL or bundle qrcode.
  const activeWithUrls = await Promise.all(
    activeTokens.map(async (t) => {
      const scanUrl = b2sStewardScanUrl(t.token);
      const qrDataUrl = await QRCode.toDataURL(scanUrl, {
        width: 480,
        margin: 1,
        errorCorrectionLevel: "M",
        color: { dark: "#1E1E1E", light: "#FFFFFF" },
      });
      return { ...t, scanUrl, qrDataUrl };
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/back-to-school"
          className="text-sm text-gray-600 hover:text-brand-dark inline-flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Back to School
        </Link>
        <h1 className="text-2xl md:text-3xl font-heading font-black text-brand-dark">
          Steward scanner access
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {B2S.title} · {B2S.dateLabel} at {B2S.venueName}, {B2S.venueArea}
        </p>
      </div>

      <div className="bg-brand-pale/40 border border-brand-blue/20 rounded-2xl p-4 md:p-5 text-sm text-brand-dark">
        <p className="font-heading font-bold mb-1">How it works</p>
        <ol className="list-decimal list-inside space-y-1 text-brand-dark/80">
          <li>
            Generate one link per volunteer below — label it with their name
            and station (e.g. &ldquo;Sarah — Station 2&rdquo;).
          </li>
          <li>
            Either <strong>copy the link</strong> and WhatsApp it to them, or
            hit <strong>Show QR</strong> and let them scan it from your screen.
          </li>
          <li>
            When they open the link on their phone they get a scanner ready
            to use — no login. Each token also gets access to the &ldquo;look
            up by name/email&rdquo; fallback for families without a QR.
          </li>
          <li>
            Revoke any time if a volunteer drops out or loses their phone.
          </li>
        </ol>
      </div>

      <B2SStewardTokensView
        active={activeWithUrls}
        revoked={revokedTokens}
      />
    </div>
  );
}
