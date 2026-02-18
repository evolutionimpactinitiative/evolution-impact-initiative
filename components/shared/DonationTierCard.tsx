import { cn } from "@/lib/utils";

interface DonationTierCardProps {
  amount: string;
  description: string;
  color?: "brand-blue" | "brand-green" | "brand-dark";
  className?: string;
}

export function DonationTierCard({
  amount,
  description,
  color = "brand-blue",
  className,
}: DonationTierCardProps) {
  const colorClasses = {
    "brand-blue": "hover:border-brand-blue",
    "brand-green": "hover:border-brand-green",
    "brand-dark": "hover:border-brand-dark",
  };

  const textClasses = {
    "brand-blue": "text-brand-blue",
    "brand-green": "text-brand-green",
    "brand-dark": "text-brand-dark",
  };

  return (
    <div
      className={cn(
        "bg-white border-2 border-brand-dark/10 rounded-lg p-6 transition-all hover:shadow-lg",
        colorClasses[color],
        className
      )}
    >
      <p className={cn("font-heading font-black text-3xl mb-3", textClasses[color])}>
        {amount}
      </p>
      <p className="text-brand-dark/70 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
