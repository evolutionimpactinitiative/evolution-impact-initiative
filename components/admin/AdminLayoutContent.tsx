"use client";

import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

interface AdminLayoutContentProps {
  children: React.ReactNode;
  header: React.ReactNode;
}

export function AdminLayoutContent({ children, header }: AdminLayoutContentProps) {
  const { isCollapsed } = useSidebar();

  return (
    <div
      className={cn(
        "transition-all duration-300",
        isCollapsed ? "lg:pl-20" : "lg:pl-64"
      )}
    >
      {header}
      <main className="p-4 lg:p-6 pb-24 lg:pb-6">{children}</main>
    </div>
  );
}
