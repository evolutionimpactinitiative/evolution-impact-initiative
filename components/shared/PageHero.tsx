import { cn } from "@/lib/utils";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function PageHero({ title, subtitle, className }: PageHeroProps) {
  return (
    <section className={cn("bg-brand-pale/50 pt-32 pb-16", className)}>
      <div className="container mx-auto px-4">
        <h1 className="font-heading font-black text-4xl md:text-5xl lg:text-6xl text-brand-dark mb-4">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg md:text-xl text-brand-dark/70 max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
