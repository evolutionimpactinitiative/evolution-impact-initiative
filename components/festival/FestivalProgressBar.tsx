import { FESTIVAL, FIRST_YEAR_STATS } from "@/lib/festival";

interface FestivalProgressBarProps {
  /**
   * Total raised so far in WHOLE POUNDS (matches how `donations.amount`
   * is stored throughout this codebase — see admin DonationsView).
   */
  raisedPounds: number;
  className?: string;
}

export function FestivalProgressBar({
  raisedPounds,
  className = "",
}: FestivalProgressBarProps) {
  const target = FESTIVAL.campaignTarget;
  const percent = Math.min(
    100,
    target > 0 ? Math.round((raisedPounds / target) * 100) : 0,
  );
  // £20 covers a full uniform package for one child (£10k target ÷ 500 kids)
  const childrenReached = Math.min(
    FIRST_YEAR_STATS.goalChildren,
    Math.floor(raisedPounds / 20),
  );

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
        <p className="font-heading text-sm uppercase tracking-widest text-brand-accent">
          Back to School 2026 campaign
        </p>
        <p className="text-xs text-white/60 font-heading">
          {percent}% of £{target.toLocaleString("en-GB")} goal
        </p>
      </div>

      <div className="flex items-baseline gap-3 mb-4">
        <span className="font-heading font-black text-3xl md:text-5xl text-brand-accent">
          £{raisedPounds.toLocaleString("en-GB")}
        </span>
        <span className="text-white/60 text-sm">
          raised of £{target.toLocaleString("en-GB")}
        </span>
      </div>

      <div
        className="h-3 bg-white/10 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Back to School campaign progress"
      >
        <div
          className="h-full bg-brand-accent rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="text-sm text-white/60 mt-4">
        That&apos;s {childrenReached.toLocaleString("en-GB")} of{" "}
        <span className="text-white font-semibold">
          {FIRST_YEAR_STATS.goalChildren} children
        </span>{" "}
        starting school with confidence.
      </p>
    </div>
  );
}
