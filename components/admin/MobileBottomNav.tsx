"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import type { TeamMember } from "@/lib/supabase/types";
import { hatsFor, navVisible } from "@/lib/permissions";
import {
  LayoutDashboard,
  MoreHorizontal,
  X,
  ExternalLink,
  Calculator,
  Mail,
  Settings,
  Backpack,
  Boxes,
  Radio,
  Users,
  Heart,
  Printer,
  ScanLine,
  Activity,
  Calendar,
  CalendarPlus,
  ReceiptText,
  Sparkles,
  ClipboardList,
  UserPlus,
  ShoppingBag,
  Image as ImageIcon,
} from "lucide-react";
import { useState } from "react";

// Task-based primary nav — reflects what the chair actually does day-to-day
// during the Back to School run-up + on the drive day itself. Everything
// non-critical lives in the More sheet grouped by workflow.
const primaryNav = [
  { name: "Home", href: "/admin", icon: LayoutDashboard, exact: true },
  { name: "B2S", href: "/admin/back-to-school", icon: Backpack },
  { name: "Stock", href: "/admin/back-to-school/stock", icon: Boxes },
  { name: "Day view", href: "/admin/back-to-school/day-view", icon: Radio },
];

interface MoreSection {
  label: string;
  items: Array<{
    name: string;
    href: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: any;
    external?: boolean;
  }>;
}

const moreSections: MoreSection[] = [
  {
    label: "Back to School",
    items: [
      { name: "Registrations", href: "/admin/back-to-school/registrations", icon: Users },
      { name: "Shopping list", href: "/admin/back-to-school/shopping-list", icon: ShoppingBag },
      { name: "Pick tickets", href: "/admin/back-to-school/tickets", icon: Printer },
      { name: "Stewards", href: "/admin/back-to-school/stewards", icon: ScanLine },
      { name: "Supplies", href: "/admin/back-to-school/supplies", icon: Backpack },
      { name: "Sponsors", href: "/admin/back-to-school/sponsors", icon: Heart },
    ],
  },
  {
    label: "Charity ops",
    items: [
      { name: "Events", href: "/admin/events", icon: Calendar },
      { name: "Event proposals", href: "/admin/events/proposals", icon: CalendarPlus },
      { name: "Gallery", href: "/admin/gallery", icon: ImageIcon },
      { name: "Gallery comments", href: "/admin/gallery/comments", icon: Mail },
      { name: "Festival 2026", href: "/admin/festival/vendors", icon: Sparkles },
      { name: "Accounting", href: "/admin/accounting", icon: Calculator },
      { name: "Expenses", href: "/admin/expenses", icon: ReceiptText },
      { name: "Donations", href: "/admin/donations", icon: Heart },
      { name: "Outcomes", href: "/admin/outcomes", icon: Activity },
      { name: "All registrations", href: "/admin/registrations", icon: Users },
      { name: "Subscribers", href: "/admin/subscribers", icon: UserPlus },
      { name: "Surveys", href: "/admin/surveys", icon: ClipboardList },
      { name: "Emails", href: "/admin/emails", icon: Mail },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Settings", href: "/admin/settings", icon: Settings },
      { name: "Visit website", href: "/", icon: ExternalLink, external: true },
    ],
  },
];

interface MobileBottomNavProps {
  teamMember: TeamMember | null;
}

export function MobileBottomNav({ teamMember }: MobileBottomNavProps) {
  const pathname = usePathname();
  const scrollDirection = useScrollDirection();
  const [showMore, setShowMore] = useState(false);
  const hats = hatsFor(teamMember);

  // Filter the More sheet by role — restricted sections don't tempt
  // users who can't open them. Primary bottom-bar entries are all
  // team-safe today, so no filtering there.
  const visibleMoreSections = moreSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.external || navVisible(hats, item.href)),
    }))
    .filter((section) => section.items.length > 0);

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <>
      {/* More sheet — dark backdrop */}
      {showMore && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More sheet — content */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 lg:hidden transition-transform duration-300 ease-out max-h-[80vh] overflow-y-auto",
          showMore ? "translate-y-0" : "translate-y-full",
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-black text-lg text-brand-dark">
              More
            </h3>
            <button
              onClick={() => setShowMore(false)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="space-y-5 pb-2">
            {visibleMoreSections.map((section) => (
              <div key={section.label}>
                <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-gray-500 mb-2 px-2">
                  {section.label}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) =>
                    item.external ? (
                      <a
                        key={item.name}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShowMore(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-brand-dark hover:bg-gray-50"
                      >
                        <item.icon className="w-5 h-5 text-gray-400" />
                        <span className="font-medium text-sm">{item.name}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-gray-400 ml-auto" />
                      </a>
                    ) : (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setShowMore(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                          isActive(item.href)
                            ? "bg-brand-blue text-white"
                            : "text-brand-dark hover:bg-gray-50",
                        )}
                      >
                        <item.icon
                          className={cn(
                            "w-5 h-5",
                            isActive(item.href) ? "text-white" : "text-gray-400",
                          )}
                        />
                        <span className="font-medium text-sm">{item.name}</span>
                      </Link>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom nav bar */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 lg:hidden transition-transform duration-300",
          scrollDirection === "down" ? "translate-y-full" : "translate-y-0",
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-around h-16">
          {primaryNav.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[60px] h-full px-1 transition-colors",
                  active ? "text-brand-blue" : "text-gray-500",
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-full transition-colors",
                    active && "bg-brand-blue/10",
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5",
                      active ? "text-brand-blue" : "text-gray-500",
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] mt-0.5 font-medium leading-none",
                    active ? "text-brand-blue" : "text-gray-500",
                  )}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}

          <button
            onClick={() => setShowMore(true)}
            className={cn(
              "flex flex-col items-center justify-center min-w-[60px] h-full px-1 transition-colors",
              showMore ? "text-brand-blue" : "text-gray-500",
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-full transition-colors",
                showMore && "bg-brand-blue/10",
              )}
            >
              <MoreHorizontal className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 font-medium leading-none">
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
