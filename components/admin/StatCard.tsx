"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
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
  linkText?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
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
  linkText,
  trend,
  className,
}: StatCardProps) {
  const Icon = iconMap[icon];

  return (
    <div className={cn("bg-white rounded-xl border border-gray-100 shadow-sm p-4 lg:p-6", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl lg:text-3xl font-bold text-brand-dark">
              {value}
            </p>
            {trend && (
              <span
                className={cn(
                  "text-xs font-medium px-1.5 py-0.5 rounded",
                  trend.isPositive
                    ? "text-green-700 bg-green-100"
                    : "text-red-700 bg-red-100"
                )}
              >
                {trend.isPositive ? "+" : ""}
                {trend.value}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className={cn(
            "flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex-shrink-0",
            iconBgColor
          )}
        >
          <Icon className={cn("w-5 h-5 lg:w-6 lg:h-6", iconColor)} />
        </div>
      </div>
      {href && linkText && (
        <Link
          href={href}
          className="flex items-center gap-1 text-sm text-brand-blue hover:text-brand-dark mt-4 font-medium transition-colors"
        >
          {linkText}
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
