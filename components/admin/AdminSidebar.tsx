"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";
import type { User } from "@supabase/supabase-js";
import type { TeamMember } from "@/lib/supabase/types";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Heart,
  Mail,
  Settings,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  ClipboardList,
} from "lucide-react";

interface AdminSidebarProps {
  user: User;
  teamMember: TeamMember | null;
}

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Events", href: "/admin/events", icon: Calendar },
  { name: "Registrations", href: "/admin/registrations", icon: Users },
  { name: "Donations", href: "/admin/donations", icon: Heart },
  { name: "Subscribers", href: "/admin/subscribers", icon: UserPlus },
  { name: "Surveys", href: "/admin/surveys", icon: ClipboardList },
  { name: "Emails", href: "/admin/emails", icon: Mail },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar({ user, teamMember }: AdminSidebarProps) {
  const pathname = usePathname();
  const { isCollapsed, toggleCollapsed } = useSidebar();

  return (
    <>
      {/* Desktop sidebar */}
      <div
        className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300",
          isCollapsed ? "lg:w-20" : "lg:w-64"
        )}
      >
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-4 pb-4">
          {/* Logo */}
          <div className={cn(
            "flex h-20 shrink-0 items-center border-b border-gray-100",
            isCollapsed ? "justify-center" : "justify-between"
          )}>
            <Link href="/admin" className="flex items-center">
              {isCollapsed ? (
                // Icon logo when collapsed
                <Image
                  src="/logos/evolution_icon_1.svg"
                  alt="EII"
                  width={40}
                  height={40}
                  className="w-10 h-10"
                />
              ) : (
                // Full logo when expanded
                <Image
                  src="/logos/evolution_full_logo_1.svg"
                  alt="Evolution Impact Initiative"
                  width={180}
                  height={50}
                  className="h-12 w-auto"
                />
              )}
            </Link>

            {/* Collapse toggle button - only show when expanded */}
            {!isCollapsed && (
              <button
                onClick={toggleCollapsed}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Expand button when collapsed */}
          {isCollapsed && (
            <button
              onClick={toggleCollapsed}
              className="mx-auto p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Expand sidebar"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className={cn("-mx-2 space-y-1", isCollapsed && "mx-0")}>
                  {navigation.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/admin" && pathname.startsWith(item.href));
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          title={isCollapsed ? item.name : undefined}
                          className={cn(
                            "group flex gap-x-3 rounded-lg text-sm font-medium transition-colors",
                            isCollapsed
                              ? "justify-center px-3 py-3"
                              : "px-3 py-2.5",
                            isActive
                              ? "bg-brand-blue text-white"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          )}
                        >
                          <item.icon
                            className={cn(
                              "h-5 w-5 shrink-0",
                              isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                            )}
                          />
                          {!isCollapsed && item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>

              {/* Quick actions */}
              <li className="mt-auto">
                <Link
                  href="/"
                  target="_blank"
                  title={isCollapsed ? "View Website" : undefined}
                  className={cn(
                    "group flex gap-x-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors",
                    isCollapsed ? "justify-center px-3 py-3" : "px-3 py-2.5"
                  )}
                >
                  <ExternalLink className="h-5 w-5 shrink-0 text-gray-400 group-hover:text-gray-600" />
                  {!isCollapsed && "View Website"}
                </Link>
              </li>

              {/* User info */}
              <li className={cn("-mx-2 mt-2", isCollapsed && "mx-0")}>
                {isCollapsed ? (
                  // Collapsed: just show avatar
                  <div
                    className="flex justify-center"
                    title={teamMember?.name || "Team Member"}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue text-white font-heading font-bold text-sm">
                      {teamMember?.name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                    </div>
                  </div>
                ) : (
                  // Expanded: full user info
                  <div className="flex items-center gap-x-3 rounded-lg bg-gray-50 px-3 py-3 border border-gray-100">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue text-white font-heading font-bold text-sm">
                      {teamMember?.name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {teamMember?.name || "Team Member"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {teamMember?.role === "admin" ? "Administrator" : "Editor"}
                      </p>
                    </div>
                  </div>
                )}
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
