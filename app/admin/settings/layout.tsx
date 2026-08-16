import { checkSection } from "@/lib/auth/section-guard";
import { NotAuthorized } from "@/components/admin/NotAuthorized";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ok } = await checkSection("settings");
  if (!ok) return <NotAuthorized section="Settings" />;
  return <>{children}</>;
}
