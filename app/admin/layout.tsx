import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminLayoutContent } from "@/components/admin/AdminLayoutContent";
import { SidebarProvider } from "@/contexts/SidebarContext";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get team member info
  const { data: teamMember } = await supabase
    .from("team_members")
    .select("*")
    .eq("email", user.email || "")
    .single();

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar user={user} teamMember={teamMember} />
        <AdminLayoutContent
          header={<AdminHeader user={user} teamMember={teamMember} />}
        >
          {children}
        </AdminLayoutContent>
      </div>
    </SidebarProvider>
  );
}
