import Image from "next/image";

// Funder credit for the Growing Together programme.
// Drop the official BBC Children in Need logo at:
//   /public/logos/bbc-children-in-need.png   (raster fallback)
//   /public/logos/bbc-children-in-need.svg   (preferred)
// Files come from the grantee brand pack — don't source them elsewhere.

interface Props {
  variant?: "full" | "compact";
  className?: string;
}

export function FundedByCiN({ variant = "full", className = "" }: Props) {
  if (variant === "compact") {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <Image
          src="/logos/bbc-children-in-need.svg"
          alt="BBC Children in Need"
          width={64}
          height={32}
          className="h-6 w-auto"
        />
        <span className="text-xs text-brand-dark/70">
          Funded by BBC Children in Need
        </span>
      </div>
    );
  }

  return (
    <div
      className={`bg-white border border-brand-dark/10 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 ${className}`}
    >
      <Image
        src="/logos/bbc-children-in-need.svg"
        alt="BBC Children in Need"
        width={160}
        height={80}
        className="h-16 md:h-20 w-auto flex-shrink-0"
      />
      <div className="text-center md:text-left">
        <p className="text-xs font-heading font-bold text-brand-dark/60 uppercase tracking-wider mb-1">
          Supported by
        </p>
        <p className="font-heading font-black text-lg md:text-xl text-brand-dark">
          BBC Children in Need
        </p>
        <p className="text-sm text-brand-dark/70 mt-1">
          Growing Together is delivered by Evolution Impact Initiative CIC as part of the
          BBC Children in Need <strong>We Move Fwd: Foundations</strong> Early Years programme.
        </p>
      </div>
    </div>
  );
}
