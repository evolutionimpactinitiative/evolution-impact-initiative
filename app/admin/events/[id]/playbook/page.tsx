import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Event } from "@/lib/supabase/types";
import { PlaybookChecklist } from "@/components/admin/events/PlaybookChecklist";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EventPlaybookPage({ params }: Props) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: eventRow } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const event = eventRow as Event | null;
  if (!event) notFound();

  const siteOrigin =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.evolutionimpactinitiative.co.uk";

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div>
        <Link
          href={`/admin/events/${event.id}`}
          className="text-sm text-gray-600 hover:text-brand-dark inline-flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to event
        </Link>
        <h1 className="text-2xl md:text-3xl font-heading font-black text-brand-dark">
          Launch playbook
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {event.title} — everything you need to get this event live and out to
          the community.
        </p>
      </div>

      <PlaybookChecklist event={event} siteOrigin={siteOrigin} />
    </div>
  );
}
