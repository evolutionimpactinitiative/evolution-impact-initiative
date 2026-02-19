"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Heart,
  MoreHorizontal,
  Mail,
  Settings,
  X,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";

const primaryNav = [
  { name: "Home", href: "/admin", icon: LayoutDashboard },
  { name: "Events", href: "/admin/events", icon: Calendar },
  { name: "Registrations", href: "/admin/registrations", icon: Users },
  { name: "Donations", href: "/admin/donations", icon: Heart },
];

const moreNav = [
  { name: "Emails", href: "/admin/emails", icon: Mail, external: false },
  { name: "Settings", href: "/admin/settings", icon: Settings, external: false },
  { name: "Visit Website", href: "/", icon: ExternalLink, external: true },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const scrollDirection = useScrollDirection();
  const [showMore, setShowMore] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* More Menu Overlay */}
      {showMore && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More Menu Sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 lg:hidden transition-transform duration-300 ease-out",
          showMore ? "translate-y-0" : "translate-y-full"
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-lg text-brand-dark">
              More Options
            </h3>
            <button
              onClick={() => setShowMore(false)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="space-y-1">
            {moreNav.map((item) =>
              item.external ? (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowMore(false)}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl transition-colors text-gray-700 hover:bg-gray-100"
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </a>
              ) : (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setShowMore(false)}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-xl transition-colors",
                    isActive(item.href)
                      ? "bg-brand-blue text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 lg:hidden transition-transform duration-300",
          scrollDirection === "down" ? "translate-y-full" : "translate-y-0"
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-around h-16">
          {primaryNav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[64px] h-full px-2 transition-colors",
                  active ? "text-brand-blue" : "text-gray-500"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full transition-colors",
                    active && "bg-brand-blue/10"
                  )}
                >
                  <item.icon
                    className={cn("w-5 h-5", active && "text-brand-blue")}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] mt-0.5 font-medium",
                    active ? "text-brand-blue" : "text-gray-500"
                  )}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}

          {/* More Button */}
          <button
            onClick={() => setShowMore(true)}
            className={cn(
              "flex flex-col items-center justify-center min-w-[64px] h-full px-2 transition-colors",
              showMore ? "text-brand-blue" : "text-gray-500"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full transition-colors",
                showMore && "bg-brand-blue/10"
              )}
            >
              <MoreHorizontal className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
