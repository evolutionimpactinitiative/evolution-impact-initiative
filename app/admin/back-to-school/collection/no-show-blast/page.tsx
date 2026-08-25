import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { B2S_SLUG } from "@/lib/back-to-school";
import { COLLECTION } from "@/lib/back-to-school/collection";
import { NoShowBlastForm } from "@/components/admin/back-to-school/NoShowBlastForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NoShowBlastPage() {
  const admin = createAdminClient();

  // Find August registrations who never picked up.
  const { data: eventRow } = await admin
    .from("events")
    .select("id")
    .eq("slug", B2S_SLUG)
    .maybeSingle();
  const event = eventRow as { id: string } | null;

  interface Row {
    id: string;
    parent_name: string;
    parent_email: string;
    parent_phone: string;
    attended: string | null;
    status: string;
  }
  let noShows: Row[] = [];
  if (event) {
    const { data } = await admin
      .from("registrations")
      .select("id, parent_name, parent_email, parent_phone, attended, status")
      .eq("event_id", event.id)
      .in("status", ["approved", "walk_in"])
      .neq("attended", "yes");
    noShows = (data as Row[] | null) ?? [];
  }

  return (
    <div className="space-y-6 pb-16 max-w-2xl mx-auto">
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
          Sends a personalised email to every parent who was approved for
          the August drive and didn&rsquo;t collect. Message includes the
          Collection Day booking link and a clear line about the
          blacklist consequence if they don&rsquo;t show up this time.
        </p>
      </div>

      <div className="bg-brand-blue/5 border border-brand-blue/20 rounded-2xl p-4">
        <p className="text-sm">
          <b>{noShows.length}</b> parent{noShows.length === 1 ? "" : "s"} will
          get this email. Collection Day is {COLLECTION.dateLabel}.
        </p>
      </div>

      <NoShowBlastForm recipientCount={noShows.length} />
    </div>
  );
}
