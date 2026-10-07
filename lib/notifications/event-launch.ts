import { createAdminClient } from "@/lib/supabase/admin";

// When an event's "registration is open" email goes out, also drop an
// in-app notification into any matching parent-carer dashboard so they
// see the alert on the bell + /portal/notifications. digest_sent_at is
// stamped at insert because the email has already been sent — this
// row's job is just the in-app surface.
//
// Called from both the cron (/api/cron/send-registration-notifications)
// and the manual admin trigger (/api/notifications/trigger). Idempotent:
// if a notification for this (user_id, event_id) already exists, it
// skips the insert.
export async function notifyParentOnEventLaunch(params: {
  email: string;
  event: { id: string; slug: string; title: string };
}): Promise<boolean> {
  const admin = createAdminClient();
  const email = params.email.trim().toLowerCase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: carer } = await (admin as any)
    .from("parent_carers")
    .select("user_id, family_id")
    .ilike("email", email)
    .not("user_id", "is", null)
    .maybeSingle();

  if (!carer?.user_id) return false;

  // Idempotency: skip if we've already notified this user about this event.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin as any)
    .from("notifications")
    .select("id")
    .eq("user_id", carer.user_id)
    .eq("type", "event_launch")
    .eq("payload->>event_id", params.event.id)
    .maybeSingle();

  if (existing) return false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any).from("notifications").insert({
    user_id: carer.user_id,
    family_id: carer.family_id,
    type: "event_launch",
    title: `${params.event.title} — registration is open`,
    body: null,
    link_url: `/events/${params.event.slug}`,
    payload: { event_id: params.event.id, slug: params.event.slug },
    // Email already sent via the launch flow; don't let the Village
    // digest cron pick this up (it filters by type anyway, defensive).
    digest_sent_at: new Date().toISOString(),
  });

  if (error) {
    console.error("notifyParentOnEventLaunch insert failed:", error);
    return false;
  }
  return true;
}
