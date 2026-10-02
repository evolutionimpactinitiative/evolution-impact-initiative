import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ParentCarer, TeamMember } from "@/lib/supabase/types";

export type PortalIdentity =
  | { kind: "carer"; carer: ParentCarer }
  | { kind: "stale_session" }
  | { kind: "admin"; teamMember: TeamMember }
  | { kind: "no_record" };

/**
 * Resolve the current portal user into one of four states.
 *
 * The RLS-scoped query is attempted first — the common case. If it
 * returns no row, we fall back to a service-role lookup to disambiguate:
 *
 *   • Service-role finds a parent_carer → RLS silently filtered it out,
 *     which happens when the session's JWT is stale (long-idle tab,
 *     refresh-token failure). The visible symptom is "no family record"
 *     even though one exists. We flag it as stale_session so the caller
 *     can sign them out and send them back to login cleanly.
 *   • Service-role also finds nothing, but the auth email matches a
 *     team_members row → the user is EII staff who signed in with
 *     their admin account. The parent portal isn't for them.
 *   • Nothing matches anywhere → genuinely no record (half-finished
 *     signup, deleted carer row, etc).
 */
export async function resolvePortalIdentity(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sessionClient: SupabaseClient<any, "public", any>,
  user: User,
): Promise<PortalIdentity> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessionCarer } = await (sessionClient as any)
    .from("parent_carers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (sessionCarer) {
    return { kind: "carer", carer: sessionCarer as ParentCarer };
  }

  // Session query returned nothing. Disambiguate with the service role.
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: adminCarer } = await (admin as any)
    .from("parent_carers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminCarer) {
    // A carer row exists but RLS filtered it out of the session query.
    // The access token is stale — treat as a session expiry.
    return { kind: "stale_session" };
  }

  if (user.email) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: teamMember } = await (admin as any)
      .from("team_members")
      .select("*")
      .eq("email", user.email)
      .maybeSingle();

    if (teamMember) {
      return { kind: "admin", teamMember: teamMember as TeamMember };
    }
  }

  return { kind: "no_record" };
}
