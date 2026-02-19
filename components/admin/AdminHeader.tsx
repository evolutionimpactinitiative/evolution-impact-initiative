"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { TeamMember } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Calendar,
  Users,
  Heart,
  Mail,
  Settings,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminHeaderProps {
  user: User;
  teamMember: TeamMember | null;
}

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Events", href: "/admin/events", icon: Calendar },
  { name: "Registrations", href: "/admin/registrations", icon: Users },
  { name: "Donations", href: "/admin/donations", icon: Heart },
  { name: "Emails", href: "/admin/emails", icon: Mail },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminHeader({ user, teamMember }: AdminHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      {/* Desktop header */}
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-6 shadow-sm">
        {/* Mobile menu button */}
        <button
          type="button"
          className="lg:hidden -m-2.5 p-2.5 text-gray-700"
          onClick={() => setMobileMenuOpen(true)}
        >
          <span className="sr-only">Open menu</span>
          <Menu className="h-6 w-6" />
        </button>

        {/* Separator */}
        <div className="h-6 w-px bg-gray-200 lg:hidden" />

        {/* Page title area */}
        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div className="flex items-center gap-x-4 lg:gap-x-6 flex-1">
            {/* Breadcrumb could go here */}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-x-4">
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Menu panel */}
          <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white border-r border-gray-200 p-6">
            {/* Close button */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-brand-blue rounded-lg flex items-center justify-center">
                  <span className="font-heading font-black text-white text-sm">EII</span>
                </div>
                <span className="font-heading font-bold text-gray-900 text-lg">Admin</span>
              </div>
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-brand-blue text-white"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="absolute bottom-6 left-6 right-6 space-y-4">
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <ExternalLink className="h-5 w-5" />
                View Website
              </Link>

              {/* User info */}
              <div className="flex items-center gap-x-3 rounded-lg bg-gray-50 px-3 py-3 border border-gray-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue text-white font-heading font-bold text-sm">
                  {teamMember?.name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {teamMember?.name || "Team Member"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
