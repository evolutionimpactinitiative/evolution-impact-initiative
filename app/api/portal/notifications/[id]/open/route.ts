import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Click-through handler for a single notification. Marks it read for
// the current carer (RLS-safe via user_id match) and 302s to its
// link_url. Falls back to /portal/our-village if the row is missing or
// not theirs.
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/portal/login", request.url));
  }

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: notif } = await (admin as any)
    .from("notifications")
    .select("link_url, user_id")
    .eq("id", id)
    .maybeSingle();

  if (!notif || notif.user_id !== user.id) {
    return NextResponse.redirect(new URL("/portal/our-village", request.url));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("read_at", null);

  return NextResponse.redirect(new URL(notif.link_url, request.url));
}
