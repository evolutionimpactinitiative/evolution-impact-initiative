import Link from "next/link";
import Image from "next/image";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FundedByCiN } from "@/components/shared/FundedByCiN";
import { PortalSignOutButton } from "./PortalSignOutButton";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Unread notification count. Uses the admin client so RLS doesn't need
  // the carer session (layout runs for admins/stale sessions too — they
  // just see 0).
  let unreadCount = 0;
  if (user) {
    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (admin as any)
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null);
    unreadCount = count ?? 0;
  }

  return (
    <div className="min-h-screen bg-brand-pale/40 flex flex-col">
      {/* Header matches the main site Navbar shape so Growing Together
          feels like a room inside Evolution, not a separate website. */}
      <header className="sticky top-0 z-40 h-20 bg-white/95 backdrop-blur-md shadow-sm">
        <nav className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" aria-label="Evolution Impact Initiative — Home" className="flex-shrink-0">
              <Image
                src="/logos/evolution_full_logo_1.svg"
                alt="Evolution Impact Initiative"
                width={200}
                height={48}
                className="w-[160px] sm:w-[200px] h-auto transition-all"
                priority
              />
            </Link>
            <span className="hidden md:inline-block h-6 border-l border-brand-dark/20" />
            <Link
              href="/growing-together"
              className="hidden md:inline-block font-heading font-black text-brand-blue text-sm uppercase tracking-wider hover:text-brand-dark"
            >
              Growing Together
            </Link>
          </div>

          {user ? (
            <div className="flex items-center gap-4 sm:gap-6">
              <Link
                href="/portal"
                className="hidden sm:inline-block font-heading text-sm font-semibold text-brand-dark hover:text-brand-blue transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/portal/family"
                className="hidden sm:inline-block font-heading text-sm font-semibold text-brand-dark hover:text-brand-blue transition-colors"
              >
                My Family
              </Link>
              <Link
                href="/portal/our-village"
                className="hidden sm:inline-block font-heading text-sm font-semibold text-brand-dark hover:text-brand-blue transition-colors"
              >
                Our Village
              </Link>
              <Link
                href="/portal/notifications"
                aria-label={
                  unreadCount > 0
                    ? `Notifications (${unreadCount} unread)`
                    : "Notifications"
                }
                className="relative text-brand-dark hover:text-brand-blue transition-colors"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-green text-white text-[10px] font-bold leading-[18px] text-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
              <PortalSignOutButton />
            </div>
          ) : (
            <Link
              href="/portal/login"
              className="font-heading text-sm font-semibold text-brand-dark hover:text-brand-blue transition-colors"
            >
              Log in
            </Link>
          )}
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-brand-dark/10 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-xs text-brand-dark/60 space-y-3">
          <div className="flex justify-center">
            <FundedByCiN variant="compact" />
          </div>
          <p>
            Growing Together · Evolution Impact Initiative CIC · Company No. 16667870
          </p>
          <p>
            <Link href="/growing-together" className="text-brand-blue hover:underline">
              About the programme
            </Link>
            <span className="mx-2">·</span>
            <Link href="/privacy-policy" className="text-brand-blue hover:underline">
              Privacy
            </Link>
            <span className="mx-2">·</span>
            <Link href="/safeguarding" className="text-brand-blue hover:underline">
              Safeguarding
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
