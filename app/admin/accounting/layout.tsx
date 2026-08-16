import { checkSection } from "@/lib/auth/section-guard";
import { NotAuthorized } from "@/components/admin/NotAuthorized";

export default async function AccountingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ok } = await checkSection("money");
  if (!ok) return <NotAuthorized section="Accounting" />;
  return <>{children}</>;
}
