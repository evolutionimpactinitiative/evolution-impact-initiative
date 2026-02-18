import { cn } from "@/lib/utils";

interface PolaroidCardProps {
  children: React.ReactNode;
  rotation?: "rotate-1" | "-rotate-1" | "rotate-2" | "-rotate-2" | "none";
  tapeStyle?: "top" | "corner" | "none";
  borderColor?: "brand-blue" | "brand-green" | "brand-dark" | "brand-accent";
  className?: string;
}

export function PolaroidCard({
  children,
  rotation = "none",
  tapeStyle = "none",
  borderColor,
  className,
}: PolaroidCardProps) {
  const rotationClasses = {
    "rotate-1": "rotate-1",
    "-rotate-1": "-rotate-1",
    "rotate-2": "rotate-2",
    "-rotate-2": "-rotate-2",
    "none": "",
  };

  const borderClasses = {
    "brand-blue": "border-t-4 border-t-brand-blue",
    "brand-green": "border-t-4 border-t-brand-green",
    "brand-dark": "border-t-4 border-t-brand-dark",
    "brand-accent": "border-t-4 border-t-brand-accent",
  };

  return (
    <div
      className={cn(
        "polaroid relative",
        rotationClasses[rotation],
        borderColor && borderClasses[borderColor],
        className
      )}
    >
      {tapeStyle === "top" && <div className="tape tape-top" />}
      {tapeStyle === "corner" && <div className="tape tape-corner" />}
      {children}
    </div>
  );
}
