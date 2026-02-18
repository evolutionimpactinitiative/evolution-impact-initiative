import { cn } from "@/lib/utils";

interface TestimonialCardProps {
  quote: string;
  author: string;
  borderColor?: "brand-blue" | "brand-green" | "brand-dark";
  className?: string;
}

export function TestimonialCard({
  quote,
  author,
  borderColor = "brand-blue",
  className,
}: TestimonialCardProps) {
  const borderClasses = {
    "brand-blue": "border-l-brand-blue",
    "brand-green": "border-l-brand-green",
    "brand-dark": "border-l-brand-dark",
  };

  return (
    <blockquote
      className={cn(
        "border-l-4 pl-4 py-2",
        borderClasses[borderColor],
        className
      )}
    >
      <p className="text-brand-dark/80 italic mb-2">&ldquo;{quote}&rdquo;</p>
      <cite className="text-sm text-brand-dark/60 not-italic">— {author}</cite>
    </blockquote>
  );
}
