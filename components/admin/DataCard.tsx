"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface DataCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function DataCard({ children, className, onClick }: DataCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-gray-100 shadow-sm p-4 transition-shadow hover:shadow-md",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface DataCardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function DataCardHeader({ children, className }: DataCardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      {children}
    </div>
  );
}

interface DataCardContentProps {
  children: ReactNode;
  className?: string;
}

export function DataCardContent({ children, className }: DataCardContentProps) {
  return (
    <div className={cn("mt-3 space-y-2", className)}>
      {children}
    </div>
  );
}

interface DataCardRowProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export function DataCardRow({ label, value, className }: DataCardRowProps) {
  return (
    <div className={cn("flex items-center justify-between text-sm", className)}>
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium text-right">{value}</span>
    </div>
  );
}

interface DataCardActionsProps {
  children: ReactNode;
  className?: string;
}

export function DataCardActions({ children, className }: DataCardActionsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 mt-4 pt-4 border-t border-gray-100",
        className
      )}
    >
      {children}
    </div>
  );
}

interface DataCardBadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
  className?: string;
}

export function DataCardBadge({
  children,
  variant = "default",
  className,
}: DataCardBadgeProps) {
  const variants = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    error: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
