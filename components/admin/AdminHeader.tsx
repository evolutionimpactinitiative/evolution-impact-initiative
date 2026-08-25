"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { TeamMember } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { LogOut, ChevronLeft } from "lucide-react";

interface AdminHeaderProps {
  user: User;
  teamMember: TeamMember | null;
}

// Small router-driven title lookup. First matching prefix wins, so deeper
// routes (e.g. "/admin/back-to-school/stock") beat their parents.
const TITLE_MAP: Array<{ prefix: string; title: string; exact?: boolean }> = [
  { prefix: "/admin/back-to-school/collection", title: "Collection Day" },
  { prefix: "/admin/back-to-school/registrations", title: "Registrations" },
  { prefix: "/admin/back-to-school/shopping-list", title: "Shopping list" },
  { prefix: "/admin/back-to-school/stock", title: "Stock" },
  { prefix: "/admin/back-to-school/count", title: "Stock count" },
  { prefix: "/admin/back-to-school/day-view", title: "Day view" },
  { prefix: "/admin/back-to-school/tickets", title: "Bag labels" },
  { prefix: "/admin/back-to-school/stewards", title: "Stewards" },
  { prefix: "/admin/back-to-school/supplies", title: "Supplies" },
  { prefix: "/admin/back-to-school/sponsors", title: "Sponsors" },
  { prefix: "/admin/back-to-school", title: "Back to School" },
  { prefix: "/admin/gallery/comments", title: "Gallery comments" },
  { prefix: "/admin/gallery/albums", title: "Album" },
  { prefix: "/admin/gallery", title: "Gallery" },
  { prefix: "/admin/festival", title: "Festival 2026" },
  { prefix: "/admin/accounting", title: "Accounting" },
  { prefix: "/admin/expenses", title: "Expenses" },
  { prefix: "/admin/outcomes", title: "Outcomes" },
  { prefix: "/admin/registrations", title: "All registrations" },
  { prefix: "/admin/donations", title: "Donations" },
  { prefix: "/admin/subscribers", title: "Subscribers" },
  { prefix: "/admin/surveys", title: "Surveys" },
  { prefix: "/admin/events", title: "Events" },
  { prefix: "/admin/emails", title: "Emails" },
  { prefix: "/admin/settings", title: "Settings" },
  { prefix: "/admin", title: "Admin", exact: true },
];

function titleForPath(pathname: string): string {
  const match = TITLE_MAP.find((entry) =>
    entry.exact ? pathname === entry.prefix : pathname.startsWith(entry.prefix),
  );
  return match?.title ?? "Admin";
}

export function AdminHeader({ user, teamMember: _teamMember }: AdminHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const isRoot = pathname === "/admin";
  const title = titleForPath(pathname);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header
      className="sticky top-0 z-40 flex shrink-0 items-center gap-x-3 border-b border-gray-200 bg-white/95 backdrop-blur px-3 lg:px-6 shadow-sm"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        minHeight: `calc(3.5rem + env(safe-area-inset-top))`,
      }}
    >
      {/* Mobile — back button + title */}
      <div className="lg:hidden flex items-center gap-2 flex-1 min-w-0 h-14">
        {isRoot ? (
          <Link href="/admin" className="flex items-center gap-2">
            <Image
              src="/logos/evolution_icon_1.svg"
              alt="EII"
              width={32}
              height={32}
              className="w-8 h-8"
            />
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Back"
            className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full text-brand-dark active:bg-gray-100"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        <p className="font-heading font-black text-brand-dark text-lg truncate">
          {title}
        </p>
      </div>

      {/* Desktop — leave the header mostly empty for now; page-level headers
          carry the H1. Just show sign-out. */}
      <div className="hidden lg:flex flex-1 gap-x-4 self-stretch items-center h-16">
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Mobile — small avatar + sign-out access via long-press? No, keep it
          simple with a tiny sign-out button so nobody's ever stuck. */}
      <button
        type="button"
        onClick={handleSignOut}
        aria-label="Sign out"
        title={`Sign out (${user.email ?? ""})`}
        className="lg:hidden flex items-center justify-center w-10 h-10 -mr-1 rounded-full text-gray-500 active:bg-gray-100"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </header>
  );
}
