"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { TeamMember } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface AdminHeaderProps {
  user: User;
  teamMember: TeamMember | null;
}

export function AdminHeader({ user, teamMember }: AdminHeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 lg:px-6 shadow-sm">
      {/* Logo - visible on mobile */}
      <Link href="/admin" className="lg:hidden flex items-center gap-2">
        <Image
          src="/logos/evolution_icon_1.svg"
          alt="Evolution Impact Initiative"
          width={32}
          height={32}
          className="w-8 h-8"
        />
      </Link>

      {/* Separator - hidden on mobile now */}
      <div className="h-6 w-px bg-gray-200 lg:hidden" />

      {/* Page title area */}
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex items-center gap-x-4 lg:gap-x-6 flex-1">
          {/* Breadcrumb could go here */}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-x-4">
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 lg:mr-2" />
            <span className="hidden lg:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
