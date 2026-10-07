import Link from "next/link";
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
  Star,
  ListChecks,
  Baby,
} from "lucide-react";

// Slim admin stat card: uppercase caption, big bold number, small
// coloured icon chip top-right. Whole card is a link when `href` is
// set. Accepts both:
//   • modern API — label + icon (ReactNode) + iconTint
//   • legacy API — title + icon (string from iconMap) + iconColor/iconBgColor
// so the shared card can drop into any admin page that previously used
// StatCard without rewriting every call site.

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
  Star,
  ListChecks,
  Baby,
} as const;

type IconName = keyof typeof iconMap;

interface GlanceCardProps {
  /** New API: short label (sentence case; rendered uppercase). */
  label?: string;
  /** Legacy alias for `label`. */
  title?: string;
  value: string | number;
  /** New API: pass a lucide icon as a ReactNode with your own classes. */
  icon?: React.ReactNode | IconName;
  /** New API: Tailwind classes for the icon chip (bg + text colour). */
  iconTint?: string;
  /** Legacy API: separate colour classes, merged into a chip for us. */
  iconColor?: string;
  iconBgColor?: string;
  href?: string;
  subtitle?: string;
  /** Legacy prop retained for backward compat — ignored. */
  linkText?: string;
  className?: string;
}

function resolveIcon(icon: GlanceCardProps["icon"]): React.ReactNode | null {
  if (!icon) return null;
  if (typeof icon === "string") {
    const Cmp = iconMap[icon as IconName];
    if (!Cmp) return null;
    return <Cmp className="w-4 h-4" />;
  }
  return icon;
}

export function GlanceCard({
  label,
  title,
  value,
  icon,
  iconTint,
  iconColor,
  iconBgColor,
  href,
  subtitle,
  className = "",
}: GlanceCardProps) {
  const resolvedLabel = label ?? title ?? "";
  const resolvedIcon = resolveIcon(icon);
  // Merge legacy iconColor + iconBgColor into a single chip tint.
  const chipTint =
    iconTint ??
    [iconBgColor ?? "bg-brand-blue/10", iconColor ?? "text-brand-blue"].join(" ");

  const base =
    "block bg-white rounded-xl border border-gray-100 shadow-sm p-4 transition hover:border-brand-blue/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/60";

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 leading-snug">
          {resolvedLabel}
        </p>
        {resolvedIcon && (
          <span
            className={
              "flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0 " +
              chipTint
            }
          >
            {resolvedIcon}
          </span>
        )}
      </div>
      <p className="text-2xl lg:text-3xl font-black text-brand-dark mt-3">
        {value}
      </p>
      {subtitle && (
        <p className="text-[11px] text-gray-500 mt-1 leading-snug">{subtitle}</p>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${base} ${className}`}>
        {body}
      </Link>
    );
  }
  return <div className={`${base} cursor-default ${className}`}>{body}</div>;
}
