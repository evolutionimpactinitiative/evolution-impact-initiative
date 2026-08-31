import Image from "next/image";

// Funder credit for the Growing Together programme.
// Logo file lives at /public/logos/BBC_Children_in_Need_2022.svg
// (Grantee brand-pack — do not recolour, do not resize the mark
// independently of the wordmark.)
// Emails use the text-only fallback because most email clients strip
// or refuse to render SVG.

interface Props {
  variant?: "full" | "compact";
  className?: string;
}

const CIN_LOGO_SRC = "/logos/BBC_Children_in_Need_2022.svg";

export function FundedByCiN({ variant = "full", className = "" }: Props) {
  if (variant === "compact") {
    return (
      <div className={`inline-flex items-center gap-3 ${className}`}>
        <Image
          src={CIN_LOGO_SRC}
          alt="BBC Children in Need"
          width={72}
          height={40}
          className="h-8 w-auto"
        />
        <span className="text-xs text-brand-dark/70 font-heading font-semibold uppercase tracking-wider">
          Funder
        </span>
      </div>
    );
  }

  return (
    <div
      className={`bg-white border border-brand-dark/10 rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center gap-6 md:gap-8 ${className}`}
    >
      <div className="flex-shrink-0">
        <Image
          src={CIN_LOGO_SRC}
          alt="BBC Children in Need"
          width={180}
          height={100}
          className="h-20 md:h-24 w-auto"
        />
      </div>
      <div className="text-center md:text-left">
        <p className="text-xs font-heading font-bold text-brand-dark/60 uppercase tracking-[0.15em] mb-2">
          Supported by
        </p>
        <p className="font-heading font-black text-xl md:text-2xl text-brand-dark mb-2">
          BBC Children in Need
        </p>
        <p className="text-sm md:text-base text-brand-dark/70 max-w-lg">
          Growing Together is delivered by Evolution Impact Initiative CIC as part of the{" "}
          <strong>We Move Fwd: Foundations</strong> Early Years programme.
        </p>
      </div>
    </div>
  );
}
