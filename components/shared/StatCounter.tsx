import { cn } from "@/lib/utils";

interface StatCounterProps {
  value: string;
  label: string;
  className?: string;
}

export function StatCounter({ value, label, className }: StatCounterProps) {
  return (
    <div className={cn("text-center", className)}>
      <p className="font-heading font-black text-4xl md:text-5xl text-brand-blue">
        {value}
      </p>
      <p className="text-sm uppercase tracking-wider text-brand-dark/70 mt-1">
        {label}
      </p>
    </div>
  );
}
