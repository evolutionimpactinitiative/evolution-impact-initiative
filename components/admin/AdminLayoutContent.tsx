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
        isCollapsed ? "lg:pl-20" : "lg:pl-64",
      )}
    >
      {header}
      <main
        className="px-4 pt-4 lg:p-6"
        style={{
          // Bottom nav is 4rem (h-16) plus a bit of clearance so scroll
          // targets never sit under it. Safe-area handled by nav itself.
          paddingBottom: `calc(6rem + env(safe-area-inset-bottom))`,
        }}
      >
        {children}
      </main>
    </div>
  );
}
