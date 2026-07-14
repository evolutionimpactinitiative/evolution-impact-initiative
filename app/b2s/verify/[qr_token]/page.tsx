import Link from "next/link";
import { AlertTriangle, Calendar, MapPin, ShieldCheck } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { B2S, B2S_SLUG } from "@/lib/back-to-school";
import { CollectionSheet } from "@/components/back-to-school/CollectionSheet";
import type { CollectionSheetRegistration } from "@/components/back-to-school/CollectionSheet";

interface Props {
  params: Promise<{ qr_token: string }>;
  searchParams: Promise<{ s?: string }>;
}

export const dynamic = "force-dynamic";

export default async function B2SVerifyPage({ params, searchParams }: Props) {
  const { qr_token } = await params;
  const { s: stewardToken } = await searchParams;

  const supabase = createAdminClient();

  const { data: eventRow } = await supabase
    .from("events")
    .select("id")
    .eq("slug", B2S_SLUG)
    .maybeSingle();
  const eventId = eventRow ? (eventRow as { id: string }).id : null;

  // Look up the registration by qr_token
  const { data: reg } = await supabase
    .from("registrations")
    .select(
      `id, parent_name, parent_phone, parent_postcode, status,
       distribution_status, distribution_recorded_at,
       registration_children ( id, child_name, child_age, uniform_size, sex, school, needs, items_given, notes, display_order )`,
    )
    .eq("qr_token", qr_token)
    .maybeSingle();

  const registration = reg as CollectionSheetRegistration | null;

  if (!registration) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center border border-red-200">
          <AlertTriangle className="h-10 w-10 text-red-600 mx-auto mb-4" />
          <h1 className="font-heading font-black text-2xl text-brand-dark mb-2">
            QR not recognised
          </h1>
          <p className="text-gray-600 mb-6">
            This code doesn&rsquo;t match any registration. If you registered,
            please check the QR code in your approval email.
          </p>
          <Link
            href="/back-to-school"
            className="inline-flex items-center gap-1 text-sm font-heading font-bold uppercase tracking-widest text-brand-blue hover:text-brand-dark"
          >
            Back to Back to School
          </Link>
        </div>
      </div>
    );
  }

  // Validate steward token if provided. Anyone with the QR URL can view the
  // read-only family view, but only a valid steward can record collection.
  let stewardAuth: { tokenId: string; label: string } | null = null;
  if (stewardToken && eventId) {
    const { data: tokenRow } = await supabase
      .from("festival_steward_tokens")
      .select("id, label, event_id, revoked_at")
      .eq("token", stewardToken)
      .maybeSingle();
    const t = tokenRow as {
      id: string;
      label: string;
      event_id: string;
      revoked_at: string | null;
    } | null;
    if (t && t.event_id === eventId && !t.revoked_at) {
      stewardAuth = { tokenId: t.id, label: t.label };
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6 md:py-10">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Event meta */}
        <div className="bg-brand-dark text-white rounded-2xl p-4 md:p-5">
          <p className="text-xs uppercase tracking-widest text-brand-accent font-heading font-bold mb-1">
            Back to School Drive · Collection sheet
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/80">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-brand-accent" />
              {B2S.dateLabel} · {B2S.timeLabel}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-brand-accent" />
              {B2S.venueName}, {B2S.venueArea}
            </span>
          </div>
        </div>

        {stewardAuth && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-sm text-emerald-800">
            <ShieldCheck className="h-4 w-4" />
            Scanning as{" "}
            <strong className="font-heading font-bold">
              {stewardAuth.label}
            </strong>
          </div>
        )}

        <CollectionSheet
          registration={registration}
          stewardTokenIdForRecording={stewardAuth?.tokenId ?? null}
          stewardTokenParam={stewardToken ?? null}
        />
      </div>
    </div>
  );
}
