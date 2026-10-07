import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { effectivePermissions } from "@/lib/permissions-registry";
import { MemberPermissionsForm } from "./MemberPermissionsForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { params: Promise<{ id: string }> };

export default async function EditMemberPermissionsPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: me } = await (admin as any)
    .from("team_members")
    .select("id, role, is_treasurer, permissions, email")
    .eq("email", user.email || "")
    .maybeSingle();
  if (!me) notFound();
  const myPerms = effectivePermissions(me.role, me.permissions, !!me.is_treasurer);
  if (!myPerms.has("team.manage")) {
    redirect("/admin/settings");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: member } = await (admin as any)
    .from("team_members")
    .select("id, name, email, role, is_treasurer, permissions")
    .eq("id", id)
    .maybeSingle();
  if (!member) notFound();

  const isSelf = member.id === me.id;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div>
        <Link
          href="/admin/settings/team"
          className="inline-flex items-center gap-1.5 text-sm text-brand-blue hover:text-brand-dark mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to team
        </Link>
        <h1 className="font-heading font-black text-2xl md:text-3xl text-gray-900">
          {member.name}
        </h1>
        <p className="text-gray-600 mt-1 text-sm">
          {member.email}
          {isSelf && (
            <span className="ml-2 text-xs uppercase tracking-wider font-bold text-brand-blue">
              · you
            </span>
          )}
        </p>
      </div>

      <MemberPermissionsForm member={member} isSelf={isSelf} />
    </div>
  );
}
