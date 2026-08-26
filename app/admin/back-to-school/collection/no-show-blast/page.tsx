import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { B2S_SLUG } from "@/lib/back-to-school";
import { COLLECTION } from "@/lib/back-to-school/collection";
import {
  NoShowBlastForm,
  type NoShowRecipient,
} from "@/components/admin/back-to-school/NoShowBlastForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NoShowBlastPage() {
  const admin = createAdminClient();

  const { data: eventRow } = await admin
    .from("events")
    .select("id")
    .eq("slug", B2S_SLUG)
    .maybeSingle();
  const event = eventRow as { id: string } | null;

  let noShows: NoShowRecipient[] = [];
  if (event) {
    // Uses the archive-set cancellation_reason so the count matches
    // the collection admin page (both surfaces read from the same
    // tagged set after the 26 Aug archive migration).
    const { data } = await admin
      .from("registrations")
      .select("id, parent_name, parent_email, parent_phone")
      .eq("event_id", event.id)
      .eq("cancellation_reason", "august_no_show")
      .order("parent_name", { ascending: true });
    noShows = ((data as NoShowRecipient[] | null) ?? []).filter(
      (r) => !!r.parent_email,
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-3xl mx-auto">
      <Link
        href="/admin/back-to-school/collection"
        className="text-sm text-gray-600 hover:text-brand-dark inline-flex items-center gap-1 mb-3"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to collection admin
      </Link>
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-black text-brand-dark inline-flex items-center gap-2">
          <Mail className="h-6 w-6 text-brand-blue" />
          Email August no-shows
        </h1>
        <p className="text-sm text-gray-600 mt-2">
          Pick who to email (everyone is selected by default), tweak the
          message, then send. Collection Day is {COLLECTION.dateLabel}.
        </p>
      </div>

      <NoShowBlastForm recipients={noShows} />
    </div>
  );
}
