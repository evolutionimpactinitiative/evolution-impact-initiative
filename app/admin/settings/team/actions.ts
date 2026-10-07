"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PERMISSIONS,
  type PermissionKey,
  effectivePermissions,
} from "@/lib/permissions-registry";

async function requireTeamManager() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: me } = await (admin as any)
    .from("team_members")
    .select("id, role, is_treasurer, permissions")
    .eq("email", user.email || "")
    .maybeSingle();
  if (!me) throw new Error("Team members only");

  const effective = effectivePermissions(me.role, me.permissions, !!me.is_treasurer);
  if (!effective.has("team.manage")) {
    throw new Error("You don't have permission to manage the team.");
  }
  return me as {
    id: string;
    role: string;
    is_treasurer: boolean;
    permissions: string[];
  };
}

const VALID_ROLES = new Set([
  "admin",
  "editor",
  "treasurer",
  "safeguarding_lead",
]);

const VALID_KEYS = new Set(PERMISSIONS.map((p) => p.key));

export async function updateTeamMemberPermissions(params: {
  memberId: string;
  role: "admin" | "editor" | "treasurer" | "safeguarding_lead";
  isTreasurer: boolean;
  extras: string[];
}): Promise<void> {
  await requireTeamManager();
  if (!VALID_ROLES.has(params.role)) throw new Error("Invalid role");

  const cleaned = Array.from(new Set(
    params.extras.filter((k) => VALID_KEYS.has(k as PermissionKey)),
  ));

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("team_members")
    .update({
      role: params.role,
      is_treasurer: params.isTreasurer,
      permissions: cleaned,
    })
    .eq("id", params.memberId);
  if (error) throw error;

  revalidatePath("/admin/settings/team");
  revalidatePath(`/admin/settings/team/${params.memberId}`);
  revalidatePath("/admin/settings");
}
