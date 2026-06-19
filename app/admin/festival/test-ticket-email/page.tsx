import { FestivalAdminTabs } from "@/components/admin/festival/FestivalAdminTabs";
import { TestTicketEmailForm } from "@/components/admin/festival/TestTicketEmailForm";
import { FestivalResetTools } from "@/components/admin/festival/FestivalResetTools";
import { createAdminClient } from "@/lib/supabase/admin";
import { FESTIVAL_SLUG } from "@/lib/festival";

export const metadata = {
  title: "Test ticket email · Admin",
};

export const revalidate = 0;

export default async function TestTicketEmailPage() {
  // Counts to surface in the danger-zone so the admin sees what they're nuking
  const supabase = createAdminClient();
  const { data: eventRow } = await supabase
    .from("events")
    .select("id")
    .eq("slug", FESTIVAL_SLUG)
    .maybeSingle();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eventId = (eventRow as any)?.id ?? null;

  let registrationCount = 0;
  let ticketCount = 0;
  let checkedInCount = 0;

  if (eventId) {
    const { count: rCount } = await supabase
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId);
    registrationCount = rCount ?? 0;

    const { count: tCount } = await supabase
      .from("festival_tickets")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId);
    ticketCount = tCount ?? 0;

    const { count: cCount } = await supabase
      .from("festival_tickets")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .not("checked_in_at", "is", null);
    checkedInCount = cCount ?? 0;
  }

  return (
    <div className="space-y-6">
      <FestivalAdminTabs />

      <div>
        <h1 className="font-heading font-black text-xl lg:text-2xl text-gray-900">
          Test ticket email
        </h1>
        <p className="text-gray-600 text-sm lg:text-base mt-1">
          Send a real festival-ticket email to any address — uses real QR codes
          that resolve to live <code className="text-xs bg-gray-100 px-1 rounded">/ticket/[code]</code> pages.
          The test creates a registration row tagged in admin notes; delete it
          when you&rsquo;re done.
        </p>
      </div>

      <TestTicketEmailForm />

      <FestivalResetTools
        registrationCount={registrationCount}
        ticketCount={ticketCount}
        checkedInCount={checkedInCount}
      />
    </div>
  );
}
