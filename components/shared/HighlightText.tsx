import { cn } from "@/lib/utils";

interface HighlightTextProps {
  children: React.ReactNode;
  variant?: "accent" | "blue";
  className?: string;
}

export function HighlightText({ children, variant = "accent", className }: HighlightTextProps) {
  const variantClasses = {
    accent: "bg-brand-accent text-brand-dark px-2",
    blue: "bg-brand-blue text-white px-1",
  };

  return (
    <span className={cn(variantClasses[variant], className)}>
      {children}
    </span>
  );
}
