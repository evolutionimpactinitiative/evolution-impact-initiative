"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Users,
  Heart,
  TrendingUp,
  Mail,
  CheckCircle,
  Clock,
  XCircle,
  Gift,
  UserCheck,
  ClipboardList,
} from "lucide-react";

const iconMap = {
  Calendar,
  Users,
  Heart,
  TrendingUp,
  Mail,
  CheckCircle,
  Clock,
  XCircle,
  Gift,
  UserCheck,
  ClipboardList,
} as const;

type IconName = keyof typeof iconMap;

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: IconName;
  iconColor?: string;
  iconBgColor?: string;
  href?: string;
  /** Legacy prop retained for backward compatibility — the card is now clickable
   *  as a whole when `href` is set, so the per-card "View" link is no longer rendered. */
  linkText?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  /** "hero" — larger number, more padding; used on the main admin dashboard.
   *  "compact" (default) — original size for in-page stat strips. */
  size?: "hero" | "compact";
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconColor = "text-brand-blue",
  iconBgColor = "bg-brand-blue/10",
  href,
  trend,
  size = "compact",
  className,
}: StatCardProps) {
  const Icon = iconMap[icon];
  const isHero = size === "hero";
  const clickable = Boolean(href);

  const padding = isHero ? "p-5 lg:p-6" : "p-4 lg:p-5";
  const titleClass = isHero
    ? "text-[11px] uppercase tracking-wider font-bold text-gray-500"
    : "text-sm font-medium text-gray-500";
  const valueClass = isHero
    ? "text-4xl lg:text-5xl font-black text-brand-dark"
    : "text-2xl lg:text-3xl font-bold text-brand-dark";
  const subtitleClass = isHero
    ? "text-xs text-gray-500 mt-1"
    : "text-xs text-gray-400 mt-1";
  const iconBoxClass = isHero
    ? "w-9 h-9 lg:w-10 lg:h-10 rounded-lg"
    : "w-10 h-10 lg:w-12 lg:h-12 rounded-xl";
  const iconSizeClass = isHero ? "w-4 h-4 lg:w-5 lg:h-5" : "w-5 h-5 lg:w-6 lg:h-6";

  const cardBase =
    "block bg-white rounded-xl border border-gray-100 shadow-sm transition hover:border-brand-blue/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/60";

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className={cn(titleClass, "truncate")}>{title}</p>
        <div
          className={cn(
            "flex items-center justify-center flex-shrink-0",
            iconBoxClass,
            iconBgColor,
          )}
        >
          <Icon className={cn(iconSizeClass, iconColor)} />
        </div>
      </div>
      <div className={cn("flex items-baseline gap-2", isHero ? "mt-4" : "mt-2")}>
        <p className={valueClass}>{value}</p>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium px-1.5 py-0.5 rounded",
              trend.isPositive
                ? "text-green-700 bg-green-100"
                : "text-red-700 bg-red-100",
            )}
          >
            {trend.isPositive ? "+" : ""}
            {trend.value}%
          </span>
        )}
      </div>
      {subtitle && <p className={subtitleClass}>{subtitle}</p>}
    </>
  );

  if (clickable && href) {
    return (
      <Link href={href} className={cn(cardBase, padding, className)}>
        {body}
      </Link>
    );
  }

  return <div className={cn(cardBase, padding, "cursor-default", className)}>{body}</div>;
}
