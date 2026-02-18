import { cn } from "@/lib/utils";

interface SectionLabelProps {
  text: string;
  color?: "brand-blue" | "brand-green" | "brand-accent" | "brand-dark" | "white";
  className?: string;
}

export function SectionLabel({ text, color = "brand-blue", className }: SectionLabelProps) {
  const colorClasses = {
    "brand-blue": "text-brand-blue border-brand-blue",
    "brand-green": "text-brand-green border-brand-green",
    "brand-accent": "text-brand-accent border-brand-accent",
    "brand-dark": "text-brand-dark border-brand-dark",
    "white": "text-white border-white",
  };

  return (
    <span
      className={cn(
        "section-label",
        colorClasses[color],
        className
      )}
    >
      {text}
    </span>
  );
}
