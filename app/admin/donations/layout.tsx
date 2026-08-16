import { checkSection } from "@/lib/auth/section-guard";
import { NotAuthorized } from "@/components/admin/NotAuthorized";

export default async function DonationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ok } = await checkSection("money");
  if (!ok) return <NotAuthorized section="Donations" />;
  return <>{children}</>;
}
