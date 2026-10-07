import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  effectivePermissions,
  roleKey,
  ROLE_LABELS,
  ROLE_PRESETS,
} from "@/lib/permissions-registry";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Member = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor" | "treasurer" | "safeguarding_lead";
  is_treasurer: boolean;
  permissions: string[];
};

export default async function TeamPermissionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: me } = await (admin as any)
    .from("team_members")
    .select("id, role, is_treasurer, permissions")
    .eq("email", user.email || "")
    .maybeSingle();
  if (!me) notFound();

  const myPerms = effectivePermissions(me.role, me.permissions, !!me.is_treasurer);
  if (!myPerms.has("team.manage")) {
    redirect("/admin/settings");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: membersData } = await (admin as any)
    .from("team_members")
    .select("id, name, email, role, is_treasurer, permissions")
    .order("name");
  const members: Member[] = (membersData as Member[] | null) ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-1.5 text-sm text-brand-blue hover:text-brand-dark mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>
        <h1 className="font-heading font-black text-2xl md:text-3xl text-gray-900">
          Team & permissions
        </h1>
        <p className="text-gray-600 mt-1 text-sm">
          Each team member&apos;s role sets a baseline. Tick extra permissions on
          top for anything they need beyond their role preset.
        </p>
      </div>

      <ul className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
        {members.map((m) => {
          const effective = effectivePermissions(m.role, m.permissions, !!m.is_treasurer);
          const baseline = new Set(ROLE_PRESETS[roleKey(m.role)]);
          const extraCount = m.permissions.filter((p) => !baseline.has(p as never)).length;
          const effectiveCount = effective.size;
          const label = ROLE_LABELS[roleKey(m.role)];
          return (
            <li key={m.id}>
              <Link
                href={`/admin/settings/team/${m.id}`}
                className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-gray-50 transition group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-brand-dark rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">
                      {m.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{m.name}</p>
                    <p className="text-xs text-gray-500 truncate">{m.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm text-gray-900 font-medium">{label}</p>
                    <p className="text-xs text-gray-500">
                      {effectiveCount} permission{effectiveCount === 1 ? "" : "s"}
                      {m.is_treasurer && " · treasurer"}
                      {extraCount > 0 && (
                        <span className="text-brand-blue">
                          {" "}· {extraCount} custom
                        </span>
                      )}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-blue" />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {members.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
          <Users className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">No team members yet.</p>
        </div>
      )}
    </div>
  );
}
