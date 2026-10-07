import Link from "next/link";

// Slim admin stat card: uppercase caption, big bold number, small
// coloured icon chip top-right. Whole card is a link when `href` is
// set. Shared by /admin and /admin/growing-together so the two
// dashboards stay in visual sync.
export function GlanceCard({
  label,
  value,
  icon,
  iconTint,
  href,
  subtitle,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconTint: string; // tailwind classes for bg + text colour of the icon chip
  href?: string;
  subtitle?: string;
}) {
  const base =
    "block bg-white rounded-xl border border-gray-100 shadow-sm p-4 transition hover:border-brand-blue/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/60";
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 leading-snug">
          {label}
        </p>
        <span
          className={
            "flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0 " +
            iconTint
          }
        >
          {icon}
        </span>
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
      <Link href={href} className={base}>
        {body}
      </Link>
    );
  }
  return <div className={base + " cursor-default"}>{body}</div>;
}
