import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Returns the current carer's chat thread id. Used by the family
// composer right after send to find the thread it should upload
// attachments into.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: carer } = await (admin as any)
    .from("parent_carers")
    .select("family_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!carer) {
    return NextResponse.json({ error: "No family record" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: thread } = await (admin as any)
    .from("chat_threads")
    .select("id")
    .eq("family_id", carer.family_id)
    .maybeSingle();
  if (!thread) {
    return NextResponse.json({ error: "No thread yet" }, { status: 404 });
  }

  return NextResponse.json({ threadId: thread.id });
}
