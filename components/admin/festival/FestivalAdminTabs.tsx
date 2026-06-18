"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin/festival/vendors", label: "Vendors" },
  { href: "/admin/festival/sponsors", label: "Sponsors" },
  { href: "/admin/festival/volunteers", label: "Volunteers" },
  { href: "/admin/festival/check-in", label: "Check-in" },
  { href: "/admin/festival/test-ticket-email", label: "Test email" },
];

export function FestivalAdminTabs() {
  const pathname = usePathname();

  return (
    <div className="border-b border-gray-200 -mt-2 mb-4">
      <nav className="flex gap-1 overflow-x-auto" aria-label="Festival admin tabs">
        {TABS.map((t) => {
          const isActive = pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "px-4 py-2.5 text-sm font-heading font-semibold whitespace-nowrap border-b-2 transition-colors",
                isActive
                  ? "border-brand-blue text-brand-blue"
                  : "border-transparent text-gray-500 hover:text-gray-700",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
